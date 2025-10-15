'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { RootState, AppDispatch } from '@/store';
import { fetchBalance } from '@/store/walletSlice';
import { WalletManager } from '@/lib/wallet-manager';

export default function BalanceDisplay() {
  const dispatch = useDispatch<AppDispatch>();
  const { publicKey, balance, isLoading } = useSelector((state: RootState) => state.wallet);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showFullKey, setShowFullKey] = useState(false);

  useEffect(() => {
    if (publicKey) {
      const fetchBalanceAsync = async () => {
        try {
          await dispatch(fetchBalance(publicKey));
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      };
      fetchBalanceAsync();
    }
  }, [publicKey, dispatch]);

  const handleCopyPublicKey = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  if (!publicKey) return null;

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm font-medium">Account Details</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs font-medium">Connected</span>
        </div>
      </div>

      {/* Public Key */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Public Key</span>
          <button
            onClick={() => setShowFullKey(!showFullKey)}
            className="text-cyan-400 hover:text-cyan-300 text-xs transition-colors"
          >
            {showFullKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <span className="text-gray-200 font-mono text-sm flex-1 break-all">
            {showFullKey ? publicKey : WalletManager.formatAddress(publicKey, 20)}
          </span>
          <button
            onClick={handleCopyPublicKey}
            className="text-gray-400 hover:text-cyan-400 transition-all duration-200 p-1 hover:bg-gray-700/50 rounded"
            title="Copy to clipboard"
          >
            {copiedKey ? (
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="space-y-2">
        <span className="text-gray-400 text-xs uppercase tracking-wider">Balance</span>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-xl"></div>
          <div className="relative p-4 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl border border-gray-700/50">
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    {parseFloat(balance).toFixed(2)}
                  </span>
                  <span className="ml-2 text-xl text-gray-400">XLM</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">USD Value</p>
                  <p className="text-sm text-gray-300">
                    ${(parseFloat(balance) * 0.1234).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}