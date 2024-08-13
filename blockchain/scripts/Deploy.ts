import { ethers } from "hardhat";

async function main() {
  const Condominium = await ethers.getContractFactory("Condominium");
  const contract = await Condominium.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`Contract deployed to: ${contractAddress}`);

  const CondominiumAdapter = await ethers.getContractFactory("CondominiumAdapter");
  const adapter = await CondominiumAdapter.deploy();

  await adapter.waitForDeployment();
  const adapterAddress = await adapter.getAddress();
  console.log(`CondominiumAdapter deployed to: ${adapterAddress}`);

  await adapter.upgrade(contractAddress);
  console.log(`CondominiumAdapter upgraded to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});