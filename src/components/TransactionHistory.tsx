"use client";

import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function TransactionHistory() {
  const { publicKey } = useSelector((state: RootState) => state.wallet);
  const { transactions } = useSelector((state: RootState) => state.transaction);

  if (!publicKey) {
    return null;
  }

  return (
    <div className="w-full max-w-md">
      <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>

      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No transactions yet. Make a transfer to see history.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        tx.status === 'success' ? 'bg-green-400' :
                        tx.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                      }`}></div>
                      <span className={`text-xs font-medium ${
                        tx.status === 'success' ? 'text-green-400' :
                        tx.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {tx.status === 'success' ? 'Success' :
                         tx.status === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-300 mb-1">
                      <span className="font-medium">
                        {tx.amount} XLM
                      </span>
                      <span className="ml-2 text-red-400">
                        Sent
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 truncate">
                      To: {tx.to.slice(0, 4)}...{tx.to.slice(-4)}
                    </div>

                    {tx.memo && (
                      <div className="text-xs text-gray-400 mt-1">
                        Memo: {tx.memo}
                      </div>
                    )}

                    {tx.hash && (
                      <div className="text-xs text-gray-500 mt-1">
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300"
                        >
                          View on Explorer
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 ml-3">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}