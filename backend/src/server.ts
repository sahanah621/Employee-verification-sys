import app from "./app";
import { config } from "./config/env";

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` WorkProof Backend Service running`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Port: ${PORT}`);
  console.log(` RPC Endpoint: ${config.blockchain.rpcUrl}`);
  console.log(`========================================`);
});
