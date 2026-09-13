import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Landing } from "./pages/Landing";
import { EmployerDashboard } from "./pages/EmployerDashboard";
import { CreateAttestation } from "./pages/CreateAttestation";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { AccessRequests } from "./pages/AccessRequests";
import { Verification } from "./pages/Verification";
import { Web3Provider, useWeb3 } from "./context/Web3Context";
import { AlertCircle, RefreshCw } from "lucide-react";

const AppContent: React.FC = () => {
  const { isConnected, isCorrectNetwork, chainId, switchNetwork } = useWeb3();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {isConnected && !isCorrectNetwork && (
        <div className="bg-amber-950 border-b border-amber-800/80 px-4 py-2.5 text-amber-200 text-xs sm:text-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Wrong Network Detected:</strong> You are connected to Chain ID #{chainId}. WorkProof smart contracts are deployed on Hardhat Localhost (Chain ID #31337).
              </span>
            </div>
            <button
              onClick={switchNetwork}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Switch to Localhost (31337)</span>
            </button>
          </div>
        </div>
      )}

      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/employer" element={<EmployerDashboard />} />
          <Route path="/employer/create" element={<CreateAttestation />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/employee/requests" element={<AccessRequests />} />
          <Route path="/verification" element={<Verification />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WorkProof &copy; {new Date().getFullYear()} — Privacy-Preserving Blockchain Employment Attestation</span>
          <span className="text-slate-600 font-mono">Solidity 0.8.20 &bull; AES-256-GCM &bull; IPFS Pinata</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Web3Provider>
      <Router>
        <AppContent />
      </Router>
    </Web3Provider>
  );
};

export default App;
