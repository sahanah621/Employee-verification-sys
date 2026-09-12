import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  blockchain: {
    rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
    contractAddress: process.env.CONTRACT_ADDRESS || "",
  },
  ipfs: {
    pinataJwt: process.env.PINATA_JWT || "",
    pinataGateway: process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/",
  },
  crypto: {
    // Development placeholder key reference (32 bytes hex)
    masterKey: process.env.MASTER_ENCRYPTION_KEY || "",
  },
};
