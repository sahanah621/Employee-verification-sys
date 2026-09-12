import React from "react";
import { Link } from "react-router-dom";
import { User, KeyRound, ShieldAlert } from "lucide-react";

export const EmployeeDashboard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-sm font-medium mb-1">
            <User className="w-4 h-4" />
            <span>Employee Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Career Attestations</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review employment credentials issued to your wallet and manage verifier document access.
          </p>
        </div>

        <Link
          to="/employee/requests"
          className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-lg border border-slate-700 transition-colors"
        >
          <KeyRound className="w-4 h-4 text-teal-400" />
          <span>Manage Access Requests</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto bg-slate-800 rounded-full flex items-center justify-center text-teal-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-white">No Attestations Found</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Connect your employee wallet to view attestations anchored to your address on Ethereum.
        </p>
      </div>
    </div>
  );
};
