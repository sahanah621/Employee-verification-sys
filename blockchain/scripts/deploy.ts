import { ethers } from "hardhat";

async function main() {
  console.log("==================================================");
  console.log("Deploying WorkProof EmploymentRegistry contract...");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);

  const EmploymentRegistryFactory = await ethers.getContractFactory("EmploymentRegistry");
  const registry = await EmploymentRegistryFactory.deploy();

  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  const deploymentTx = registry.deploymentTransaction();

  console.log("--------------------------------------------------");
  console.log(`EmploymentRegistry deployed successfully!`);
  console.log(`Contract Address : ${contractAddress}`);
  if (deploymentTx) {
    console.log(`Transaction Hash : ${deploymentTx.hash}`);
    console.log(`Block Number     : ${deploymentTx.blockNumber}`);
  }
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment failed with error:", error);
  process.exitCode = 1;
});
