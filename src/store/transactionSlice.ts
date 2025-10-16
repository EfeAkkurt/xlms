import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  hash?: string;
  memo?: string;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  transactions: [],
  isLoading: false,
  error: null,
};

// Async thunk for XLM transfer
export const sendXLM = createAsyncThunk(
  'transaction/sendXLM',
  async ({ from, to, amount, memo }: { from: string; to: string; amount: string; memo?: string }) => {
    const { signTx } = await import('@/lib/wallet/freighter');

    try {
      // Build transaction
      const {
        horizonServer,
        TransactionBuilder,
        Asset,
        Networks,
        Operation,
        Memo
      } = await import('@/lib/stellar-client');

      const sourceAccount = await horizonServer.loadAccount(from);
      const fee = '100'; // 0.00001 XLM fee

      const transaction = new TransactionBuilder(sourceAccount, {
        fee,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: to,
            asset: Asset.native(),
            amount: amount,
          })
        );

      if (memo) {
        transaction.addMemo(Memo.text(memo));
      }

      const builtTransaction = transaction
        .setTimeout(30)
        .build();

      // Sign with Freighter
      const signedXDR = await signTx(builtTransaction.toXDR(), 'TESTNET');

      // Submit to network
      const signedTransaction = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);
      const result = await horizonServer.submitTransaction(signedTransaction);

      return {
        id: result.hash || `tx_${Date.now()}`,
        hash: result.hash,
        from,
        to,
        amount,
        timestamp: Date.now(),
        status: 'success' as const,
        memo,
      };
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(err.message || 'Transfer failed');
    }
  }
);

// Async thunk to fetch transaction history
export const fetchTransactionHistory = createAsyncThunk(
  'transaction/fetchHistory',
  async (publicKey: string) => {
    const { horizonServer } = await import('@/lib/stellar-client');

    try {
      const transactions = await horizonServer
        .transactions()
        .forAccount(publicKey)
        .limit(20)
        .order('desc')
        .call();

      return transactions.records.map((tx) => ({
        id: tx.hash || `tx_${Date.now()}_${Math.random()}`,
        hash: tx.hash,
        from: tx.source_account,
        to: (tx.operations?.[0] as any)?.destination || publicKey,
        amount: (tx.operations?.[0] as any)?.amount || '0',
        timestamp: new Date(tx.created_at).getTime(),
        status: tx.successful ? 'success' : 'failed' as const,
        memo: tx.memo ? tx.memo : undefined,
      }));
    } catch (error: unknown) {
      console.error('Failed to fetch transaction history:', error);
      // If account not found, return empty array instead of throwing
      if ((error as any).response?.status === 404) {
        console.log('Account not found or no transactions');
        return [];
      }
      return [];
    }
  }
);

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Send XLM
      .addCase(sendXLM.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendXLM.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions.unshift(action.payload);
      })
      .addCase(sendXLM.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Transfer failed';
      })
      // Fetch history
      .addCase(fetchTransactionHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactionHistory.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearError, addTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
