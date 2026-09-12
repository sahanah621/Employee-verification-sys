import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, FileCheck2, Building2, User, Search, ArrowRight } from "lucide-react";

export const Landing: React.FC = () => {
  return (
    <div className="space-y-16 py-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>Decentralized & Privacy-Preserving</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Trustless Employment Attestation on <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Ethereum & IPFS</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Empowering employers to issue tamper-proof credentials, employees to own their career records with cryptographic privacy, and verifiers to instantly authenticate credentials.
        </p>
      </section>

      {/* Role Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-950 border border-emerald-800/50 rounded-xl flex items-center justify-center text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Employer Portal</h3>
            <p className="text-sm text-slate-400">
              Issue tamper-proof employment attestations, compute deterministic hashes, and anchor records on-chain.
            </p>
          </div>
          <div className="pt-6">
            <Link
              to="/employer"
              className="inline-flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 text-sm font-semibold"
            >
              <span>Enter Employer Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-teal-950 border border-teal-800/50 rounded-xl flex items-center justify-center text-teal-400">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Employee Portal</h3>
            <p className="text-sm text-slate-400">
              View your issued credentials, manage private supporting documents, and grant or deny verifier access requests.
            </p>
          </div>
          <div className="pt-6">
            <Link
              to="/employee"
              className="inline-flex items-center space-x-2 text-teal-400 hover:text-teal-300 text-sm font-semibold"
            >
              <span>Enter Employee Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-sky-950 border border-sky-800/50 rounded-xl flex items-center justify-center text-sky-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Verifier Portal</h3>
            <p className="text-sm text-slate-400">
              Directly verify attestation validity against the smart contract and request access to encrypted supporting files.
            </p>
          </div>
          <div className="pt-6">
            <Link
              to="/verification"
              className="inline-flex items-center space-x-2 text-sky-400 hover:text-sky-300 text-sm font-semibold"
            >
              <span>Enter Verifier Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Core Security & Privacy Pillars */}
      <section className="max-w-5xl mx-auto px-4 pt-8">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Architectural Guarantees</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-200">Ethereum Authoritative State</h4>
                <p className="text-xs text-slate-400 mt-1">Smart contracts hold immutable attestations, hashes, and access permissions.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-200">AES-256-GCM + IPFS</h4>
                <p className="text-xs text-slate-400 mt-1">Private supporting files are encrypted before pinning. Plaintext files never hit IPFS.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FileCheck2 className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-200">Zero Database Dependency</h4>
                <p className="text-xs text-slate-400 mt-1">Decentralized registry eliminates single points of failure and database leaks.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
