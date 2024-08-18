import { ethers } from "ethers";
import ABI from './ABI.json';

const ADAPTER_ADDRESS = `${process.env.REACT_APP_ADAPTER_ADDRESS}`;

export enum Profile {
  RESIDENT,
  COUNCELOR,
  MANAGER
}

export type LoginResult = {
  account: string;
  profile: Profile
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
  const account = accounts[0].toLowerCase();
  const contract = getContract(provider);
  const manager: string = await contract.getManager();
  const isManager = manager.toLowerCase() === account;

  const profile: Profile = isManager ? Profile.MANAGER : Profile.RESIDENT;
  localStorage.setItem("profile", `${profile}`);
  localStorage.setItem("account", account);
  return {
    account,
    profile
  } as LoginResult;
}

export function doLogout() {
  localStorage.removeItem("profile");
  localStorage.removeItem("account");
}