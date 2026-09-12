import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, UploadCloud } from "lucide-react";

export const CreateAttestation: React.FC = () => {
  const [formData, setFormData] = useState({
    employeeAddress: "",
    position: "",
    startDate: "",
    endDate: "",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/employer"
        className="inline-flex items-center space-x-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Employer Dashboard</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-white">Create Employment Attestation</h2>
          <p className="text-slate-400 text-sm mt-1">
            Attestation metadata is anchored to Ethereum. Supporting documents are encrypted with AES-256-GCM and stored on IPFS.
          </p>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Employee Wallet Address</label>
            <input
              type="text"
              placeholder="0x..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-sm"
              value={formData.employeeAddress}
              onChange={(e) => setFormData({ ...formData, employeeAddress: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Job Title / Position</label>
            <input
              type="text"
              placeholder="e.g. Senior Software Engineer"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Start Date</label>
              <input
                type="date"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">End Date</label>
              <input
                type="date"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Supporting Document (Encrypted to IPFS)</label>
            <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/50">
              <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-300">Select certificate, experience letter, or recommendation</p>
              <p className="text-xs text-slate-500 mt-1">File will be encrypted with AES-256-GCM before IPFS upload</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-colors shadow-md"
            >
              <Shield className="w-4 h-4" />
              <span>Issue Attestation on Ethereum</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
