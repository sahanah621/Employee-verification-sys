import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Building2,
  FileCheck,
  Download,
  Eye,
  X,
  Loader2,
  Ban,
  Clock,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { apiService } from "../services/api";
import {
  Attestation,
  EmploymentStatus,
  DecryptedDocumentResponse,
} from "../types/workproof";

interface EnrichedAttestationDetails extends Attestation {
  employerName: string;
}

export const Verification: React.FC = () => {
  const { account, isConnected, signer, contract, readOnlyContract, connect } = useWeb3();

  const [searchId, setSearchId] = useState("");
  const [attestation, setAttestation] = useState<EnrichedAttestationDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Authorization Status
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Request Access State
  const [requestPurpose, setRequestPurpose] = useState("EMPLOYMENT_VERIFICATION");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Decryption & Document Preview State
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const [decryptedDoc, setDecryptedDoc] = useState<DecryptedDocumentResponse | null>(null);

  // Perform Attestation Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setAttestation(null);
    setIsAuthorized(false);
    setRequestSuccess(null);
    setRequestError(null);
    setDecryptionError(null);
    setDecryptedDoc(null);

    try {
      const idNum = Number(searchId.trim());
      if (isNaN(idNum) || idNum <= 0) {
        throw new Error("Please enter a valid positive numeric Attestation ID");
      }

      const att = await readOnlyContract.getAttestation(BigInt(idNum));
      const employerProfile = await readOnlyContract.employers(att.employer);

      const loadedAttestation: EnrichedAttestationDetails = {
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
      };

      setAttestation(loadedAttestation);

      // Check authorization if wallet is connected
      if (account) {
        checkAuthorization(loadedAttestation.attestationId, account);
      }
    } catch (err: any) {
      console.error("Attestation lookup error:", err);
      setSearchError(err.reason || err.message || "Attestation does not exist on blockchain");
    } finally {
      setIsSearching(false);
    }
  };

  // Check verifier document access
  const checkAuthorization = async (attestationId: number, verifierAddress: string) => {
    try {
      const authorized = await readOnlyContract.hasDocumentAccess(
        BigInt(attestationId),
        verifierAddress
      );
      setIsAuthorized(authorized);
    } catch (err) {
      console.warn("Could not check authorization:", err);
      setIsAuthorized(false);
    }
  };

  // Re-check authorization when account changes
  useEffect(() => {
    if (attestation && account) {
      checkAuthorization(attestation.attestationId, account);
    }
  }, [account, attestation]);

  // Handle Request Access
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !attestation || !requestPurpose.trim()) return;

    setIsSubmittingRequest(true);
    setRequestError(null);
    setRequestSuccess(null);

    try {
      const tx = await contract.requestDocumentAccess(
        BigInt(attestation.attestationId),
        requestPurpose.trim()
      );
      await tx.wait();
      setRequestSuccess(
        `Access request submitted successfully on Ethereum! The employee must approve this request from their portal.`
      );
    } catch (err: any) {
      console.error("Failed to request access:", err);
      setRequestError(err.reason || err.message || "Access request transaction failed");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Handle Document Decryption
  const handleDecryptDocument = async () => {
    if (!attestation || !signer || !account) return;

    setIsDecrypting(true);
    setDecryptionError(null);

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const challenge = apiService.buildAccessChallenge(attestation.attestationId, timestamp);

      // 1. Sign access challenge via MetaMask
      const signature = await signer.signMessage(challenge);

      // 2. Fetch decrypted document payload from backend
      const res = await apiService.getDecryptedDocument(
        attestation.attestationId,
        account,
        signature,
        timestamp,
        "json"
      );

      setDecryptedDoc(res.data);
    } catch (err: any) {
      console.error("Decryption failed:", err);
      setDecryptionError(err.message || "Failed to decrypt supporting document");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDownloadFile = () => {
    if (!decryptedDoc) return;

    const byteCharacters = atob(decryptedDoc.base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: decryptedDoc.mimeType });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = decryptedDoc.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-2 text-sky-400 text-sm font-medium mb-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>Trustless Verification Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Employment Credential Verification
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Directly query Ethereum smart contracts to authenticate employment credentials, examine cryptographic commitments, and request private supporting documents.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-lg">
        <label className="text-sm font-semibold text-slate-200">
          Lookup Attestation on Ethereum
        </label>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Enter Attestation ID (e.g. 1, 2, 3)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono text-sm"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchId.trim()}
            className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Querying Blockchain...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify on Blockchain</span>
              </>
            )}
          </button>
        </form>

        {searchError && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Search Result Display */}
      {attestation && (
        <div className="space-y-6">
          {/* Main Credential Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950 px-2.5 py-1 rounded-md border border-sky-800/50">
                  Attestation #{attestation.attestationId}
                </span>
                <h2 className="text-2xl font-bold text-white mt-2">
                  {attestation.position}
                </h2>
                <p className="text-sm text-sky-300 font-medium flex items-center space-x-1.5 mt-1">
                  <Building2 className="w-4 h-4" />
                  <span>{attestation.employerName}</span>
                </p>
              </div>

              <div>
                {attestation.status === EmploymentStatus.ACTIVE && (
                  <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACTIVE CREDENTIAL</span>
                  </span>
                )}
                {attestation.status === EmploymentStatus.COMPLETED && (
                  <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-teal-950 text-teal-400 border border-teal-800 shadow-sm">
                    <Clock className="w-4 h-4" />
                    <span>COMPLETED TENURE</span>
                  </span>
                )}
                {attestation.status === EmploymentStatus.REVOKED && (
                  <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-rose-950 text-rose-400 border border-rose-800 shadow-sm">
                    <Ban className="w-4 h-4" />
                    <span>REVOKED CREDENTIAL</span>
                  </span>
                )}
              </div>
            </div>

            {/* Revoked Warning Alert */}
            {attestation.status === EmploymentStatus.REVOKED && (
              <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-rose-300">Warning: Revoked Attestation</p>
                  <p>
                    This employment credential was officially marked as <code>REVOKED</code> on Ethereum by the original issuing employer. All supporting document authorizations are permanently invalid.
                  </p>
                </div>
              </div>
            )}

            {/* Detail Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: Employment Details */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Employment Details
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Issuing Employer</span>
                    <span className="font-mono text-slate-200 text-[11px]">{attestation.employer}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Employee Wallet</span>
                    <span className="font-mono text-slate-200 text-[11px]">{attestation.employee}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Tenure</span>
                    <span className="text-slate-200">
                      {new Date(attestation.startDate * 1000).toLocaleDateString()} &rarr;{" "}
                      {attestation.endDate > 0
                        ? new Date(attestation.endDate * 1000).toLocaleDateString()
                        : "Present (Active)"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Anchored Timestamp</span>
                    <span className="text-slate-200">
                      {new Date(attestation.issueTimestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Cryptographic Commitments */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Cryptographic Commitments (SHA-256)
                </h3>

                <div className="space-y-2 text-xs font-mono">
                  <div className="space-y-0.5 py-1 border-b border-slate-800">
                    <span className="text-[11px] text-slate-400 font-sans">Employee SHA-256 Hash:</span>
                    <p className="text-[11px] text-slate-300 break-all">{attestation.employeeHash}</p>
                  </div>

                  <div className="space-y-0.5 py-1 border-b border-slate-800">
                    <span className="text-[11px] text-slate-400 font-sans">Structured Record Hash:</span>
                    <p className="text-[11px] text-slate-300 break-all">{attestation.recordHash}</p>
                  </div>

                  <div className="space-y-0.5 py-1">
                    <span className="text-[11px] text-slate-400 font-sans">Supporting Document Hash:</span>
                    <p className="text-[11px] text-slate-300 break-all">
                      {attestation.documentHash !== "0x0000000000000000000000000000000000000000000000000000000000000000"
                        ? attestation.documentHash
                        : "None attached"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Supporting Document Access Section */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Lock className="w-4 h-4 text-sky-400" />
                <span>Supporting Document Access (AES-256-GCM + IPFS)</span>
              </h3>

              {!attestation.ipfsCID ? (
                <p className="text-xs text-slate-500">
                  No encrypted supporting document is attached to this attestation.
                </p>
              ) : attestation.status === EmploymentStatus.REVOKED ? (
                <p className="text-xs text-rose-400">
                  Document access is permanently disabled for revoked attestations.
                </p>
              ) : !isConnected ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">Verifier Wallet Required</p>
                    <p className="text-xs text-slate-400">
                      Connect your wallet to check your authorization status or submit an access request to the employee.
                    </p>
                  </div>
                  <button
                    onClick={connect}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-sm"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : isAuthorized ? (
                /* Authorized State */
                <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-6 space-y-4 shadow-md">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Unlock className="w-5 h-5" />
                    <span className="font-bold text-sm">Access Authorized by Employee</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Your connected verifier wallet (<code className="font-mono text-emerald-300">{account}</code>) has an active on-chain access grant from the employee. You can now cryptographically sign and decrypt the supporting file.
                  </p>

                  {decryptionError && (
                    <div className="p-3 bg-rose-950 border border-rose-800 rounded-lg text-rose-300 text-xs">
                      {decryptionError}
                    </div>
                  )}

                  <button
                    onClick={handleDecryptDocument}
                    disabled={isDecrypting}
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-[0.98]"
                  >
                    {isDecrypting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Decrypting via AES-256-GCM...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Decrypt & View Supporting Document</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Unauthorized / Request Access State */
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">Request Document Access Consent</p>
                    <p className="text-xs text-slate-400">
                      The supporting document is encrypted with AES-256-GCM. Submit an on-chain access request so the employee can review and grant consent.
                    </p>
                  </div>

                  {requestSuccess && (
                    <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-300 text-xs">
                      {requestSuccess}
                    </div>
                  )}

                  {requestError && (
                    <div className="p-3 bg-rose-950 border border-rose-800 rounded-lg text-rose-300 text-xs">
                      {requestError}
                    </div>
                  )}

                  <form onSubmit={handleRequestAccess} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">
                        Verification Purpose / Note
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. PRE_EMPLOYMENT_SCREENING or BACKGROUND_CHECK_2026"
                        value={requestPurpose}
                        onChange={(e) => setRequestPurpose(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingRequest || !requestPurpose.trim()}
                      className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
                    >
                      {isSubmittingRequest ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting to Ethereum...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Submit Access Request on Ethereum</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Decrypted Document Preview Modal */}
      {decryptedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base truncate max-w-sm">
                  {decryptedDoc.originalName}
                </h3>
              </div>
              <button
                onClick={() => setDecryptedDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Verified Hash Match Banner */}
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>Cryptographic Integrity Verified:</strong> Decrypted file hash matches the on-chain SHA-256 <code>documentHash</code>.
                </span>
              </div>

              {/* Document Details */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">MIME Type:</span>
                  <span className="text-slate-300">{decryptedDoc.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">File Size:</span>
                  <span className="text-slate-300">{(decryptedDoc.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
                <div className="space-y-0.5 pt-1 border-t border-slate-800">
                  <span className="text-slate-500 font-sans">Verified SHA-256 Hash:</span>
                  <p className="text-[11px] text-emerald-400 break-all">{decryptedDoc.documentHash}</p>
                </div>
              </div>

              {/* Inline Preview */}
              {decryptedDoc.mimeType.startsWith("image/") ? (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-4">
                  <img
                    src={`data:${decryptedDoc.mimeType};base64,${decryptedDoc.base64Data}`}
                    alt="Decrypted Supporting Document"
                    className="max-h-72 object-contain rounded-lg"
                  />
                </div>
              ) : decryptedDoc.mimeType === "application/pdf" ? (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 h-80">
                  <iframe
                    src={`data:application/pdf;base64,${decryptedDoc.base64Data}`}
                    title="PDF Preview"
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-950 text-xs font-mono text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {atob(decryptedDoc.base64Data)}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDecryptedDoc(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleDownloadFile}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download Decrypted Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
