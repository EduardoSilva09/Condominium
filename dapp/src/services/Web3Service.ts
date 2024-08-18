import { ethers } from "ethers";
import ABI from './ABI.json';

const ADAPTER_ADDRESS = `${process.env.REACT_APP_ADAPTER_ADDRESS}`;

export enum Profile {
  RESIDENT,
  COUNSELOR,
  MANAGER
}

export type LoginResult = {
  account: string;
  profile: Profile
}

export type Resident = {
  wallet: string;
  isCounselor: boolean;
  isManager: boolean;
  residence: number;
  nextPayment: number;
}

function getProvider(): ethers.BrowserProvider {
  if (!window.ethereum) throw new Error("No MetaMask found");
  return new ethers.BrowserProvider(window.ethereum);
}

function getContract(provider?: ethers.BrowserProvider): ethers.Contract {
  if (!provider) provider = getProvider();
  return new ethers.Contract(ADAPTER_ADDRESS, ABI as ethers.InterfaceAbi, provider)
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
  return {
    account,
    profile: parseInt(localStorage.getItem("profile") || "0")
  } as LoginResult;
}

export function doLogout() {
  localStorage.removeItem("profile");
  localStorage.removeItem("account");
}