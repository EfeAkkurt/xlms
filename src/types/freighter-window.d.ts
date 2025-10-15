// Type definitions for Freighter Window API
export {};

declare global {
  interface Window {
    freighter?: {
      getPublicKey: () => Promise<string>;
      signTransaction: (xdr: string) => Promise<string>;
      isConnected: () => Promise<boolean>;
      getNetwork: () => Promise<string>;
    };
    freighterApi?: {
      isConnected: () => Promise<{ isConnected: boolean }>;
      isAllowed: () => Promise<{ isAllowed: boolean }>;
      setAllowed: () => Promise<{ isAllowed: boolean }>;
      requestAccess: () => Promise<{ address: string }>;
      getAddress: () => Promise<{ address: string }>;
      getUserInfo: () => Promise<{ publicKey: string }>;
      getNetwork: () => Promise<{ network: string; networkPassphrase: string }>;
      getNetworkDetails: () => Promise<{
        network: string;
        networkUrl: string;
        networkPassphrase: string;
        sorobanRpcUrl?: string;
      }>;
      signTransaction: (xdr: string, opts?: {
        network?: string;
        networkPassphrase?: string;
        address?: string;
      }) => Promise<string>;
      signMessage: (message: string, opts: { address: string }) => Promise<{
        signedMessage: string | Buffer | null;
        signerAddress: string;
      }>;
      signAuthEntry: (authEntryXdr: string, opts: { address: string }) => Promise<{
        signedAuthEntry: Buffer | null;
        signerAddress: string;
      }>;
      addToken: (opts: { contractId: string; networkPassphrase?: string }) => Promise<{
        contractId: string;
        error?: string;
      }>;
    };
    stellar?: unknown;
  }
}