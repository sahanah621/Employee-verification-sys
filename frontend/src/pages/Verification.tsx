import React, { useState } from "react";
import { Search, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

export const Verification: React.FC = () => {
  const [attestationId, setAttestationId] = useState("");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-2 text-sky-400 text-sm font-medium mb-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>Verifier Portal</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Attestation Verification</h1>
        <p className="text-slate-400 text-sm mt-1">
          Directly query Ethereum smart contracts to authenticate employment credentials and request private supporting documents.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <label className="text-sm font-medium text-slate-300">Lookup Attestation by ID</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Enter 0x... attestation hash ID"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono text-sm"
              value={attestationId}
              onChange={(e) => setAttestationId(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify on Blockchain</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-white">No Attestation Selected</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Enter an Attestation ID above to inspect on-chain validity, issuer identity, employment tenure, and request supporting document access.
        </p>
      </div>
    </div>
  );
};
