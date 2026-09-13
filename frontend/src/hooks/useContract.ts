import { useMemo } from "react";
import { ethers } from "ethers";
import { getContract, getReadOnlyContract } from "../services/blockchain";

export function useContract(runner?: ethers.ContractRunner | null) {
  const contract = useMemo(() => {
    if (!runner) return getReadOnlyContract();
    return getContract(runner);
  }, [runner]);

  return contract;
}
