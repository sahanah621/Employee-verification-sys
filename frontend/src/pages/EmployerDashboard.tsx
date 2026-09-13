import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  PlusCircle,
  FileCheck,
  Ban,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { Attestation, EmploymentStatus } from "../types/workproof";

export const EmployerDashboard: React.FC = () => {
  const {
    account,
    isConnected,
    isRegisteredEmployer,
    employerProfile,
    contract,
    readOnlyContract,
    connect,
    refreshEmployerStatus,
  } = useWeb3();

  // Registration state
  const [orgNameInput, setOrgNameInput] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regTxHash, setRegTxHash] = useState<string | null>(null);

  // Attestations state
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [isLoadingAttestations, setIsLoadingAttestations] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Revocation state
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // Fetch issued attestations
  const loadIssuedAttestations = useCallback(async () => {
    if (!account) return;

    setIsLoadingAttestations(true);
    setLoadError(null);

    try {
      const ids: bigint[] = await readOnlyContract.getEmployerAttestations(account);
      const fetched: Attestation[] = [];

      for (const id of ids) {
        const att = await readOnlyContract.getAttestation(id);
        fetched.push({
          attestationId: Number(att.attestationId),
          employeeHash: att.employeeHash,
          employee: att.employee,
          employer: att.employer,
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

      // Sort newest first
      setAttestations(fetched.sort((a, b) => b.attestationId - a.attestationId));
    } catch (err: any) {
      console.error("Failed to load employer attestations:", err);
      setLoadError(err.message || "Failed to load issued attestations");
    } finally {
      setIsLoadingAttestations(false);
    }
  }, [account, readOnlyContract]);

  useEffect(() => {
    if (isConnected && isRegisteredEmployer) {
      loadIssuedAttestations();
    }
  }, [isConnected, isRegisteredEmployer, loadIssuedAttestations]);

  // Handle Organization Registration
  const handleRegisterEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !orgNameInput.trim()) return;

    setIsRegistering(true);
    setRegError(null);
    setRegTxHash(null);

    try {
      const tx = await contract.registerEmployer(orgNameInput.trim());
      setRegTxHash(tx.hash);
      await tx.wait();
      await refreshEmployerStatus();
      setOrgNameInput("");
    } catch (err: any) {
      console.error("Employer registration failed:", err);
      setRegError(err.reason || err.message || "Registration transaction failed");
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle Attestation Revocation
  const handleRevokeAttestation = async (attestationId: number) => {
    if (!contract) return;

    setIsRevoking(true);
    setRevokeError(null);

    try {
      const tx = await contract.revokeAttestation(BigInt(attestationId));
      await tx.wait();
      setRevokingId(null);
      await loadIssuedAttestations();
    } catch (err: any) {
      console.error("Revocation failed:", err);
      setRevokeError(err.reason || err.message || "Revocation transaction failed");
    } finally {
      setIsRevoking(false);
    }
  };

  // Metrics
  const totalIssued = attestations.length;
  const activeCount = attestations.filter((a) => a.status === EmploymentStatus.ACTIVE).length;
  const completedCount = attestations.filter((a) => a.status === EmploymentStatus.COMPLETED).length;
  const revokedCount = attestations.filter((a) => a.status === EmploymentStatus.REVOKED).length;

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-800/60 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Employer Portal</h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
          Connect your organization's Ethereum wallet to manage your registered profile, issue tamper-proof employment attestations, and manage credentials.
        </p>
        <button
          onClick={connect}
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-emerald-900/40"
        >
          <span>Connect Employer Wallet</span>
        </button>
      </div>
    );
  }

  // If connected but not registered as an employer
  if (!isRegisteredEmployer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-5 space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-amber-950/60 text-amber-400 text-xs font-medium border border-amber-800/40">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Unregistered Employer</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Register Organization Identity</h2>
            <p className="text-slate-400 text-sm">
              Your wallet address is not yet registered as an authorized attestation issuer on the WorkProof Ethereum smart contract.
            </p>
          </div>

          {regError && (
            <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
              <strong>Registration Error:</strong> {regError}
            </div>
          )}

          {regTxHash && isRegistering && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Mining registration transaction on Ethereum: <code className="font-mono">{regTxHash.substring(0, 14)}...</code></span>
            </div>
          )}

          <form onSubmit={handleRegisterEmployer} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Organization / Company Legal Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corporation or Google DeepMind"
                value={orgNameInput}
                onChange={(e) => setOrgNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
              />
              <p className="text-xs text-slate-500">
                Connected Issuer Wallet: <span className="font-mono text-slate-400">{account}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isRegistering || !orgNameInput.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md active:scale-[0.99]"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering on Ethereum...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Register Organization on Ethereum</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-sm font-medium mb-1">
            <Building2 className="w-4 h-4" />
            <span>Authorized Employer Issuer</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {employerProfile?.employerName || "Employer Dashboard"}
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-1">
            Issuer Wallet: {account}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadIssuedAttestations}
            disabled={isLoadingAttestations}
            className="p-2.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh Attestations"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingAttestations ? "animate-spin" : ""}`} />
          </button>
          <Link
            to="/employer/create"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue New Attestation</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Issued</p>
          <p className="text-3xl font-extrabold text-white mt-2">{totalIssued}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Attestations</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">{activeCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed Tenures</p>
          <p className="text-3xl font-extrabold text-teal-400 mt-2">{completedCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Revoked</p>
          <p className="text-3xl font-extrabold text-rose-400 mt-2">{revokedCount}</p>
        </div>
      </div>

      {/* Revocation Warning / Error Alert */}
      {revokeError && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
          <strong>Revocation Error:</strong> {revokeError}
        </div>
      )}

      {/* Loading Error Alert */}
      {loadError && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
          <strong>Query Error:</strong> {loadError}
        </div>
      )}

      {/* Attestations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Issued Employment Attestations</span>
          </h2>
          <span className="text-xs text-slate-400">
            {attestations.length} credential{attestations.length === 1 ? "" : "s"} anchored on Ethereum
          </span>
        </div>

        {isLoadingAttestations ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-emerald-400" />
            <p className="text-sm">Querying Ethereum contract state...</p>
          </div>
        ) : attestations.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">No Attestations Created Yet</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Start by issuing your organization's first cryptographic employment credential on Ethereum.
            </p>
            <Link
              to="/employer/create"
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue First Attestation</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">ID</th>
                  <th className="px-6 py-3 font-semibold">Employee Wallet</th>
                  <th className="px-6 py-3 font-semibold">Position</th>
                  <th className="px-6 py-3 font-semibold">Timeline</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Supporting Doc</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attestations.map((att) => {
                  const startStr = new Date(att.startDate * 1000).toLocaleDateString();
                  const endStr =
                    att.endDate > 0
                      ? new Date(att.endDate * 1000).toLocaleDateString()
                      : "Present (Ongoing)";

                  return (
                    <tr key={att.attestationId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        #{att.attestationId}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {att.employee.substring(0, 6)}...{att.employee.substring(att.employee.length - 4)}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {att.position}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {startStr} &rarr; {endStr}
                      </td>
                      <td className="px-6 py-4">
                        {att.status === EmploymentStatus.ACTIVE && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                            <CheckCircle className="w-3 h-3" />
                            <span>ACTIVE</span>
                          </span>
                        )}
                        {att.status === EmploymentStatus.COMPLETED && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-950 text-teal-400 border border-teal-800/50">
                            <Clock className="w-3 h-3" />
                            <span>COMPLETED</span>
                          </span>
                        )}
                        {att.status === EmploymentStatus.REVOKED && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950 text-rose-400 border border-rose-800/50">
                            <Ban className="w-3 h-3" />
                            <span>REVOKED</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {att.ipfsCID ? (
                          <span
                            className="inline-flex items-center space-x-1 text-xs text-sky-400 font-mono"
                            title={`Encrypted IPFS CID: ${att.ipfsCID}`}
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>IPFS Attached</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {att.status !== EmploymentStatus.REVOKED && (
                          <button
                            onClick={() => setRevokingId(att.attestationId)}
                            className="text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-1 rounded-md bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/40 transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revocation Confirmation Modal */}
      {revokingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirm Revocation</h3>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to revoke attestation <strong>#{revokingId}</strong>?
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              This action writes to the Ethereum blockchain to mark the credential as <code>REVOKED</code>. All document access permissions will be immediately voided. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={isRevoking}
                onClick={() => setRevokingId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={() => handleRevokeAttestation(revokingId)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {isRevoking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Revoking on Ethereum...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>Confirm Revoke</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
