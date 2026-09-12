import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Landing } from "./pages/Landing";
import { EmployerDashboard } from "./pages/EmployerDashboard";
import { CreateAttestation } from "./pages/CreateAttestation";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { AccessRequests } from "./pages/AccessRequests";
import { Verification } from "./pages/Verification";
import { useWallet } from "./hooks/useWallet";

export const App: React.FC = () => {
  const { account, isConnected, connect, disconnect } = useWallet();

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar
          account={account}
          isConnected={isConnected}
          onConnect={connect}
          onDisconnect={disconnect}
        />
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
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          WorkProof &copy; {new Date().getFullYear()} — Privacy-Preserving Blockchain Employment Attestation Network
        </footer>
      </div>
    </Router>
  );
};

export default App;
