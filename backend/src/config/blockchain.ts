import { ethers } from "ethers";
import { config } from "./env";

/**
 * Ethereum JSON-RPC provider configuration placeholder
 */
export const getProvider = (): ethers.JsonRpcProvider => {
  return new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
};

export const CONTRACT_ADDRESS = config.blockchain.contractAddress;
