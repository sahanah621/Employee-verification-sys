import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Building2, FileSpreadsheet } from "lucide-react";

export const EmployerDashboard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-sm font-medium mb-1">
            <Building2 className="w-4 h-4" />
            <span>Employer Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Employer Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage organization profile and issued employment attestations.</p>
        </div>

        <Link
          to="/employer/create"
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Issue New Attestation</span>
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Attestations Issued</p>
          <p className="text-3xl font-extrabold text-white mt-2">0</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Attestations</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">0</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Revoked Attestations</p>
          <p className="text-3xl font-extrabold text-rose-400 mt-2">0</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-white">No Attestations Created Yet</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Start by issuing a new tamper-proof employment attestation on the Ethereum blockchain.
        </p>
      </div>
    </div>
  );
};
