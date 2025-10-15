import { Horizon } from '@stellar/stellar-sdk';
import { logger, txLogger } from './logger';

const SCOPE = 'transactionTracker';
const server = new Horizon.Server('https://horizon-testnet.stellar.org');

type HorizonTransactionRecord = {
  successful: boolean;
  ledger: number;
  created_at: string;
  result_xdr: string;
  hash: string;
  operations: () => Promise<{ records: Horizon.ServerApi.OperationRecord[] }>;
};

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'failed' | 'unknown';
  ledger?: number;
  createdAt?: string;
  successful?: boolean;
  resultXdr?: string;
  error?: string;
}

export class TransactionTracker {
  private static instance: TransactionTracker;
  private pendingTransactions: Map<string, {
    resolve: (status: TransactionStatus) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  static getInstance(): TransactionTracker {
    if (!TransactionTracker.instance) {
      TransactionTracker.instance = new TransactionTracker();
    }
    return TransactionTracker.instance;
  }

  /**
   * Track a transaction until it's confirmed or failed
   */
  async trackTransaction(hash: string, timeoutMs: number = 60000): Promise<TransactionStatus> {
    const txId = txLogger.startTransaction(SCOPE, 'Track Transaction', { hash: hash.slice(0, 8) + '...' });

    return new Promise((resolve, reject) => {
      // Clear any existing tracking for this hash
      this.stopTracking(hash);

      // Set timeout
      const timeout = setTimeout(() => {
        this.stopTracking(hash);
        const error = new Error(`Transaction tracking timeout after ${timeoutMs}ms`);
        txLogger.failure(SCOPE, 'Track Transaction', txId, error);
        reject(error);
      }, timeoutMs);

      // Store the promise handlers
      this.pendingTransactions.set(hash, { resolve, reject, timeout });

      // Start checking
      this.checkTransaction(hash, txId, resolve, reject, timeout);
    });
  }

  /**
   * Stop tracking a transaction
   */
  stopTracking(hash: string): void {
    const pending = this.pendingTransactions.get(hash);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingTransactions.delete(hash);
      logger.debug(SCOPE, 'Stopped tracking transaction', { hash: hash.slice(0, 8) + '...' });
    }
  }

  private async checkTransaction(
    hash: string,
    txId: string,
    resolve: (status: TransactionStatus) => void,
    reject: (error: Error) => void,
    timeout: NodeJS.Timeout,
    attempt: number = 1
  ): Promise<void> {
    try {
      txLogger.progress(SCOPE, 'Track Transaction', txId, `Checking attempt ${attempt}`);

      const tx = await server.transactions().transaction(hash);

      // Transaction found
      clearTimeout(timeout);
      this.pendingTransactions.delete(hash);

      // Cast the response to the correct type
      const txRecord = tx as unknown as HorizonTransactionRecord;

      const status: TransactionStatus = {
        hash,
        status: txRecord.successful ? 'success' : 'failed',
        ledger: typeof txRecord.ledger === 'number' ? txRecord.ledger : undefined,
        createdAt: txRecord.created_at,
        successful: txRecord.successful,
        resultXdr: txRecord.result_xdr
      };

      if (!txRecord.successful) {
        status.error = 'Transaction failed';
      }

      logger.info(SCOPE, `Transaction ${status.status}`, {
        hash: hash.slice(0, 8) + '...',
        ledger: status.ledger,
        successful: status.successful
      });

      txLogger.success(SCOPE, 'Track Transaction', txId, status);
      resolve(status);

    } catch (error: unknown) {
      const err = error as Error;
      if ((err as Error & { response?: { status?: number } }).response?.status === 404) {
        // Transaction not yet found, retry
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        logger.debug(SCOPE, `Transaction not found, retrying in ${delay}ms`, {
          hash: hash.slice(0, 8) + '...',
          attempt
        });

        setTimeout(() => {
          if (this.pendingTransactions.has(hash)) {
            this.checkTransaction(hash, txId, resolve, reject, timeout, attempt + 1);
          }
        }, delay);
      } else {
        // Unexpected error
        clearTimeout(timeout);
        this.pendingTransactions.delete(hash);
        logger.error(SCOPE, 'Error checking transaction', err);
        txLogger.failure(SCOPE, 'Track Transaction', txId, err);
        reject(err);
      }
    }
  }

  /**
   * Quick check if transaction exists and is successful
   */
  async checkTransactionQuick(hash: string): Promise<TransactionStatus | null> {
    try {
      const tx = await server.transactions().transaction(hash);
      const txRecord = tx as unknown as HorizonTransactionRecord;

      return {
        hash,
        status: txRecord.successful ? 'success' : 'failed',
        ledger: typeof txRecord.ledger === 'number' ? txRecord.ledger : undefined,
        createdAt: txRecord.created_at,
        successful: txRecord.successful,
        resultXdr: txRecord.result_xdr
      };
    } catch (error: unknown) {
      const err = error as Error;
      if ((err as Error & { response?: { status?: number } }).response?.status === 404) {
        return {
          hash,
          status: 'pending'
        };
      }
      throw err;
    }
  }

  /**
   * Get transaction details with operations
   */
  async getTransactionDetails(hash: string): Promise<TransactionStatus & { operations: Horizon.ServerApi.OperationRecord[] }> {
    const txId = txLogger.startTransaction(SCOPE, 'Get Transaction Details', { hash: hash.slice(0, 8) + '...' });

    try {
      const tx = await server.transactions().transaction(hash);
      const txRecord = tx as unknown as HorizonTransactionRecord;
      const opsResponse = await txRecord.operations();

      const details: TransactionStatus & { operations: Horizon.ServerApi.OperationRecord[] } = {
        hash,
        status: txRecord.successful ? 'success' : 'failed',
        ledger: typeof txRecord.ledger === 'number' ? txRecord.ledger : undefined,
        createdAt: txRecord.created_at,
        successful: txRecord.successful,
        resultXdr: txRecord.result_xdr,
        operations: opsResponse.records
      };

      txLogger.success(SCOPE, 'Get Transaction Details', txId, {
        status: details.status,
        numOperations: details.operations.length
      });

      return details;
    } catch (error: unknown) {
      const err = error as Error;
      txLogger.failure(SCOPE, 'Get Transaction Details', txId, err);
      throw err;
    }
  }

  /**
   * Get account transaction history with status
   */
  async getAccountTransactionHistory(
    publicKey: string,
    limit: number = 10,
    cursorParam?: string
  ): Promise<{ transactions: TransactionStatus[]; cursor?: string }> {
    const txId = txLogger.startTransaction(SCOPE, 'Get Account History', {
      publicKey: publicKey.slice(0, 8) + '...',
      limit
    });

    try {
      const callBuilder = server
        .transactions()
        .forAccount(publicKey)
        .limit(limit)
        .order('desc')
        .includeFailed(true);

      if (cursorParam) {
        callBuilder.cursor(cursorParam);
      }

      const result = await callBuilder.call();

      const transactions: TransactionStatus[] = result.records.map((tx: Horizon.ServerApi.TransactionRecord) => ({
        hash: tx.hash,
        status: tx.successful ? 'success' : 'failed',
        ledger: typeof tx.ledger === 'number' ? tx.ledger : 0,
        createdAt: tx.created_at,
        successful: tx.successful,
        resultXdr: tx.result_xdr,
        error: !tx.successful ? 'Transaction failed' : undefined
      }));

      // Handle cursor property safely
      const cursor = (result as { cursor?: string }).cursor || undefined;

      txLogger.success(SCOPE, 'Get Account History', txId, {
        count: transactions.length,
        cursor: cursor
      });

      return {
        transactions,
        cursor
      };
    } catch (error: unknown) {
      const err = error as Error;
      txLogger.failure(SCOPE, 'Get Account History', txId, err);
      throw err;
    }
  }

  /**
   * Clean up all pending transactions
   */
  cleanup(): void {
    for (const [, pending] of this.pendingTransactions.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Transaction tracker cleaned up'));
    }
    this.pendingTransactions.clear();
    logger.info(SCOPE, 'Cleaned up all pending transactions');
  }
}

// Export singleton instance
export const transactionTracker = TransactionTracker.getInstance();

// Export convenience functions
export const trackTransaction = (hash: string, timeout?: number) =>
  transactionTracker.trackTransaction(hash, timeout);

export const checkTransactionQuick = (hash: string) =>
  transactionTracker.checkTransactionQuick(hash);

export const getTransactionDetails = (hash: string) =>
  transactionTracker.getTransactionDetails(hash);