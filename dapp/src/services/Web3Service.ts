import { ethers } from "ethers";
import ABI from './ABI.json';
import { doApiLogin } from "./APIService";

const ADAPTER_ADDRESS = `${process.env.REACT_APP_ADAPTER_ADDRESS}`;

export enum Profile {
  RESIDENT,
  COUNSELOR,
  MANAGER
}

export type LoginResult = {
  token: string;
  account: string;
  profile: Profile;
}

export type Resident = {
  wallet: string;
  isCounselor: boolean;
  isManager: boolean;
  residence: number;
  nextPayment: number;
}

export type ResidentPage = {
  residents: Resident[];
  total: ethers.BigNumberish;
}

function getProfile(): Profile {
  return parseInt(localStorage.getItem("profile") || "0");
}

function getProvider(): ethers.BrowserProvider {
  if (!window.ethereum) throw new Error("No MetaMask found");
  return new ethers.BrowserProvider(window.ethereum);
}

function getContract(provider?: ethers.BrowserProvider): ethers.Contract {
  if (!provider) provider = getProvider();
  return new ethers.Contract(ADAPTER_ADDRESS, ABI as ethers.InterfaceAbi, provider)
}

async function getContractSigner(provider?: ethers.BrowserProvider): Promise<ethers.Contract> {
  if (!provider) provider = getProvider();
  const signer = await provider.getSigner(localStorage.getItem("account") || undefined);
  const contract = new ethers.Contract(ADAPTER_ADDRESS, ABI as ethers.InterfaceAbi, provider);
  return contract.connect(signer) as ethers.Contract;
}

export async function doLogin(): Promise<LoginResult> {
  const provider = getProvider();
  const accounts = await provider.send("eth_requestAccounts", []);
  if (!accounts || !accounts.length) throw new Error("Wallet not found/allowed.");
  const account = accounts[0];
  const contract = getContract(provider);
  const resident = (await contract.getResident(account)) as Resident;
  let isManager = resident.isManager;

  if (!isManager && resident.residence > 0) {
    if (resident.isCounselor)
      localStorage.setItem("profile", `${Profile.COUNSELOR}`);
    else
      localStorage.setItem("profile", `${Profile.RESIDENT}`);
  } else if (!isManager && !resident.residence) {
    const manager: string = await contract.getManager();
    isManager = manager.toLowerCase() == account.toLowerCase();
  }
  if (isManager)
    localStorage.setItem("profile", `${Profile.MANAGER}`);
  else if (localStorage.getItem("profile") === null)
    throw new Error("Unauthorized");

  localStorage.setItem("account", account);

  // Retrieve the signer object from the provider
  const signer = await provider.getSigner();
  const timestamp = Date.now();
  const message = `Authentication to condominium. Timestamp: ${timestamp}`;
  // Sign the message using the signer's private key and store the signed message (secret)
  const secret = await signer.signMessage(message);
  const token = await doApiLogin(account, secret, timestamp);
  localStorage.setItem("token", token);

  return {
    token,
    account,
    profile: parseInt(localStorage.getItem("profile") || "0")
  } as LoginResult;
}

export function doLogout() {
  localStorage.removeItem("profile");
  localStorage.removeItem("account");
  localStorage.removeItem("token");
}

export function getAddress(): Promise<string> {
  const contract = getContract();
  return contract.getImplementationAddress();
}

export async function upgrade(address: string): Promise<ethers.Transaction> {
  if (getProfile() !== Profile.MANAGER) throw new Error("You do not have permission.")
  const contract = await getContractSigner();
  return contract.upgrade(address) as Promise<ethers.Transaction>;
}

export async function addResident(wallet: string, residenceId: number): Promise<ethers.Transaction> {
  if (getProfile() === Profile.RESIDENT) throw new Error("You do not have permission.")
  const contract = await getContractSigner();
  return contract.addResident(wallet, residenceId) as Promise<ethers.Transaction>;
}

export function isManager(): boolean {
  return getProfile() === Profile.MANAGER;
}
export function isResident(): boolean {
  return getProfile() === Profile.RESIDENT;
}

export async function getResident(wallet: string): Promise<Resident> {
  const contract = getContract();
  return contract.getResident(wallet) as Promise<Resident>;
}

export async function getResidents(page: number = 1, pageSize: number = 10): Promise<ResidentPage> {
  const contract = getContract();
  const result = await contract.getResidents(page, pageSize) as ResidentPage;
  const residents = result.residents
    .filter(r => r.residence).sort((a, b) => {
      if (a.residence > b.residence) return 1;
      return -1;
    })

  return {
    residents,
    total: result.total
  } as ResidentPage;
}

export async function removeResidents(wallet: string): Promise<ethers.Transaction> {
  if (getProfile() !== Profile.MANAGER) throw new Error("You do not have permission.")
  const contract = await getContractSigner();
  return contract.removeResident(wallet) as Promise<ethers.Transaction>;
}

export async function setCounselor(wallet: string, isEntering: boolean): Promise<ethers.Transaction> {
  if (getProfile() !== Profile.MANAGER) throw new Error("You do not have permission.")
  const contract = await getContractSigner();
  return contract.setCounselor(wallet, isEntering) as Promise<ethers.Transaction>;
}
