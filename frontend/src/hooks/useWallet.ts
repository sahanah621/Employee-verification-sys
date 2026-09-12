import { useState, useCallback } from "react";
import { ethers } from "ethers";

export interface WalletState {
  account: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    account: null,
    chainId: null,
    provider: null,
    signer: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setWallet((prev) => ({ ...prev, error: "MetaMask not detected" }));
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const signer = await browserProvider.getSigner();

      setWallet({
        account: accounts[0] || null,
        chainId: Number(network.chainId),
        provider: browserProvider,
        signer,
        isConnected: !!accounts[0],
        isConnecting: false,
        error: null,
      });
    } catch (err: any) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.message || "Failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      account: null,
      chainId: null,
      provider: null,
      signer: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  return {
    ...wallet,
    connect,
    disconnect,
  };
}
