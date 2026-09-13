import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import {
  getContract,
  getReadOnlyContract,
  EXPECTED_CHAIN_ID,
  RPC_URL,
} from "../services/blockchain";
import { EmployerProfile } from "../types/workproof";

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: ethers.Contract | null;
  readOnlyContract: ethers.Contract;
  isRegisteredEmployer: boolean;
  employerProfile: EmployerProfile | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  refreshEmployerStatus: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isRegisteredEmployer, setIsRegisteredEmployer] = useState(false);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);

  const readOnlyContract = useMemo(() => getReadOnlyContract(), []);

  const contract = useMemo(() => {
    if (!signer) return null;
    return getContract(signer);
  }, [signer]);

  const isCorrectNetwork = useMemo(() => {
    if (!chainId) return true; // not connected yet
    return chainId === EXPECTED_CHAIN_ID;
  }, [chainId]);

  const refreshEmployerStatus = useCallback(async () => {
    if (!account) {
      setIsRegisteredEmployer(false);
      setEmployerProfile(null);
      return;
    }

    try {
      const isReg = await readOnlyContract.isEmployerRegistered(account);
      setIsRegisteredEmployer(isReg);

      if (isReg) {
        const profile = await readOnlyContract.employers(account);
        setEmployerProfile({
          employerAddress: profile.employerAddress,
          employerName: profile.employerName,
          isRegistered: profile.isRegistered,
          registrationTimestamp: Number(profile.registrationTimestamp),
        });
      } else {
        setEmployerProfile(null);
      }
    } catch (err) {
      console.warn("Could not check employer registration status:", err);
      setIsRegisteredEmployer(false);
      setEmployerProfile(null);
    }
  }, [account, readOnlyContract]);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("MetaMask wallet is not detected in your browser.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();

      const currentAccount = accounts[0] ? ethers.getAddress(accounts[0]) : null;
      const currentChainId = Number(network.chainId);

      setAccount(currentAccount);
      setChainId(currentChainId);
      setProvider(browserProvider);
      setSigner(currentSigner);
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setIsRegisteredEmployer(false);
    setEmployerProfile(null);
    setError(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    const hexChainId = "0x" + EXPECTED_CHAIN_ID.toString(16);

    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // Error 4902 indicates chain has not been added yet
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hexChainId,
                chainName: "Hardhat Localhost",
                rpcUrls: [RPC_URL],
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError: any) {
          setError(`Failed to add network: ${addError.message}`);
        }
      } else {
        setError(`Failed to switch network: ${switchError.message}`);
      }
    }
  }, []);

  // Sync employer profile whenever account changes
  useEffect(() => {
    refreshEmployerStatus();
  }, [refreshEmployerStatus]);

  // Listen to MetaMask account & chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(ethers.getAddress(accounts[0]));
        if (provider) {
          provider.getSigner().then(setSigner).catch(console.error);
        }
      }
    };

    const handleChainChanged = (newChainIdHex: string) => {
      setChainId(parseInt(newChainIdHex, 16));
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [provider, disconnect]);

  const value = useMemo(
    () => ({
      account,
      chainId,
      isCorrectNetwork,
      isConnected: !!account,
      isConnecting,
      error,
      provider,
      signer,
      contract,
      readOnlyContract,
      isRegisteredEmployer,
      employerProfile,
      connect,
      disconnect,
      switchNetwork,
      refreshEmployerStatus,
    }),
    [
      account,
      chainId,
      isCorrectNetwork,
      isConnecting,
      error,
      provider,
      signer,
      contract,
      readOnlyContract,
      isRegisteredEmployer,
      employerProfile,
      connect,
      disconnect,
      switchNetwork,
      refreshEmployerStatus,
    ]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export function useWeb3(): Web3ContextType {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
