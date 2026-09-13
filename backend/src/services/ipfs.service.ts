import axios from "axios";
import * as crypto from "crypto";
import { ipfsConfig } from "../config/ipfs";

export interface IIpfsProvider {
  uploadEncryptedBuffer(buffer: Buffer, fileName: string): Promise<string>;
  fetchEncryptedBuffer(cid: string): Promise<Buffer>;
}

/**
 * In-memory Mock IPFS Provider for deterministic local development and automated testing.
 */
export class MockIpfsProvider implements IIpfsProvider {
  private storage: Map<string, Buffer> = new Map();

  async uploadEncryptedBuffer(buffer: Buffer, fileName: string): Promise<string> {
    // Generate a deterministic CID simulation based on SHA-256 digest
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const simulatedCid = "Qm" + hash.substring(0, 44);
    this.storage.set(simulatedCid, Buffer.from(buffer));
    return simulatedCid;
  }

  async fetchEncryptedBuffer(cid: string): Promise<Buffer> {
    const data = this.storage.get(cid);
    if (!data) {
      throw new Error(`IPFS CID not found in mock store: ${cid}`);
    }
    return Buffer.from(data);
  }

  /**
   * Helper for unit tests to inspect or preload storage.
   */
  has(cid: string): boolean {
    return this.storage.has(cid);
  }

  clear(): void {
    this.storage.clear();
  }
}

/**
 * Production Pinata IPFS Provider communicating via Pinata API and IPFS Dedicated Gateway.
 */
export class PinataIpfsProvider implements IIpfsProvider {
  private jwt: string;
  private gateway: string;

  constructor(jwt: string, gateway: string) {
    this.jwt = jwt;
    this.gateway = gateway.endsWith("/") ? gateway : `${gateway}/`;
  }

  async uploadEncryptedBuffer(buffer: Buffer, fileName: string): Promise<string> {
    if (!this.jwt || this.jwt.includes("placeholder") || this.jwt.includes("your_pinata_jwt")) {
      throw new Error("Pinata JWT token is not configured or is a placeholder");
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)]);
    formData.append("file", blob, fileName);

    const metadata = JSON.stringify({
      name: `workproof_${fileName}_${Date.now()}`,
    });
    formData.append("pinataMetadata", metadata);

    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
      maxBodyLength: Infinity,
    });

    if (!res.data || !res.data.IpfsHash) {
      throw new Error("Pinata API returned an invalid response");
    }

    return res.data.IpfsHash;
  }

  async fetchEncryptedBuffer(cid: string): Promise<Buffer> {
    const url = `${this.gateway}${cid}`;
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000,
    });
    return Buffer.from(res.data);
  }
}

/**
 * Abstract IPFS Service decoupling underlying storage provider from business logic.
 */
export class IpfsService {
  private provider: IIpfsProvider;
  private mockProvider: MockIpfsProvider;

  constructor() {
    this.mockProvider = new MockIpfsProvider();

    // Use Pinata if valid JWT is provided, otherwise default to local mock provider
    const hasPinataToken =
      Boolean(ipfsConfig.jwt) &&
      !ipfsConfig.jwt.includes("placeholder") &&
      !ipfsConfig.jwt.includes("your_pinata_jwt");

    if (hasPinataToken) {
      this.provider = new PinataIpfsProvider(ipfsConfig.jwt, ipfsConfig.gateway);
    } else {
      this.provider = this.mockProvider;
    }
  }

  setProvider(provider: IIpfsProvider) {
    this.provider = provider;
  }

  getMockProvider(): MockIpfsProvider {
    return this.mockProvider;
  }

  async uploadEncryptedDocument(encryptedBuffer: Buffer, fileName: string): Promise<string> {
    try {
      return await this.provider.uploadEncryptedBuffer(encryptedBuffer, fileName);
    } catch (err: any) {
      // If Pinata fails and we have mock fallback in development, use mock
      if (this.provider instanceof PinataIpfsProvider && process.env.NODE_ENV !== "production") {
        console.warn(`[WorkProof IPFS] Pinata upload failed (${err.message}). Falling back to local mock store.`);
        return await this.mockProvider.uploadEncryptedBuffer(encryptedBuffer, fileName);
      }
      throw err;
    }
  }

  async retrieveEncryptedDocument(cid: string): Promise<Buffer> {
    try {
      return await this.provider.fetchEncryptedBuffer(cid);
    } catch (err: any) {
      // Fallback check in mock store if dev mode
      if (this.mockProvider.has(cid)) {
        return await this.mockProvider.fetchEncryptedBuffer(cid);
      }
      throw err;
    }
  }
}

export const ipfsService = new IpfsService();
