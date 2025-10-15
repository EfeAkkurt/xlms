export interface Payment {
  from: string;
  to: string;
  amount: string;
  timestamp: number;
}

export interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  balance: string;
}

export interface SendFormData {
  to: string;
  amount: string;
}