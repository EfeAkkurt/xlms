'use client';

import StellarSdk, {
  SorobanDataBuilder,
  xdr,
  scValToNative,
  nativeToScVal,
  Contract,
  rpc,
  Address,
  Networks,
  TransactionBuilder,
  Keypair,
  Memo,
  MemoValue,
  Operation,
  Asset,
  StrKey
} from '@stellar/stellar-sdk';

// Base fee in stroops (100 stroops = 0.00001 XLM)
const BASE_FEE_STROOPS = 100;

// Export these for client-side use only
export {
  StellarSdk,
  SorobanDataBuilder,
  xdr,
  scValToNative,
  nativeToScVal,
  Contract,
  rpc,
  Address,
  Networks,
  TransactionBuilder,
  Keypair,
  Memo,
  Operation,
  Asset,
  StrKey,
  BASE_FEE_STROOPS
};

export type { MemoValue };

// Initialize RPC server for client-side use
export const server = new rpc.Server('https://horizon-testnet.stellar.org');

// Helper function to load account (client-side only)
export const loadAccount = async (publicKey: string) => {
  return await server.getAccount(publicKey);
};

