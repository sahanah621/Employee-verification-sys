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

/**
 * Helper to safely resolve the Ethereum provider (handles multiple wallet extensions)
 */
function getEthereumProvider(): any {
  if (typeof window === "undefined") return null;
  const anyWin = window as any;
  if (!anyWin.ethereum) return null;

  // Handle multi-wallet environments (e.g., MetaMask alongside Coinbase, Phantom, etc.)
  if (Array.isArray(anyWin.ethereum.providers)) {
    const mmProvider = anyWin.ethereum.providers.find((p: any) => p.isMetaMask);
    if (mmProvider) return mmProvider;
    return anyWin.ethereum.providers[0];
  }

  return anyWin.ethereum;
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
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      const msg = "MetaMask wallet was not detected. Please install or enable MetaMask in your browser.";
      console.warn("[WorkProof Web3]", msg);
      setError(msg);
      return;
    }

    setIsConnecting(true);
    setError(null);
    console.info("[WorkProof Web3] Requesting account access via eth_requestAccounts...");

    try {
      // EIP-1193 direct request ensures MetaMask window/popup triggers reliably
      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts were authorized or returned from wallet.");
      }

      const browserProvider = new ethers.BrowserProvider(ethereum);
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();

      const currentAccount = ethers.getAddress(accounts[0]);
      const currentChainId = Number(network.chainId);

      setAccount(currentAccount);
      setChainId(currentChainId);
      setProvider(browserProvider);
      setSigner(currentSigner);

      console.info("[WorkProof Web3] Wallet successfully connected:", {
        account: currentAccount,
        chainId: currentChainId,
      });
    } catch (err: any) {
      console.error("[WorkProof Web3] Failed to connect wallet:", err);
      if (err.code === 4001 || err?.info?.error?.code === 4001) {
        setError("Connection request rejected in MetaMask.");
      } else {
        setError(err.message || "Failed to connect wallet");
      }
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
    const ethereum = getEthereumProvider();
    if (!ethereum || !ethereum.request) return;

    const hexChainId = "0x" + EXPECTED_CHAIN_ID.toString(16);

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // Error 4902 indicates chain has not been added yet
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await ethereum.request({
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

  // Auto-connect if wallet is already connected/authorized for this site
  useEffect(() => {
    const ethereum = getEthereumProvider();
    if (!ethereum || !ethereum.request) return;

    ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          try {
            const browserProvider = new ethers.BrowserProvider(ethereum);
            const network = await browserProvider.getNetwork();
            const currentSigner = await browserProvider.getSigner();

            setAccount(ethers.getAddress(accounts[0]));
            setChainId(Number(network.chainId));
            setProvider(browserProvider);
            setSigner(currentSigner);
            console.info("[WorkProof Web3] Auto-connected existing session for:", accounts[0]);
          } catch (autoErr) {
            console.warn("[WorkProof Web3] Auto-connect error:", autoErr);
          }
        }
      })
      .catch((err: any) => {
        console.warn("[WorkProof Web3] Auto-connect check failed:", err);
      });
  }, []);

  // Sync employer profile whenever account changes
  useEffect(() => {
    refreshEmployerStatus();
  }, [refreshEmployerStatus]);

  // Listen to MetaMask account & chain changes
  useEffect(() => {
    const ethereum = getEthereumProvider();
    if (!ethereum || !ethereum.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        const nextAccount = ethers.getAddress(accounts[0]);
        setAccount(nextAccount);
        const browserProvider = new ethers.BrowserProvider(ethereum);
        setProvider(browserProvider);
        browserProvider.getSigner().then(setSigner).catch(console.error);
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
  }, [disconnect]);

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
