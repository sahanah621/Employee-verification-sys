import { ipfsConfig } from "../config/ipfs";

export interface IIpfsProvider {
  uploadEncryptedBuffer(buffer: Buffer, fileName: string): Promise<string>;
  fetchEncryptedBuffer(cid: string): Promise<Buffer>;
}

/**
 * Pinata IPFS Provider placeholder.
 */
export class PinataIpfsProvider implements IIpfsProvider {
  private jwt: string;
  private gateway: string;

  constructor(jwt: string, gateway: string) {
    this.jwt = jwt;
    this.gateway = gateway;
  }

  async uploadEncryptedBuffer(buffer: Buffer, fileName: string): Promise<string> {
    // Placeholder - will interact with Pinata API in later step
    return "QmPlaceholderCID" + Date.now();
  }

  async fetchEncryptedBuffer(cid: string): Promise<Buffer> {
    // Placeholder - will fetch encrypted binary from IPFS gateway in later step
    return Buffer.from("");
  }
}

/**
 * Abstract IPFS Service decoupling underlying storage provider from business logic.
 */
export class IpfsService {
  private provider: IIpfsProvider;

  constructor(provider?: IIpfsProvider) {
    this.provider = provider || new PinataIpfsProvider(ipfsConfig.jwt, ipfsConfig.gateway);
  }

  setProvider(provider: IIpfsProvider) {
    this.provider = provider;
  }

  async uploadEncryptedDocument(encryptedBuffer: Buffer, fileName: string): Promise<string> {
    return this.provider.uploadEncryptedBuffer(encryptedBuffer, fileName);
  }

  async retrieveEncryptedDocument(cid: string): Promise<Buffer> {
    return this.provider.fetchEncryptedBuffer(cid);
  }
}

export const ipfsService = new IpfsService();
