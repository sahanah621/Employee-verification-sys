import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Wallet, Building2, User, CheckCircle2 } from "lucide-react";

interface NavbarProps {
  account: string | null;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  isConnected,
  onConnect,
  onDisconnect,
}) => {
  const location = useLocation();

  const navLinks = [
    { name: "Overview", path: "/" },
    { name: "Employer Portal", path: "/employer", icon: Building2 },
    { name: "Employee Portal", path: "/employee", icon: User },
    { name: "Verifier Portal", path: "/verification", icon: CheckCircle2 },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 text-emerald-400 font-bold text-xl tracking-tight">
              <ShieldCheck className="w-7 h-7" />
              <span>WorkProof</span>
            </Link>
            <span className="hidden md:inline-block px-2.5 py-0.5 text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-full">
              Ethereum + IPFS
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div>
            {isConnected && account ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
                <button
                  onClick={onDisconnect}
                  className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-emerald-900/40"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
