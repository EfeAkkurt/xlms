'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { fetchBalance } from '@/store/walletSlice';
import { useEffect } from 'react';

export default function BalanceCard() {
  const { publicKey, balance, isLoading, error } = useSelector((state: RootState) => state.wallet);
  const dispatch = useDispatch();

  useEffect(() => {
    if (publicKey) {
      dispatch(fetchBalance(publicKey) as never);
    }
  }, [publicKey, dispatch]);

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
      <h2 className="text-xl font-semibold text-white mb-6">Account Balance</h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-400 text-sm mb-2">Available Balance</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white">
              {isLoading ? '...' : balance}
            </span>
            <span className="text-gray-400">XLM</span>
          </div>
        </div>
        {error && (
          <div className="text-red-400 text-sm">
            Error: {error}
          </div>
        )}
        <div className="pt-4 border-t border-white/10">
          <p className="text-gray-500 text-xs">
            Testnet funds - Not real value
          </p>
        </div>
      </div>
    </div>
  );
}