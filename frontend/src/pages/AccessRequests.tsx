import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Inbox } from "lucide-react";

export const AccessRequests: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/employee"
        className="inline-flex items-center space-x-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Employee Dashboard</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2 text-teal-400 text-sm font-medium mb-1">
            <Lock className="w-4 h-4" />
            <span>Document Consent Management</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Verifier Access Requests</h2>
          <p className="text-slate-400 text-sm mt-1">
            Verifiers requesting to decrypt and view your supporting documents stored on IPFS.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center space-y-3">
          <div className="w-10 h-10 mx-auto bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
            <Inbox className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white">No Pending Requests</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When potential employers or verifiers request access to your private documents, they will appear here for your cryptographic approval.
          </p>
        </div>
      </div>
    </div>
  );
};
