import { useMemo } from "react";
import { ethers } from "ethers";
import { getContract } from "../services/blockchain";

export function useContract(runner: ethers.ContractRunner | null) {
  const contract = useMemo(() => {
    if (!runner) return null;
    return getContract(runner);
  }, [runner]);

  return contract;
}
