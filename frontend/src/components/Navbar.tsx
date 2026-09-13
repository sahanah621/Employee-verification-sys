import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Wallet,
  Building2,
  User,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const {
    account,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    isRegisteredEmployer,
    employerProfile,
    connect,
    disconnect,
    switchNetwork,
  } = useWeb3();

  const navLinks = [
    { name: "Overview", path: "/", icon: ShieldCheck },
    { name: "Employer Portal", path: "/employer", icon: Building2 },
    { name: "Employee Portal", path: "/employee", icon: User },
    { name: "Verifier Portal", path: "/verification", icon: CheckCircle2 },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="flex items-center space-x-2 text-emerald-400 font-bold text-xl tracking-tight hover:text-emerald-300 transition-colors"
            >
              <ShieldCheck className="w-7 h-7" />
              <span>WorkProof</span>
            </Link>
            <span className="hidden lg:inline-block px-2.5 py-0.5 text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-full">
              Ethereum + IPFS
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive =
                link.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.path);
              const Icon = link.icon;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-800 text-emerald-400 shadow-inner"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Section: Network & Wallet */}
          <div className="flex items-center space-x-3">
            {isConnected && !isCorrectNetwork && (
              <button
                onClick={switchNetwork}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-950/80 text-amber-400 border border-amber-800/60 hover:bg-amber-900/80 transition-colors"
                title="Click to switch to Hardhat Localhost Network (Chain ID 31337)"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Switch to Localhost</span>
              </button>
            )}

            {isConnected && isRegisteredEmployer && employerProfile && (
              <span className="hidden xl:inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                <Building2 className="w-3.5 h-3.5" />
                <span className="max-w-[130px] truncate">{employerProfile.employerName}</span>
              </span>
            )}

            {isConnected && account ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                  title="Disconnect Wallet"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-emerald-900/40 active:scale-[0.98]"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
