declare global {
  interface Window {
    freighter?: {
      getPublicKey: () => Promise<string>;
      signTransaction: (xdr: string, options?: { network?: string }) => Promise<string>;
      isConnected: () => Promise<boolean>;
    };
    freighterApi?: {
      isConnected: () => Promise<boolean>;
      isAllowed: () => Promise<boolean>;
      getUserInfo: () => Promise<{ publicKey: string }>;
      signTransaction: (xdr: string, options?: { network: string }) => Promise<string>;
    };
    stellar?: {
      getPublicKey: () => Promise<string>;
      signTransaction: (xdr: string, options?: { network?: string; accountToSign?: string }) => Promise<string>;
    };
  }
}

export {};