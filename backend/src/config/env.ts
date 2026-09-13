import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  blockchain: {
    rpcUrl: process.env.ETH_RPC_URL || process.env.RPC_URL || "http://127.0.0.1:8545",
    contractAddress: process.env.EMPLOYMENT_REGISTRY_ADDRESS || process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    // Development/testing signer private key (isolated strictly for automated testing and local development)
    devPrivateKey: process.env.BACKEND_PRIVATE_KEY || "",
  },
  ipfs: {
    pinataJwt: process.env.PINATA_JWT || "",
    pinataGateway: process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/",
  },
  crypto: {
    masterKey:
      process.env.MASTER_ENCRYPTION_KEY ||
      (process.env.NODE_ENV === "production"
        ? ""
        : "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  },
};
