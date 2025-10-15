'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  type: 'payment' | 'create_account' | 'manage_data';
  amount?: string;
  from: string;
  to: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
  memo?: string;
}

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock transactions for demonstration
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'payment',
      amount: '10.0000000',
      from: 'GABC...DEF',
      to: 'G123...456',
      timestamp: new Date(Date.now() - 3600000),
      status: 'success',
      memo: 'Test payment'
    },
    {
      id: '2',
      type: 'create_account',
      from: 'GXYZ...789',
      to: 'GNEW...ACC',
      timestamp: new Date(Date.now() - 7200000),
      status: 'success'
    },
    {
      id: '3',
      type: 'payment',
      amount: '5.5000000',
      from: 'GOLD...000',
      to: 'GNEW...ACC',
      timestamp: new Date(Date.now() - 10800000),
      status: 'pending'
    }
  ];

  useEffect(() => {
    // Simulate loading transactions
    setIsLoading(true);
    setTimeout(() => {
      setTransactions(mockTransactions);
      setIsLoading(false);
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'payment':
        return '💸';
      case 'create_account':
        return '👤';
      case 'manage_data':
        return '📝';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
      <h2 className="text-xl font-semibold text-white mb-6">Recent Transactions</h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-800/50 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTypeIcon(tx.type)}</span>
                  <div>
                    <p className="text-white font-medium">
                      {tx.type === 'payment' && tx.amount && `Sent ${tx.amount} XLM`}
                      {tx.type === 'create_account' && 'Created Account'}
                      {tx.type === 'manage_data' && 'Managed Data'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {tx.from === 'You' ? 'You' : formatAddress(tx.from)} → {' '}
                      {tx.to === 'You' ? 'You' : formatAddress(tx.to)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`${getStatusColor(tx.status)} text-sm capitalize`}>
                    {tx.status}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {tx.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {tx.memo && (
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <p className="text-gray-400 text-sm">Memo: {tx.memo}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
          View All Transactions →
        </button>
      </div>
    </div>
  );
}