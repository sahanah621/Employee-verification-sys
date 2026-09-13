import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  User,
  KeyRound,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Ban,
  CheckCircle,
  Search,
  RefreshCw,
  Loader2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { Attestation, EmploymentStatus } from "../types/workproof";

interface EnrichedAttestation extends Attestation {
  employerName: string;
}

export const EmployeeDashboard: React.FC = () => {
  const { account, isConnected, readOnlyContract, connect } = useWeb3();

  const [attestations, setAttestations] = useState<EnrichedAttestation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Manual Hash Search
  const [searchHash, setSearchHash] = useState("");
  const [isSearchingHash, setIsSearchingHash] = useState(false);
  const [hashSearchResults, setHashSearchResults] = useState<EnrichedAttestation[] | null>(null);
  const [hashSearchError, setHashSearchError] = useState<string | null>(null);

  const loadEmployeeData = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      // 1. Fetch attestation IDs by employee wallet
      const ids: bigint[] = await readOnlyContract.getEmployeeAttestationsByWallet(account);
      const fetched: EnrichedAttestation[] = [];
      let pendingCount = 0;

      for (const id of ids) {
        const att = await readOnlyContract.getAttestation(id);
        const employerProfile = await readOnlyContract.employers(att.employer);

        fetched.push({
          attestationId: Number(att.attestationId),
          employeeHash: att.employeeHash,
          employee: att.employee,
          employer: att.employer,
          employerName: employerProfile.employerName || "Registered Employer",
          position: att.position,
          startDate: Number(att.startDate),
          endDate: Number(att.endDate),
          status: Number(att.status) as EmploymentStatus,
          recordHash: att.recordHash,
          documentHash: att.documentHash,
          ipfsCID: att.ipfsCID,
          issueTimestamp: Number(att.issueTimestamp),
        });

        // Check for pending access requests on this attestation
        const reqIds: bigint[] = await readOnlyContract.getAttestationAccessRequests(id);
        for (const reqId of reqIds) {
          const req = await readOnlyContract.getAccessRequest(reqId);
          if (Number(req.status) === 0) {
            // RequestStatus.PENDING
            pendingCount++;
          }
        }
      }

      setAttestations(fetched.sort((a, b) => b.attestationId - a.attestationId));
      setPendingRequestsCount(pendingCount);
    } catch (err) {
      console.error("Failed to load employee attestations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [account, readOnlyContract]);

  useEffect(() => {
    if (isConnected) {
      loadEmployeeData();
    }
  }, [isConnected, loadEmployeeData]);

  // Handle manual lookup by SHA-256 employeeHash
  const handleHashSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchHash.trim()) return;

    setIsSearchingHash(true);
    setHashSearchError(null);
    setHashSearchResults(null);

    try {
      const cleanHash = searchHash.trim().startsWith("0x")
        ? searchHash.trim()
        : "0x" + searchHash.trim();

      const ids: bigint[] = await readOnlyContract.getEmployeeAttestations(cleanHash);
      if (ids.length === 0) {
        setHashSearchResults([]);
        return;
      }

      const results: EnrichedAttestation[] = [];
      for (const id of ids) {
        const att = await readOnlyContract.getAttestation(id);
        const employerProfile = await readOnlyContract.employers(att.employer);

        results.push({
          attestationId: Number(att.attestationId),
          employeeHash: att.employeeHash,
          employee: att.employee,
          employer: att.employer,
          employerName: employerProfile.employerName || "Registered Employer",
          position: att.position,
          startDate: Number(att.startDate),
          endDate: Number(att.endDate),
          status: Number(att.status) as EmploymentStatus,
          recordHash: att.recordHash,
          documentHash: att.documentHash,
          ipfsCID: att.ipfsCID,
          issueTimestamp: Number(att.issueTimestamp),
        });
      }

      setHashSearchResults(results);
    } catch (err: any) {
      console.error("Hash search failed:", err);
      setHashSearchError(err.message || "Failed to query attestations for this hash");
    } finally {
      setIsSearchingHash(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-teal-950/80 border border-teal-800/60 rounded-2xl flex items-center justify-center mx-auto text-teal-400 shadow-lg">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Employee Portal</h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
          Connect your personal Ethereum wallet to review verified employment credentials issued to you and manage verifier document access permissions.
        </p>
        <button
          onClick={connect}
          className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-teal-900/40"
        >
          <span>Connect Employee Wallet</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-sm font-medium mb-1">
            <User className="w-4 h-4" />
            <span>Employee Self-Sovereign Credentials</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            My Career Attestations
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-1">
            Employee Wallet: {account}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadEmployeeData}
            disabled={isLoading}
            className="p-2.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh Attestations"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <Link
            to="/employee/requests"
            className="relative inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-lg border border-slate-700 transition-colors shadow-sm"
          >
            <KeyRound className="w-4 h-4 text-teal-400" />
            <span>Manage Access Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 animate-pulse">
                {pendingRequestsCount} Pending
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Pending Consent Action Banner */}
      {pendingRequestsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-700/60 flex items-center justify-center text-amber-400 flex-shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                You have {pendingRequestsCount} pending document access request{pendingRequestsCount === 1 ? "" : "s"}
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Potential employers or background verifiers have requested to inspect your private supporting documents.
              </p>
            </div>
          </div>
          <Link
            to="/employee/requests"
            className="inline-flex items-center space-x-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow"
          >
            <span>Review Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Lookup Credentials by Privacy-Preserving SHA-256 Employee Hash */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Search className="w-4 h-4 text-teal-400" />
            <span>Query Attestations by Employee Hash</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Lookup credentials issued using a privacy-preserving SHA-256 employee hash.
          </p>
        </div>

        <form onSubmit={handleHashSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter 0x... 64-character SHA-256 employee hash"
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono text-xs"
          />
          <button
            type="submit"
            disabled={isSearchingHash || !searchHash.trim()}
            className="flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-xl text-xs transition-colors"
          >
            {isSearchingHash ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Lookup Hash</span>
            )}
          </button>
        </form>

        {hashSearchError && (
          <p className="text-xs text-rose-400">{hashSearchError}</p>
        )}

        {hashSearchResults !== null && (
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Search Results for Hash:</span>
              <button
                onClick={() => setHashSearchResults(null)}
                className="text-teal-400 hover:underline"
              >
                Clear Results
              </button>
            </div>
            {hashSearchResults.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No attestations found for this hash.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {hashSearchResults.map((att) => (
                  <AttestationCard key={att.attestationId} attestation={att} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Attestations Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span>Credentials Anchored to Your Wallet</span>
          </h2>
          <span className="text-xs text-slate-400">
            {attestations.length} credential{attestations.length === 1 ? "" : "s"} found
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-teal-400" />
            <p className="text-sm">Querying Ethereum smart contract for your credentials...</p>
          </div>
        ) : attestations.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-slate-800 rounded-full flex items-center justify-center text-teal-400">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">No Attestations Found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              No employers have issued employment credentials to wallet address <code className="font-mono text-slate-300">{account}</code> yet.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attestations.map((att) => (
              <AttestationCard key={att.attestationId} attestation={att} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AttestationCard: React.FC<{ attestation: EnrichedAttestation }> = ({ attestation }) => {
  const startStr = new Date(attestation.startDate * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
  const endStr =
    attestation.endDate > 0
      ? new Date(attestation.endDate * 1000).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
        })
      : "Present";

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-4 transition-all shadow-md">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-800/40">
            Attestation #{attestation.attestationId}
          </span>

          {attestation.status === EmploymentStatus.ACTIVE && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50">
              <CheckCircle className="w-3 h-3" />
              <span>ACTIVE</span>
            </span>
          )}
          {attestation.status === EmploymentStatus.COMPLETED && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-950 text-teal-400 border border-teal-800/50">
              <Clock className="w-3 h-3" />
              <span>COMPLETED</span>
            </span>
          )}
          {attestation.status === EmploymentStatus.REVOKED && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950 text-rose-400 border border-rose-800/50">
              <Ban className="w-3 h-3" />
              <span>REVOKED</span>
            </span>
          )}
        </div>

        {/* Position & Employer */}
        <div>
          <h3 className="text-lg font-bold text-white leading-snug">
            {attestation.position}
          </h3>
          <p className="text-sm text-teal-300 font-medium flex items-center space-x-1.5 mt-1">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{attestation.employerName}</span>
          </p>
        </div>

        {/* Dates */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {startStr} &rarr; {endStr}
          </span>
        </div>

        {/* Hashes & Privacy Info */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400">
          <div className="flex justify-between">
            <span className="text-slate-500">Record Hash:</span>
            <span>{attestation.recordHash.substring(0, 8)}...{attestation.recordHash.substring(attestation.recordHash.length - 6)}</span>
          </div>
          {attestation.ipfsCID ? (
            <div className="flex items-center justify-between text-sky-400">
              <span className="text-slate-500">Supporting File:</span>
              <span className="flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>AES-256 Encrypted</span>
              </span>
            </div>
          ) : (
            <div className="flex justify-between text-slate-500">
              <span>Supporting File:</span>
              <span>None Attached</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
        <span className="text-slate-500">
          Issued {new Date(attestation.issueTimestamp * 1000).toLocaleDateString()}
        </span>
        <Link
          to={`/verification`}
          className="text-teal-400 hover:text-teal-300 font-medium hover:underline"
        >
          Verify Details &rarr;
        </Link>
      </div>
    </div>
  );
};
