"use client";

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { sendXLM, clearError } from '@/store/transactionSlice';

export default function Transfer() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const dispatch = useDispatch();
  const { publicKey } = useSelector((state: RootState) => state.wallet);
  const { isLoading, error } = useSelector((state: RootState) => state.transaction);

  const handleTransfer = async () => {
    if (!recipient || !amount || !publicKey) {
      return;
    }

    // Validate Stellar address format
    if (!recipient.startsWith('G') || recipient.length !== 56) {
      dispatch(clearError());
      // Component-level error for validation
      return;
    }

    dispatch(sendXLM({
      from: publicKey,
      to: recipient,
      amount: parseFloat(amount).toFixed(7),
      memo: memo || undefined
    }));

    // Clear form on successful transfer
    if (!error) {
      setRecipient('');
      setAmount('');
      setMemo('');
    }
  };

  if (!publicKey) {
    return null;
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">XLM Transfer</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="G..."
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Amount (XLM)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.0000001"
            min="0"
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Memo (Optional)
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Transaction memo"
            maxLength="28"
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}

        <button
          onClick={handleTransfer}
          disabled={isLoading || !recipient || !amount || parseFloat(amount) <= 0}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:scale-[1.02] hover:brightness-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Transferring...</span>
            </div>
          ) : (
            <span>Send XLM</span>
          )}
        </button>
      </div>
    </div>
  );
}