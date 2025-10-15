import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  balance: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  publicKey: null,
  isConnected: false,
  balance: '0.0000000',
  isLoading: false,
  error: null,
};

// Async thunk for balance fetching (will be implemented client-side)
export const fetchBalance = createAsyncThunk(
  'wallet/fetchBalance',
  async (publicKey: string) => {
    // This will be called from client-side components
    // Import WalletManager dynamically to avoid server-side execution
    const { WalletManager } = await import('@/lib/wallet-manager');
    return await WalletManager.fetchBalance(publicKey);
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (state, action: PayloadAction<string>) => {
      state.publicKey = action.payload;
      state.isConnected = true;
      state.error = null;
    },
    disconnectWallet: (state) => {
      state.publicKey = null;
      state.isConnected = false;
      state.balance = '0.0000000';
      state.error = null;
    },
    setBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch balance';
      });
  },
});

export const { connectWallet, disconnectWallet, setBalance, setError, setLoading } = walletSlice.actions;
export default walletSlice.reducer;