import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  UploadCloud,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Copy,
  Check,
  Building2,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { apiService } from "../services/api";
import { ethers } from "ethers";

export const CreateAttestation: React.FC = () => {
  const { isConnected, isRegisteredEmployer, employerProfile, contract, connect } = useWeb3();

  // Form Fields
  const [employeeAddress, setEmployeeAddress] = useState("");
  const [employeeIdOrEmail, setEmployeeIdOrEmail] = useState("");
  const [position, setPosition] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOngoing, setIsOngoing] = useState(true);
  const [supportingDoc, setSupportingDoc] = useState<File | null>(null);

  // Execution Progress
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Success State
  const [mintedAttestationId, setMintedAttestationId] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSupportingDoc(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !isConnected) return;

    // Validate Ethereum address
    if (!ethers.isAddress(employeeAddress.trim())) {
      setError("Please enter a valid Ethereum address (0x...) for the employee.");
      return;
    }

    if (!startDate) {
      setError("Please select an employment start date.");
      return;
    }

    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = isOngoing || !endDate ? 0 : Math.floor(new Date(endDate).getTime() / 1000);

    if (endTimestamp > 0 && endTimestamp < startTimestamp) {
      setError("End date must be greater than or equal to start date.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setMintedAttestationId(null);
    setTxHash(null);

    try {
      let documentHash = ethers.ZeroHash;
      let ipfsCID = "";

      // Step 1: Upload and Encrypt Supporting Document if provided
      if (supportingDoc) {
        setCurrentStep("Encrypting supporting document (AES-256-GCM) and pinning to IPFS...");
        const docUpload = await apiService.uploadDocument(supportingDoc);
        documentHash = docUpload.data.documentHash;
        ipfsCID = docUpload.data.ipfsCID;
      }

      // Step 2: Canonicalize and generate SHA-256 recordHash & employeeHash
      setCurrentStep("Generating deterministic SHA-256 record and employee hashes...");
      const prepRes = await apiService.prepareAttestation({
        employee: employeeAddress.trim(),
        employeeIdOrEmail: employeeIdOrEmail.trim() || undefined,
        position: position.trim(),
        startDate: startTimestamp,
        endDate: endTimestamp,
      });

      const { employeeHash, recordHash } = prepRes.data;

      // Step 3: Sign transaction on Ethereum via MetaMask
      setCurrentStep("Please confirm the transaction in MetaMask to anchor attestation on Ethereum...");
      const tx = await contract.createAttestation(
        employeeAddress.trim(),
        employeeHash,
        position.trim(),
        BigInt(startTimestamp),
        BigInt(endTimestamp),
        recordHash,
        documentHash,
        ipfsCID
      );

      setTxHash(tx.hash);
      setCurrentStep("Mining transaction on Ethereum network...");
      const receipt = await tx.wait();

      // Step 4: Extract minted Attestation ID from emitted events
      let createdId: number | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === "AttestationCreated") {
            createdId = Number(parsed.args.attestationId);
            break;
          }
        } catch {
          // not from this contract
        }
      }

      setMintedAttestationId(createdId || 1);
      setCurrentStep("Attestation successfully issued!");
    } catch (err: any) {
      console.error("Attestation creation failed:", err);
      setError(err.reason || err.message || "Failed to create attestation on-chain");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <Building2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Wallet Connection Required</h2>
        <p className="text-slate-400 text-sm">
          Please connect your registered employer wallet to issue employment attestations.
        </p>
        <button
          onClick={connect}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!isRegisteredEmployer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Employer Registration Required</h2>
        <p className="text-slate-400 text-sm">
          Your wallet is not registered as an employer issuer. Please register first on the Employer Dashboard.
        </p>
        <Link
          to="/employer"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          Go to Employer Registration
        </Link>
      </div>
    );
  }

  // Success Confirmation Screen
  if (mintedAttestationId !== null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Employment Attestation Minted!</h2>
            <p className="text-slate-400 text-sm">
              The credential has been cryptographically anchored to the Ethereum blockchain.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-left space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Attestation ID</span>
              <span className="font-mono text-emerald-400 font-bold text-lg">
                #{mintedAttestationId}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Employee Wallet</span>
              <span className="font-mono text-xs text-slate-300">
                {employeeAddress}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Position</span>
              <span className="text-xs text-white font-medium">{position}</span>
            </div>

            {txHash && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Transaction Hash</span>
                <div className="flex items-center space-x-1">
                  <span className="font-mono text-xs text-slate-400">
                    {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(txHash)}
                    className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                    title="Copy Transaction Hash"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/employer"
              className="px-6 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              to="/verification"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors"
            >
              Verify on Verifier Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/employer"
        className="inline-flex items-center space-x-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Employer Dashboard</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 text-xs font-medium border border-emerald-800/40 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Issuer: {employerProfile?.employerName}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Issue Employment Attestation</h2>
          <p className="text-slate-400 text-sm mt-1">
            Attestation hashes are anchored on Ethereum. Supporting files are encrypted with AES-256-GCM and stored on IPFS.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isProcessing && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center space-x-3">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
            <div className="space-y-0.5">
              <p className="font-semibold text-white">Processing Attestation...</p>
              <p className="text-slate-300">{currentStep}</p>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Employee Wallet Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              Employee Wallet Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="0x..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-sm"
              value={employeeAddress}
              onChange={(e) => setEmployeeAddress(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              The employee will use this wallet to authorize verifier document access requests.
            </p>
          </div>

          {/* Employee Identifier or Email (Private Salt) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              Employee Unique Identifier / Email (Salt)
            </label>
            <input
              type="text"
              placeholder="e.g. employee@company.com or EMP-1092"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              value={employeeIdOrEmail}
              onChange={(e) => setEmployeeIdOrEmail(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Used off-chain to compute the SHA-256 <code>employeeHash</code>. Plaintext email is never stored on-chain.
            </p>
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              Job Title / Role <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Staff Blockchain Engineer"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">
                Employment Start Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">Employment End Date</label>
                <label className="flex items-center space-x-1.5 text-xs text-emerald-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOngoing}
                    onChange={(e) => {
                      setIsOngoing(e.target.checked);
                      if (e.target.checked) setEndDate("");
                    }}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Ongoing</span>
                </label>
              </div>
              <input
                type="date"
                disabled={isOngoing}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white disabled:opacity-40 focus:outline-none focus:border-emerald-500 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Supporting Document Picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              Supporting Document (Experience Letter, Certificate, Recommendation)
            </label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-6 text-center transition-colors bg-slate-950/40">
              <input
                type="file"
                accept=".pdf,.png,.jpeg,.jpg,.txt"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {supportingDoc ? (
                <div className="space-y-1">
                  <FileCheck2 className="w-8 h-8 mx-auto text-emerald-400" />
                  <p className="text-sm text-white font-medium">{supportingDoc.name}</p>
                  <p className="text-xs text-slate-400">
                    {(supportingDoc.size / 1024).toFixed(1)} KB &bull; Click or drop another file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-sm text-slate-300">Select or drop document (PDF, PNG, JPG, TXT)</p>
                  <p className="text-xs text-slate-500">
                    Will be encrypted with AES-256-GCM before pinning to IPFS
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security Guarantee Notice */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Cryptographic Privacy Guarantee</span>
            </div>
            <p>
              The uploaded file is encrypted with AES-256-GCM using a stateless HKDF derived key. Knowing the IPFS CID will not grant access to the plaintext without explicit on-chain consent from the employee.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Attestation...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Issue Attestation on Ethereum</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
