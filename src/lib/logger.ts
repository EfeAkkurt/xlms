export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  timestamp?: string;
  requestId?: string;
  userId?: string;
  transactionId?: string;
  [key: string]: unknown;
}

function format(scope: string, message: string, meta?: unknown, context?: LogContext) {
  const ts = context?.timestamp || new Date().toISOString();
  const requestId = context?.requestId ? `[${context.requestId}]` : '';
  const txId = context?.transactionId ? `[TX:${context.transactionId.slice(0, 8)}]` : '';

  const prefix = `[${ts}] [${scope}]${requestId}${txId}`;

  if (meta !== undefined) {
    return [`${prefix} ${message}`, meta];
  }
  return [`${prefix} ${message}`];
}

// Transaction logger for detailed transaction tracking
export const txLogger = {
  startTransaction(scope: string, operation: string, meta?: unknown): string {
    const txId = Math.random().toString(36).substr(2, 9);
    logger.info(scope, `🚀 START: ${operation}`, meta, { transactionId: txId });
    return txId;
  },

  success(scope: string, operation: string, txId: string, meta?: unknown) {
    logger.info(scope, `✅ SUCCESS: ${operation}`, meta, { transactionId: txId });
  },

  failure(scope: string, operation: string, txId: string, error: unknown, meta?: unknown) {
    logger.error(scope, `❌ FAILED: ${operation}`, meta && typeof meta === 'object' ? { error, ...meta } : { error }, { transactionId: txId });
  },

  progress(scope: string, operation: string, txId: string, step: string, meta?: unknown) {
    logger.info(scope, `⏳ PROGRESS: ${operation} - ${step}`, meta, { transactionId: txId });
  }
};

export const logger = {
  debug(scope: string, message: string, meta?: unknown, context?: LogContext) {
    console.debug(...format(scope, message, meta, context));
  },
  info(scope: string, message: string, meta?: unknown, context?: LogContext) {
    console.info(...format(scope, message, meta, context));
  },
  warn(scope: string, message: string, meta?: unknown, context?: LogContext) {
    console.warn(...format(scope, message, meta, context));
  },
  error(scope: string, message: string, meta?: unknown, context?: LogContext) {
    console.error(...format(scope, message, meta, context));
  },

  // Structured logging for specific events
  transaction: (scope: string, event: string, data: { from: string; to: string; amount: string; hash?: string }) => {
    logger.info(scope, `💸 TRANSACTION: ${event}`, {
      from: data.from.slice(0, 8) + '...',
      to: data.to.slice(0, 8) + '...',
      amount: data.amount,
      hash: data.hash?.slice(0, 16) + '...'
    });
  },

  wallet: (scope: string, event: string, address?: string) => {
    logger.info(scope, `🔐 WALLET: ${event}`, address ? { address: address.slice(0, 8) + '...' } : undefined);
  },

  network: (scope: string, network: string, details?: unknown) => {
    logger.info(scope, `🌐 NETWORK: ${network}`, details);
  },

  validation: (scope: string, field: string, value: string, isValid: boolean) => {
    logger.debug(scope, `✅ VALIDATION: ${field} = ${isValid ? 'VALID' : 'INVALID'}`, { value });
  }
};

