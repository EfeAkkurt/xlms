'use client';

import { useState, FormEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { WalletManager } from '@/lib/wallet-manager';
import { RootState, AppDispatch } from '@/store';
import { fetchBalance } from '@/store/walletSlice';
import { signTx, getFreighterNetwork, validateNetwork, type FreighterNetwork } from '@/lib/wallet/freighter';
import { logger, txLogger } from '@/lib/logger';

const EXPECTED_NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET').toUpperCase() as FreighterNetwork;

export default function SendForm({ onTransactionSuccess, onToast }: { onTransactionSuccess: () => void; onToast: (message: string, type: 'success' | 'error') => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const { publicKey, balance } = useSelector((state: RootState) => state.wallet);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);

  const validateAddress = async (address: string) => {
    if (address.length < 5) {
      setIsValidAddress(null);
      return;
    }

    const valid = WalletManager.validateStellarAddress(address);
    setIsValidAddress(valid);

    if (valid && address.length === 56) {
      // Check if account exists (optional, for better UX)
      try {
        const exists = await WalletManager.checkAccountExists(address);
        if (!exists) {
          logger.warn('SendForm', 'Recipient account not funded', { address: address.slice(0, 8) + '...' });
        }
      } catch (error: unknown) {
        const err = error as Error;
        // Don't show error to user, just log
        logger.debug('SendForm', 'Could not verify recipient account', { address: address.slice(0, 8) + '...', error: err.message });
      }
    }
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecipient(value);
    validateAddress(value);
  };

  const handleSendPayment = async (e: FormEvent) => {
    e.preventDefault();
    const txId = txLogger.startTransaction('SendForm', 'Payment Submission', {
      from: publicKey?.slice(0, 8) + '...',
      to: recipient.slice(0, 8) + '...',
      amount
    });

    if (!publicKey) {
      onToast('Wallet not connected', 'error');
      txLogger.failure('SendForm', 'Payment Submission', txId, 'Wallet not connected');
      return;
    }

    // Validation
    if (!recipient.trim()) {
      onToast('Please enter recipient address', 'error');
      txLogger.failure('SendForm', 'Payment Submission', txId, 'No recipient address');
      return;
    }

    if (!isValidAddress) {
      onToast('Invalid Stellar address', 'error');
      txLogger.failure('SendForm', 'Payment Submission', txId, 'Invalid address');
      return;
    }

    if (recipient === publicKey) {
      onToast('You cannot send to yourself', 'error');
      txLogger.failure('SendForm', 'Payment Submission', txId, 'Self-transfer attempted');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      onToast('Please enter a valid amount', 'error');
      txLogger.failure('SendForm', 'Payment Submission', txId, 'Invalid amount');
      return;
    }

    const balanceNum = parseFloat(balance);
    const totalNeeded = amountNum + 0.01; // Include fee

    if (totalNeeded > balanceNum) {
      onToast(`Insufficient balance. Required: ${totalNeeded.toFixed(7)} XLM`, 'error');
      txLogger.failure('SendForm', 'Payment Submission', txId, 'Insufficient balance', {
        balance: balanceNum,
        needed: totalNeeded
      });
      return;
    }

    setIsSending(true);

    try {
      txLogger.progress('SendForm', 'Payment Submission', txId, 'Validating network');

      // Validate network against Freighter
      try {
        const details = await getFreighterNetwork();
        const current = (details.network || '').toUpperCase();
        const isNetworkValid = validateNetwork(EXPECTED_NETWORK, current);

        if (!isNetworkValid) {
          const errorMsg = `Network mismatch: ${current} (Freighter) ≠ ${EXPECTED_NETWORK} (App)`;
          onToast(errorMsg, 'error');
          txLogger.failure('SendForm', 'Payment Submission', txId, 'Network mismatch', {
            current,
            expected: EXPECTED_NETWORK
          });
          return;
        }
      } catch (e: unknown) {
        const err = e as Error;
        logger.warn('SendForm', 'Unable to read Freighter network', err);
        // Continue anyway - let the transaction fail if network is wrong
      }

      txLogger.progress('SendForm', 'Payment Submission', txId, 'Building and sending transaction');

      // Create and send transaction
      const txHash = await WalletManager.sendPayment(
        publicKey,
        recipient,
        amountNum.toString(),
        async (xdr: string) => {
          return await signTx(xdr, EXPECTED_NETWORK);
        }
      );

      logger.transaction('SendForm', 'Payment successful', {
        from: publicKey,
        to: recipient,
        amount: amountNum.toString(),
        hash: txHash
      });

      txLogger.success('SendForm', 'Payment Submission', txId, {
        hash: txHash
      });

      onToast(`Payment sent successfully! Transaction: ${txHash.slice(0, 10)}...`, 'success');

      // Reset form
      setRecipient('');
      setAmount('');
      setIsValidAddress(null);

      // Refresh balance
      txLogger.progress('SendForm', 'Payment Submission', txId, 'Refreshing balance');
      try {
        await dispatch(fetchBalance(publicKey));
      } catch (error: unknown) {
        const err = error as Error;
        logger.error('SendForm', 'Failed to refresh balance', err);
      }

      // Notify parent to refresh transaction history
      onTransactionSuccess();

    } catch (error: unknown) {
      const err = error as Error;
      logger.error('SendForm', 'Payment error', {
        error: err.message,
        stack: err.stack,
        response: (err as Error & { response?: { data?: unknown } }).response?.data
      });

      // Provide user-friendly error messages
      let errorMessage = err.message || 'Transaction failed. Please try again.';

      if (errorMessage.includes('Insufficient')) {
        errorMessage = 'Insufficient balance. Please check your balance.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Transaction timed out. Please try again.';
      } else if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
        errorMessage = 'Transaction rejected by user.';
      }

      onToast(errorMessage, 'error');
      txLogger.failure('SendForm', 'Payment Submission', txId, err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSendPayment} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-300">
          Recipient Address
        </label>
        <div className="relative">
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={handleRecipientChange}
            placeholder="G..."
            className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-gray-200 placeholder-gray-500 outline-none transition-all duration-200 ${
              isValidAddress === false
                ? 'border-red-500 focus:border-red-400'
                : isValidAddress === true
                ? 'border-green-500 focus:border-green-400'
                : 'border-gray-700 focus:border-cyan-500'
            }`}
          />
          {recipient && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidAddress === true ? (
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : isValidAddress === false ? (
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
          Amount (XLM)
        </label>
        <div className="relative">
          <input
            id="amount"
            type="number"
            step="0.0000001"
            min="0.0000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0000000"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 focus:border-cyan-500 rounded-lg text-gray-200 placeholder-gray-500 outline-none transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setAmount((parseFloat(balance) - 0.5).toString())}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            MAX
          </button>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Available: {parseFloat(balance).toFixed(7)} XLM</span>
          <span>Reserve: 0.5 XLM</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSending || !isValidAddress || !amount || parseFloat(amount) <= 0}
        className="relative w-full py-4 px-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:scale-105 hover:brightness-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-green-500/25 group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>

        {isSending ? (
          <>
            <div className="relative w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="relative">Sending Payment...</span>
          </>
        ) : (
          <>
            <svg className="relative w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="relative">Send Payment</span>
          </>
        )}
      </button>
    </form>
  );
}
