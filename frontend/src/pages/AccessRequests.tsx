import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import {
  AccessRequest,
  RequestStatus,
} from "../types/workproof";

interface EnrichedAccessRequest extends AccessRequest {
  position: string;
  employerName: string;
}

export const AccessRequests: React.FC = () => {
  const { account, isConnected, contract, readOnlyContract, connect } = useWeb3();

  const [requests, setRequests] = useState<EnrichedAccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Processing state for individual request actions
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const loadAccessRequests = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Get all attestation IDs for the employee
      const attestationIds: bigint[] =
        await readOnlyContract.getEmployeeAttestationsByWallet(account);

      const allRequests: EnrichedAccessRequest[] = [];

      // 2. Iterate each attestation and fetch its request IDs
      for (const attId of attestationIds) {
        const att = await readOnlyContract.getAttestation(attId);
        const employerProfile = await readOnlyContract.employers(att.employer);

        const reqIds: bigint[] =
          await readOnlyContract.getAttestationAccessRequests(attId);

        for (const reqId of reqIds) {
          const req = await readOnlyContract.getAccessRequest(reqId);
          allRequests.push({
            requestId: Number(req.requestId),
            attestationId: Number(req.attestationId),
            verifier: req.verifier,
            employee: req.employee,
            requestType: req.requestType,
            status: Number(req.status) as RequestStatus,
            timestamp: Number(req.timestamp),
            respondedAt: Number(req.respondedAt),
            position: att.position,
            employerName: employerProfile.employerName || "Registered Employer",
          });
        }
      }

      // Sort newest first
      setRequests(allRequests.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err: any) {
      console.error("Failed to load access requests:", err);
      setError(err.message || "Failed to load access requests from blockchain");
    } finally {
      setIsLoading(false);
    }
  }, [account, readOnlyContract]);

  useEffect(() => {
    if (isConnected) {
      loadAccessRequests();
    }
  }, [isConnected, loadAccessRequests]);

  const handleApprove = async (requestId: number) => {
    if (!contract) return;

    setProcessingId(requestId);
    setActionType("approve");
    setError(null);

    try {
      const tx = await contract.approveDocumentAccess(BigInt(requestId));
      await tx.wait();
      await loadAccessRequests();
    } catch (err: any) {
      console.error("Failed to approve access request:", err);
      setError(err.reason || err.message || "Approval transaction failed");
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!contract) return;

    setProcessingId(requestId);
    setActionType("reject");
    setError(null);

    try {
      const tx = await contract.rejectDocumentAccess(BigInt(requestId));
      await tx.wait();
      await loadAccessRequests();
    } catch (err: any) {
      console.error("Failed to reject access request:", err);
      setError(err.reason || err.message || "Rejection transaction failed");
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <Lock className="w-12 h-12 text-teal-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Wallet Connection Required</h2>
        <p className="text-slate-400 text-sm">
          Connect your employee wallet to manage document access permissions and consent.
        </p>
        <button
          onClick={connect}
          className="bg-teal-600 hover:bg-teal-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === RequestStatus.PENDING);
  const resolvedRequests = requests.filter((r) => r.status !== RequestStatus.PENDING);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <Link
        to="/employee"
        className="inline-flex items-center space-x-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Employee Dashboard</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-sm font-medium mb-1">
            <Lock className="w-4 h-4" />
            <span>Self-Sovereign Consent Management</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Verifier Access Requests
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Authorize or reject external verifiers requesting to decrypt and view your private supporting documents on IPFS.
          </p>
        </div>

        <button
          onClick={loadAccessRequests}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-teal-400" />
          <p className="text-sm">Querying on-chain access requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Access Requests Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            When third-party background checkers or prospective employers request to view your encrypted documents, their requests will appear here for your cryptographic authorization.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-amber-400 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Pending Approvals ({pendingRequests.length})</span>
              </h2>

              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="bg-slate-900 border border-amber-800/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg hover:border-amber-700/80 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                          Request #{req.requestId}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          Attestation #{req.attestationId} ({req.position})
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">
                          Purpose: <span className="text-slate-200">{req.requestType}</span>
                        </p>
                        <p className="text-xs font-mono text-slate-400 flex items-center space-x-1">
                          <span>Requesting Verifier:</span>
                          <span className="text-slate-300">{req.verifier}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Requested on {new Date(req.timestamp * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <button
                        onClick={() => handleReject(req.requestId)}
                        disabled={processingId === req.requestId}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-800 text-rose-300 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {processingId === req.requestId && actionType === "reject" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApprove(req.requestId)}
                        disabled={processingId === req.requestId}
                        className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {processingId === req.requestId && actionType === "approve" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Confirming in Wallet...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve Access</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past / Resolved Requests */}
          {resolvedRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-400">Past Access Decisions</h2>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-3">Req ID</th>
                        <th className="px-5 py-3">Attestation</th>
                        <th className="px-5 py-3">Verifier</th>
                        <th className="px-5 py-3">Purpose</th>
                        <th className="px-5 py-3">Decision Date</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {resolvedRequests.map((req) => (
                        <tr key={req.requestId} className="hover:bg-slate-800/30">
                          <td className="px-5 py-3 font-mono font-bold text-white">
                            #{req.requestId}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-200">
                            #{req.attestationId} ({req.position})
                          </td>
                          <td className="px-5 py-3 font-mono text-slate-400">
                            {req.verifier.substring(0, 6)}...{req.verifier.substring(req.verifier.length - 4)}
                          </td>
                          <td className="px-5 py-3 text-slate-300">{req.requestType}</td>
                          <td className="px-5 py-3 text-slate-500">
                            {req.respondedAt > 0
                              ? new Date(req.respondedAt * 1000).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-5 py-3">
                            {req.status === RequestStatus.APPROVED && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                                <CheckCircle className="w-3 h-3" />
                                <span>APPROVED</span>
                              </span>
                            )}
                            {req.status === RequestStatus.REJECTED && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-medium bg-rose-950 text-rose-400 border border-rose-800/50">
                                <XCircle className="w-3 h-3" />
                                <span>REJECTED</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
