import { ethers } from "hardhat";

async function main() {
  console.log("Deploying EmploymentRegistry smart contract...");

  const EmploymentRegistry = await ethers.getContractFactory("EmploymentRegistry");
  const registry = await EmploymentRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`EmploymentRegistry deployed successfully to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
