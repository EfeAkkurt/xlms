'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { WalletManager } from '@/lib/wallet-manager';
import { Payment } from '@/types';
import { logger, txLogger } from '@/lib/logger';

export default function TransactionHistory() {
  const { publicKey } = useSelector((state: RootState) => state.wallet);
  const [transactions, setTransactions] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!publicKey) return;

    const txId = txLogger.startTransaction('TransactionHistory', 'Fetch History', {
      publicKey: publicKey.slice(0, 8) + '...'
    });

    setIsLoading(true);
    try {
      txLogger.progress('TransactionHistory', 'Fetch History', txId, 'Fetching from Stellar');
      const txHistory = await WalletManager.getTransactionHistory(publicKey);
      setTransactions(txHistory);

      logger.info('TransactionHistory', `Fetched ${txHistory.length} transactions`);
      txLogger.success('TransactionHistory', 'Fetch History', txId, {
        count: txHistory.length
      });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('TransactionHistory', 'Failed to fetch transactions', err);
      txLogger.failure('TransactionHistory', 'Fetch History', txId, err);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (publicKey) {
      fetchTransactions();
    }
  }, [publicKey, fetchTransactions]);

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  if (!publicKey) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-200">Transaction History</h2>
        <button
          onClick={fetchTransactions}
          className="text-cyan-400 hover:text-cyan-300 transition-colors p-2 hover:bg-gray-800/50 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800/30 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400">No transactions yet</p>
          <p className="text-gray-500 text-sm mt-2">Your payment history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
          {transactions.map((tx, index) => {
            const isSent = tx.from === publicKey;
            return (
              <div
                key={`${tx.timestamp}-${index}`}
                className="group bg-gray-800/30 hover:bg-gray-800/50 rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 border border-gray-700/50 hover:border-gray-600/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 ${
                      isSent
                        ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 group-hover:from-red-500/30 group-hover:to-red-600/30'
                        : 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 text-green-400 group-hover:from-green-500/30 group-hover:to-emerald-600/30'
                    }`}>
                      {isSent ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 mb-1">
                        {isSent ? 'Sent to' : 'Received from'}{' '}
                        <span className="text-cyan-400 font-mono">
                          {formatAddress(isSent ? tx.to : tx.from)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-bold text-lg ${
                      isSent ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {isSent ? '-' : '+'}{WalletManager.formatXLM(tx.amount)} XLM
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ ${(parseFloat(tx.amount) * 0.1234).toFixed(4)} USD
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}