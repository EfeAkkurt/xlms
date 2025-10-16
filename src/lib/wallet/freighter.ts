"use client";
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  setAllowed as freighterSetAllowed,
  requestAccess,
  getAddress as freighterGetAddress,
  getNetworkDetails,
  signTransaction as freighterSignTransaction,
  signAuthEntry,
  signMessage as freighterSignMessage,
  addToken as freighterAddToken,
  WatchWalletChanges,
} from "@stellar/freighter-api";
import { logger, txLogger } from "@/lib/logger";

type WindowWithFreighter = Window & {
  freighter?: {
    getPublicKey: () => Promise<string>;
    signTransaction: (xdr: string) => Promise<string>;
    isConnected: () => Promise<boolean>;
    getNetwork: () => Promise<string>;
  };
}

const SCOPE = "freighter";
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

export function hasFreighter(): boolean {
  // Check if freighter is available via direct API import
  const available = typeof window !== "undefined" && typeof freighterIsConnected === "function";
  if (!available) logger.debug(SCOPE, "Freighter API not available");
  return available;
}

// Export wrapped functions for external use
export const isConnected = freighterIsConnected;
export const getAddress = freighterGetAddress;
export { WatchWalletChanges };

// Check if the app is allowed to access Freighter
export async function checkIsAllowed(): Promise<boolean> {
  const txId = txLogger.startTransaction(SCOPE, 'Check Permissions');

  if (!hasFreighter()) {
    txLogger.failure(SCOPE, 'Check Permissions', txId, 'Freighter not found');
    return false;
  }

  try {
    const result = await freighterIsAllowed();
    logger.debug(SCOPE, 'Permission check result', { isAllowed: result.isAllowed });
    txLogger.success(SCOPE, 'Check Permissions', txId, { isAllowed: result.isAllowed });
    return result.isAllowed || false;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(SCOPE, 'Permission check failed', { error: err.message });
    txLogger.failure(SCOPE, 'Check Permissions', txId, err);
    return false;
  }
}

// Request permission to access Freighter
export async function requestPermission(): Promise<boolean> {
  const txId = txLogger.startTransaction(SCOPE, 'Request Permission');

  if (!hasFreighter()) {
    txLogger.failure(SCOPE, 'Request Permission', txId, 'Freighter not found');
    throw new Error("Freighter extension not installed or accessible. Please install from https://freighter.app");
  }

  try {
    const result = await freighterSetAllowed();
    logger.info(SCOPE, 'Permission request result', { isAllowed: result.isAllowed });
    txLogger.success(SCOPE, 'Request Permission', txId, { isAllowed: result.isAllowed });
    return result.isAllowed || false;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(SCOPE, 'Permission request failed', { error: err.message });
    txLogger.failure(SCOPE, 'Request Permission', txId, err);
    throw new Error(`Failed to request permission: ${err.message}`);
  }
}

export async function connectFreighter(): Promise<string> {
  const txId = txLogger.startTransaction(SCOPE, 'Wallet Connection', { hasFreighter: hasFreighter() });

  if (!hasFreighter()) {
    logger.warn(SCOPE, "Extension missing. Prompt install");
    txLogger.failure(SCOPE, 'Wallet Connection', txId, 'Freighter not installed');
    throw new Error("Freighter extension not installed or accessible. Please install from https://freighter.app");
  }

  try {
    txLogger.progress(SCOPE, 'Wallet Connection', txId, 'Checking connection');

    const connected = await freighterIsConnected();
    logger.debug(SCOPE, "isConnected result", { connected });

    if (!connected.isConnected) {
      logger.info(SCOPE, "Freighter not connected");
      txLogger.failure(SCOPE, 'Wallet Connection', txId, 'Freighter not connected');
      throw new Error('Please connect your Freighter wallet first');
    }

    // Use requestAccess as per documentation
    const accessResponse = await requestAccess();

    if (accessResponse.error) {
      throw new Error(accessResponse.error);
    }

    const pub = accessResponse.address;

    if (!pub || pub.length !== 56) {
      throw new Error('Invalid public key received');
    }

    logger.wallet(SCOPE, 'Connected successfully', pub);
    txLogger.success(SCOPE, 'Wallet Connection', txId, {
      publicKey: pub.slice(0, 8) + '...' + pub.slice(-8)
    });

    return pub;
  } catch (e: unknown) {
    const error = e as Error;
    logger.error(SCOPE, 'Connection failed', {
      error: error.message,
      name: error.name
    });
    txLogger.failure(SCOPE, 'Wallet Connection', txId, error);
    throw new Error(`Wallet connection failed: ${error.message}`);
  }
}

export async function getFreighterNetwork() {
  const txId = txLogger.startTransaction(SCOPE, 'Get Network Details');

  if (!hasFreighter()) {
    txLogger.failure(SCOPE, 'Get Network Details', txId, 'Freighter not found');
    throw new Error("Freighter not found");
  }

  try {
    const details = await getNetworkDetails();
    logger.network(SCOPE, details.network || 'Unknown', details);
    txLogger.success(SCOPE, 'Get Network Details', txId, details);
    return details;
  } catch (error: unknown) {
    const err = error as Error;
    txLogger.failure(SCOPE, 'Get Network Details', txId, err);
    throw new Error(`Failed to get network information: ${err.message}`);
  }
}

export type FreighterNetwork = "PUBLIC" | "TESTNET" | "FUTURENET" | "SANDBOX";

const NETWORK_PASSPHRASES: Record<FreighterNetwork, string> = {
  PUBLIC: "Public Global Stellar Network ; September 2015",
  TESTNET: "Test SDF Network ; September 2015",
  FUTURENET: "Test SDF Future Network ; October 2022",
  SANDBOX: "Local Sandbox Stellar Network ; September 2022",
};

export async function signTx(envelopeXdr: string, network?: FreighterNetwork): Promise<string> {
  const txId = txLogger.startTransaction(SCOPE, 'Sign Transaction', {
    network,
    xdrLength: envelopeXdr.length
  });

  if (!hasFreighter()) {
    txLogger.failure(SCOPE, 'Sign Transaction', txId, 'Freighter not found');
    throw new Error("Freighter not found");
  }

  if (!envelopeXdr) {
    txLogger.failure(SCOPE, 'Sign Transaction', txId, 'No XDR provided');
    throw new Error('No transaction data to sign');
  }

  try {
    let net = network;
    let passphrase: string | undefined;

    if (net) {
      passphrase = NETWORK_PASSPHRASES[net];
    }

    if (!passphrase) {
      txLogger.progress(SCOPE, 'Sign Transaction', txId, 'Fetching network details');
      const details = await getFreighterNetwork();
      net = (details.network ?? "TESTNET") as FreighterNetwork;
      passphrase = details.networkPassphrase || NETWORK_PASSPHRASES[net];
    }

    if (!passphrase) {
      throw new Error('Unable to determine network passphrase');
    }

    logger.info(SCOPE, "Signing transaction", { network: net, passphrase });
    txLogger.progress(SCOPE, 'Sign Transaction', txId, 'Waiting for user signature');

    const signedResult = await freighterSignTransaction(envelopeXdr, { networkPassphrase: passphrase });

    if ((signedResult as { error?: { message?: string } }).error) {
      const errorMessage = (signedResult as { error?: { message?: string } }).error?.message || 'Transaction signing failed';
      throw new Error(errorMessage);
    }

    if (!signedResult) {
      throw new Error('Transaction signing was cancelled by user');
    }

    // Extract the signed XDR from the response
    const signedResultObj = signedResult as { signedTxXdr?: string };
    let signedXdr = signedResultObj.signedTxXdr || signedResult;

    // Ensure signedXdr is a string
    if (typeof signedXdr !== 'string') {
      const objWithXdr = signedXdr as { signedTxXdr?: string };
      signedXdr = objWithXdr.signedTxXdr || '';
    }

    if (!signedXdr) {
      throw new Error('No signed transaction received');
    }

    logger.debug(SCOPE, "Transaction signed successfully", {
      signedLength: signedXdr.length,
      network: net
    });

    txLogger.success(SCOPE, 'Sign Transaction', txId, { network: net });
    return signedXdr;
  } catch (error: unknown) {
    const err = error as Error;
    let errorMessage = err.message || 'Unknown error';

    // Handle common user rejection scenarios
    if (errorMessage.includes('rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
      errorMessage = 'Transaction was rejected by user';
      logger.warn(SCOPE, 'Transaction rejected by user', { error: errorMessage });
    } else if (errorMessage.includes('timeout')) {
      errorMessage = 'Transaction timed out. Please try again.';
      logger.warn(SCOPE, 'Transaction timeout', { error: errorMessage });
    } else {
      logger.error(SCOPE, 'Sign transaction failed', { error: errorMessage, stack: err.stack });
    }

    txLogger.failure(SCOPE, 'Sign Transaction', txId, err);
    throw new Error(errorMessage);
  }
}

// Get user info using getAddress API
export async function getFreighterUserInfo() {
  const txId = txLogger.startTransaction(SCOPE, 'Get User Info');

  if (!hasFreighter()) {
    txLogger.failure(SCOPE, 'Get User Info', txId, 'Freighter not found');
    throw new Error("Freighter not found");
  }

  try {
    const userInfoResponse = await freighterGetAddress();
    const userInfo = { publicKey: userInfoResponse.address };
    if (!userInfo || !userInfo.publicKey) {
      throw new Error('Could not retrieve user information');
    }

    logger.wallet(SCOPE, 'User info retrieved', userInfo.publicKey);
    txLogger.success(SCOPE, 'Get User Info', txId, {
      publicKey: userInfo.publicKey.slice(0, 8) + '...'
    });

    return userInfo;
  } catch (error: unknown) {
    const err = error as Error;
    txLogger.failure(SCOPE, 'Get User Info', txId, err);
    throw new Error(`Failed to get user information: ${err.message}`);
  }
}

// Sign a message with the user's private key
export async function signMessageWithFreighter(message: string, address?: string): Promise<{ signedMessage: string | null; signerAddress: string }> {
  const txId = txLogger.startTransaction(SCOPE, 'Sign Message', { messageLength: message.length });

  if (!hasFreighter()) {
    txLogger.failure(SCOPE, 'Sign Message', txId, 'Freighter not found');
    throw new Error("Freighter not found");
  }

  if (!message) {
    txLogger.failure(SCOPE, 'Sign Message', txId, 'No message provided');
    throw new Error('No message to sign');
  }

  try {
    const signerAddress = address || (await getAddress()).address;
    if (!signerAddress) {
      throw new Error('No signer address available');
    }

    logger.info(SCOPE, 'Signing message', { message: message.slice(0, 50) + '...' });
    txLogger.progress(SCOPE, 'Sign Message', txId, 'Waiting for user signature');

    const result = await freighterSignMessage(message, { address: signerAddress });

    if (result.error) {
      throw new Error(result.error);
    }

    logger.debug(SCOPE, 'Message signed successfully');
    txLogger.success(SCOPE, 'Sign Message', txId, { signerAddress });

    // Convert Buffer to base64 string if needed
    const signedMessage = result.signedMessage
      ? typeof result.signedMessage === 'string'
        ? result.signedMessage
        : result.signedMessage.toString('base64')
      : null;

    return { ...result, signedMessage };
  } catch (error: unknown) {
    const err = error as Error;
    let errorMessage = err.message || 'Unknown error';

    if (errorMessage.includes('rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
      errorMessage = 'Message signing was rejected by user';
      logger.warn(SCOPE, 'Message signing rejected by user');
    }

    logger.error(SCOPE, 'Sign message failed', { error: errorMessage });
    txLogger.failure(SCOPE, 'Sign Message', txId, err);
    throw new Error(errorMessage);
  }
}

// Sign a blob with the user's private key (using message signing as fallback)
export async function signBlobWithFreighter(blob: string, address?: string): Promise<{ signedBlob: string | null; signerAddress: string }> {
  // Sign the blob as a message since signBlob is not available in freighter-api
  const result = await signMessageWithFreighter(blob, address);
  return {
    signedBlob: result.signedMessage,
    signerAddress: result.signerAddress
  };
}

// Sign an auth entry for Soroban contracts
export async function signAuthEntryWithFreighter(authEntryXdr: string, address: string): Promise<{ signedAuthEntry: Buffer | null; signerAddress: string }> {
  const txId = txLogger.startTransaction(SCOPE, 'Sign Auth Entry', { xdrLength: authEntryXdr.length });

  if (!hasFreighter()) {
    txLogger.failure(SCOPE, 'Sign Auth Entry', txId, 'Freighter not found');
    throw new Error("Freighter not found");
  }

  if (!authEntryXdr) {
    txLogger.failure(SCOPE, 'Sign Auth Entry', txId, 'No auth entry provided');
    throw new Error('No auth entry to sign');
  }

  try {
    logger.info(SCOPE, 'Signing auth entry');
    txLogger.progress(SCOPE, 'Sign Auth Entry', txId, 'Waiting for user signature');

    const result = await signAuthEntry(authEntryXdr, { address });

    if (result.error) {
      throw new Error(result.error);
    }

    logger.debug(SCOPE, 'Auth entry signed successfully');
    txLogger.success(SCOPE, 'Sign Auth Entry', txId, { signerAddress: address });

    return result;
  } catch (error: unknown) {
    const err = error as Error;
    let errorMessage = err.message || 'Unknown error';

    if (errorMessage.includes('rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
      errorMessage = 'Auth entry signing was rejected by user';
      logger.warn(SCOPE, 'Auth entry signing rejected by user');
    }

    logger.error(SCOPE, 'Sign auth entry failed', { error: errorMessage });
    txLogger.failure(SCOPE, 'Sign Auth Entry', txId, err);
    throw new Error(errorMessage);
  }
}

// Add a Soroban token to Freighter
export async function addTokenToFreighter(contractId: string, networkPassphrase?: string): Promise<string> {
  const txId = txLogger.startTransaction(SCOPE, 'Add Token', { contractId });

  if (!hasFreighter()) {
    txLogger.failure(SCOPE, 'Add Token', txId, 'Freighter not found');
    throw new Error("Freighter not found");
  }

  if (!contractId) {
    txLogger.failure(SCOPE, 'Add Token', txId, 'No contract ID provided');
    throw new Error('No contract ID provided');
  }

  try {
    logger.info(SCOPE, 'Adding token', { contractId });
    txLogger.progress(SCOPE, 'Add Token', txId, 'Waiting for user confirmation');

    const result = await freighterAddToken({ contractId, networkPassphrase });

    if (result.error) {
      throw new Error(result.error);
    }

    logger.info(SCOPE, 'Token added successfully', { contractId: result.contractId });
    txLogger.success(SCOPE, 'Add Token', txId, { contractId: result.contractId });

    return result.contractId;
  } catch (error: unknown) {
    const err = error as Error;
    let errorMessage = err.message || 'Unknown error';

    if (errorMessage.includes('rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
      errorMessage = 'Token addition was rejected by user';
      logger.warn(SCOPE, 'Token addition rejected by user');
    }

    logger.error(SCOPE, 'Add token failed', { error: errorMessage });
    txLogger.failure(SCOPE, 'Add Token', txId, err);
    throw new Error(errorMessage);
  }
}

// Watch wallet changes
export function createWalletWatcher(timeout: number = 3000) {
  const txId = txLogger.startTransaction(SCOPE, 'Create Wallet Watcher', { timeout });

  if (!hasFreighter()) {
    txLogger.failure(SCOPE, 'Create Wallet Watcher', txId, 'Freighter not found');
    throw new Error("Freighter not found");
  }

  try {
    const watcher = new WatchWalletChanges(timeout);
    logger.info(SCOPE, 'Wallet watcher created', { timeout });
    txLogger.success(SCOPE, 'Create Wallet Watcher', txId);
    return watcher;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(SCOPE, 'Create wallet watcher failed', { error: err.message });
    txLogger.failure(SCOPE, 'Create Wallet Watcher', txId, err);
    throw new Error(`Failed to create wallet watcher: ${err.message}`);
  }
}

// Validate network compatibility
export function validateNetwork(expectedNetwork: FreighterNetwork, currentNetwork: string): boolean {
  const isValid = expectedNetwork === currentNetwork.toUpperCase();
  logger.validation(SCOPE, 'Network', currentNetwork, isValid);

  if (!isValid) {
    logger.warn(SCOPE, 'Network mismatch', {
      expected: expectedNetwork,
      current: currentNetwork
    });
  }

  return isValid;
}
