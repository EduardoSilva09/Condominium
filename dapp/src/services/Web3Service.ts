import { ethers } from "ethers";

function getProvider(): ethers.BrowserProvider {
  if (!window.ethereum) throw new Error("No MetaMask found");
  return new ethers.BrowserProvider(window.ethereum);
}

export async function doLogin(): Promise<string> {
  const provider = getProvider();
  console.log(provider);

  const accounts = await provider.send("eth_requestAccounts", []);
  console.log(accounts);

  if (!accounts || !accounts.length) throw new Error("Wallet not found/allowed.");
  localStorage.setItem("account", accounts[0]);
  return accounts[0];
}