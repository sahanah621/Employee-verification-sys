import { ethers } from "ethers";
import { config } from "./env";
import { EMPLOYMENT_REGISTRY_ABI } from "./EmploymentRegistryAbi";

let cachedProvider: ethers.JsonRpcProvider | null = null;
let cachedInterface: ethers.Interface | null = null;

/**
 * Creates or returns the cached ethers Interface for EmploymentRegistry.
 */
export const getInterface = (): ethers.Interface => {
  if (!cachedInterface) {
    cachedInterface = new ethers.Interface(EMPLOYMENT_REGISTRY_ABI);
  }
  return cachedInterface;
};

/**
 * Ethereum JSON-RPC provider configuration for on-chain queries.
 */
export const getProvider = (): ethers.JsonRpcProvider => {
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl, undefined, {
      staticNetwork: ethers.Network.from({ name: "hardhat", chainId: 31337 }),
      batchMaxCount: 1,
    });
  }
  return cachedProvider;
};

/**
 * Contract address loaded from environment configuration.
 */
export const CONTRACT_ADDRESS = config.blockchain.contractAddress;

/**
 * RPC URL loaded from environment configuration.
 */
export const RPC_URL = config.blockchain.rpcUrl;

/**
 * Helper to obtain a signer wallet connected to the provider.
 * NOTE: Used strictly for local testing and CLI/development scripts.
 * Production user operations are signed client-side via MetaMask.
 */
export const getDevSigner = (privateKey?: string): ethers.Wallet => {
  const key = privateKey || config.blockchain.devPrivateKey;
  if (!key) {
    throw new Error(
      "No private key configured for development transaction execution."
    );
  }
  const provider = getProvider();
  return new ethers.Wallet(key, provider);
};

/**
 * Helper to obtain an instance of the EmploymentRegistry contract.
 */
export const getEmploymentRegistryContract = (
  runner?: ethers.ContractRunner
): ethers.Contract => {
  const contractRunner = runner || getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, getInterface(), contractRunner);
};
