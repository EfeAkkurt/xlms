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
  StrKey,
  Horizon
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

// Initialize Horizon server for account operations
export const horizonServer = new Horizon.Server('https://horizon-testnet.stellar.org');

// Initialize RPC server for Soroban operations
export const rpcServer = new rpc.Server('https://soroban-testnet.stellar.org');

// Helper function to load account (client-side only)
export const loadAccount = async (publicKey: string) => {
  return await horizonServer.loadAccount(publicKey);
};

