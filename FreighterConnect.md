## FREIGHTER DOCS USING FREIGHTER IN A WEB APP:
Using Freighter in a web app
We now have an extension installed on our machine and a library to interact with it. This library will provide you methods to send and receive data from a user's extension in your website or application.

Importing
First import the whole library in an ES2023 application

import freighterApi from "@stellar/freighter-api";

or import just the modules you require:

import {
  isConnected,
  getAddress,
  signAuthEntry,
  signTransaction,
  signBlob,
  addToken,
} from "@stellar/freighter-api";

Now let's dig into what functionality is available to you:

isConnected
isConnected() -> <Promise<{ isConnected: boolean } & { error?: string; }>>
This function is useful for determining if a user in your application has Freighter installed.

import { isConnected } from "@stellar/freighter-api";

const isAppConnected = await isConnected();

if (isAppConnected.isConnected) {
  alert("User has Freighter!");
}

isAllowed
isAllowed() -> <Promise<{ isAllowed: boolean } & { error?: string; }>>
This function is useful for determining if a user has previously authorized your app to receive data from Freighter.

import { isAllowed } from "@stellar/freighter-api";

const isAppAllowed = await isAllowed();

if (isAppAllowed.isAllowed) {
  alert("User has allowed your app!");
}

setAllowed
setAllowed() -> <Promise<{ isAllowed: boolean } & { error?: string; }>>
If a user has never interacted with your app before, this function will prompt the user to provide your app privileges to receive user data. If and when the user accepts, this function will resolve with a boolean of true indicating the app is now on the extension's "Allow list". This means the extension can immediately provide user data without any user action.

import { setAllowed } from "@stellar/freighter-api";

const isAppAllowed = await setAllowed();

if (isAppAllowed.isAllowed) {
  alert("Successfully added the app to Freighter's Allow List");
}

requestAccess
requestAccess() -> <Promise<{ address: string } & { error?: string; }>>
If a user has never interacted with your app before, this function will prompt the user to provide your app privileges to receive the user's public key. If and when the user accepts, this function will resolve with an object containing the public key. Otherwise, it will provide an error.

If the user has authorized your application previously, it will be on the extension's "Allow list", meaning the extension can immediately provide the public key without any user action.

import {
  isConnected,
  requestAccess,
  signAuthEntry,
  signTransaction,
  signBlob,
} from "@stellar/freighter-api";

const isAppConnected = await isConnected();

if ("isConnected" in isAppConnected && isAppConnected.isConnected) {
  alert("User has Freighter!");
}

const retrievePublicKey = async () => {
  const accessObj = await requestAccess();

  if (accessObj.error) {
    return accessObj.error;
  } else {
    return accessObj.address;
  }
};

const result = retrievePublicKey();

getAddress
getAddress() -> <Promise<{ address: string } & { error?: string; }>>
This is a more lightweight version of requestAccess above.

If the user has authorized your application previously and Freighter is connected, Freighter will simply return the public key. If either one of the above is not true, it will return an empty string.

import { getAddress } from "@stellar/freighter-api";

const retrievePublicKey = async () => {
  const addressObj = await getAddress();

  if (addressObj.error) {
    return addressObj.error;
  } else {
    return addressObj.address;
  }
};

const result = retrievePublicKey();

getNetwork
getNetwork() -> <Promise<{ network: string; networkPassphrase: string } & { error?: string; }>>
This function is useful for determining what network the user has configured Freighter to use. Freighter will be configured to either PUBLIC, TESTNET, FUTURENET, or STANDALONE (for custom networks).

import {
  isConnected,
  getNetwork,
  signAuthEntry,
  signTransaction,
  signBlob,
} from "@stellar/freighter-api";

const isAppConnected = await isConnected();

if (isAppConnected.isConnected) {
  alert("User has Freighter!");
}

const retrieveNetwork = async () => {
  const networkObj = await getNetwork();

  if (networkObj.error) {
    return networkObj.error;
  } else {
    return {
      network: networkObj.network,
      networkPassphrase: networkObj.networkPassphrase,
    };
  }
};

const result = retrieveNetwork();

getNetworkDetails
getNetworkDetails() -> <Promise<{ network: string; networkUrl: string; networkPassphrase: string; sorobanRpcUrl?: string; } & { error?: string; }>>
Similar to getNetwork(), this function retrieves network information from Freighter. However, while getNetwork() returns only the network name (such as "PUBLIC" or "TESTNET"), getNetworkDetails() provides comprehensive network configuration including the full network URL, network passphrase, and Soroban RPC URL when available.

import {
  isConnected,
  getNetwork,
  getNetworkDetails,
} from "@stellar/freighter-api";

const checkNetworks = async () => {
  if (!(await isConnected())) {
    return;
  }

  // Basic network name
  const network = await getNetwork();
  console.log("Network:", network); // e.g., "TESTNET"

  // Detailed network information
  const details = await getNetworkDetails();
  console.log("Network:", details.network); // e.g., "TESTNET"
  console.log("Network URL:", details.networkUrl); // e.g., "https://horizon-testnet.stellar.org"
  console.log("Network Passphrase:", details.networkPassphrase); // e.g., "Test SDF Network ; September 2015"
  console.log("Soroban RPC URL:", details.sorobanRpcUrl); // e.g., "https://soroban-testnet.stellar.org"
};


Use this method when you need detailed network configuration information, particularly when working with Soroban smart contracts or when the specific network endpoints are required.

signTransaction
signTransaction(xdr: string, opts?: { network?: string, networkPassphrase?: string, address?: string }) -> <Promise<{ signedTxXdr: string; signerAddress: string; } & { error?: string; }>>
This function accepts a transaction XDR string as the first parameter, which it will decode, sign as the user, and then return the signed transaction to your application.

The user will need to provide their password if the extension does not currently have their private key. Once the user has provided their password, the extension will have access to the user private key for 5 minutes. The user must then review the transaction details and accept within those 5 minutes for the transaction to be signed.

NOTE: The user must provide a valid transaction XDR string for the extension to properly sign.

The second parameter is an optional opts object where you can specify the network you are intending the transaction to be signed on. This network name maps to the Networks enum in js-stellar-sdk. Freighter will use this network name to derive the network passphrase from js-stellar-sdk.

If the passphrase you need can't be found in js-stellar-sdk, you can simply pass a custom networkPassphrase for Freighter to use. In the event both are passed, Freighter will default to using network to derive the passphrase from js-stellar-sdk and ignore networkPassphrase.

These 2 configurations are useful in the case that the user's Freighter is configured to the wrong network. Freighter will be able to throw a blocking error message communicating that you intended this transaction to be signed on a different network.

You can also use this opts to specify which account's signature you’re requesting. If Freighter has the public key requested, it will switch to that account. If not, it will alert the user that they do not have the requested account.

signAuthEntry
signAuthEntry(authEntryXdr: string, opts: { address: string }) -> <Promise<{ signedAuthEntry: Buffer | null; signerAddress: string } & { error?: string; }>>
This function accepts an authorization entry preimage as the first parameter and it returns a signed hash of the same authorization entry, which can be added to the address credentials of the same entry. The authorizeEntry helper in stellar base is a good example of how this works.

The second parameter is an optional opts object where you can specify which account's signature you’re requesting. If Freighter has the public key requested, it will switch to that account. If not, it will alert the user that they do not have the requested account.

signMessage
signMessage(message: string, opts: { address: string }) -> <Promise<{ signedMessage: string | null; signerAddress: string; } & { error?: string; }>>
This function accepts a string as the first parameter, which it will decode, sign as the user, and return a base64 encoded string of the signed contents.

The second parameter is an optional opts object where you can specify which account's signature you’re requesting. If Freighter has the public key requested, it will switch to that account. If not, it will alert the user that they do not have the requested account.

import {
  isConnected,
  getPublicKey,
  signTransaction,
  signBlob,
} from "@stellar/freighter-api";

const isAppConnected = await isConnected();

if (isAppConnected.isConnected) {
  alert("User has Freighter!");
}

const retrievePublicKey = async () => {
  const accessObj = await requestAccess();

  if (accessObj.error) {
    throw new Error(accessObj.error.message);
  } else {
    return accessObj.address;
  }
};

const retrievedPublicKey = retrievePublicKey();

const userSignTransaction = async (
  xdr: string,
  network: string,
  signWith: string
) => {
  const signedTransactionRes = await signTransaction(xdr, {
    network,
    address: signWith,
  });

  if (signedTransactionRes.error) {
    throw new Error(signedTransactionRes.error.message);
  } else {
    return signedTransactionRes.signedTxXdr;
  }
};

const xdr = ""; // replace this with an xdr string of the transaction you want to sign
const userSignedTransaction = userSignTransaction(xdr, "TESTNET");

freighter-api will return a signed transaction xdr. Below is an example of how you might submit this signed transaction to Horizon using stellar-sdk (https://github.com/stellar/js-stellar-sdk):

import { Server, TransactionBuilder } from "stellar-sdk";

const userSignTransaction = async (
  xdr: string,
  network: string,
  signWith: string
) => {
  const signedTransactionRes = await signTransaction(xdr, {
    network,
    address: signWith,
  });

  if (signedTransactionRes.error) {
    throw new Error(signedTransactionRes.error.message);
  } else {
    return signedTransactionRes.signedTxXdr;
  }
};

const xdr = ""; // replace this with an xdr string of the transaction you want to sign

const userSignedTransaction = userSignTransaction(xdr, "TESTNET");

const SERVER_URL = "https://horizon-testnet.stellar.org";

const server = new Server(SERVER_URL);

const transactionToSubmit = TransactionBuilder.fromXDR(
  userSignedTransaction,
  SERVER_URL
);

const response = await server.submitTransaction(transactionToSubmit);

addToken
addToken({ contractId: string, networkPassphrase?: string }) -> <Promise<{ contractId: string } & { error?: string; }>>
This function allows you to trigger an "add token" workflow to add a Soroban token to the user's Freighter wallet. It takes a contract ID as a required parameter and an optional network passphrase. If the network passphrase is omitted, it defaults to Pubnet's passphrase.

When called, Freighter will load the token details (symbol, name, decimals, and balance) from the contract and display them in a modal popup for user review. The user can then verify the token's legitimacy and approve adding it to their wallet. After approval, Freighter will track the token's balance and display it alongside other account balances.

import { isConnected, addToken } from "@stellar/freighter-api";

const addSorobanToken = async () => {
  if (!(await isConnected())) {
    return;
  }

  const result = await addToken({
    contractId: "CC...ABCD", // The Soroban token contract ID
    networkPassphrase: "Test SDF Network ; September 2015", // Optional, defaults to Pubnet
  });

  if (result.error) {
    console.error(result.error);
    return;
  }

  console.log(
    `Successfully added token with contract ID: ${result.contractId}`
  );
};

The function returns a Promise that resolves to an object containing either:

The contract ID of the added token on success
An error message if the request fails or the user rejects it
WatchWalletChanges
WatchWalletChanges -> new WatchWalletChanges(timeout?: number)
The class WatchWalletChanges provides methods to watch changes from Freighter. To use this class, first instantiate with an optional timeout param to determine how often you want to check for changes in the wallet. The default is 3000 ms.

WatchWalletChanges.watch(callback: ({ address: string; network: string; networkPassphrase; string }) => void)
The watch() method starts polling the extension for updates. By passing a callback into the method, you can access Freighter's address, network, and networkPassphrase. This method will only emit results when something has changed.

WatchWalletChanges.stop()
The stop() method will stop polling Freighter for changes:

import { WatchWalletChanges } from "@stellar/freighter-api";

const Watcher = new WatchWalletChanges(1000);

Watcher.watch((watcherResults) => {
  document.querySelector("#address").innerHTML = watcherResults.address;
  document.querySelector("#network").innerHTML = watcherResults.network;
  document.querySelector("#networkPassphrase").innerHTML =
    watcherResults.networkPassphrase;
});

setTimeout(() => {
  // after 30 seconds, stop watching
  Watcher.stop();
}, 30000);

## Developing A Wallet For Soroban


Freighter offers first-class support for Soroban, but developing a wallet that supports a new smart contract platform came with many learnings. Below you will find some tips for developing a wallet that takes advantage of the full capabilities of Soroban.

Common Scenarios
When interacting with a Soroban smart contract from a wallet, you will need to be able to encode human readable values into smart contract (SC) values and vice-versa.

For example, consider the common use-case of sending a token payment. You would likely need to take in some values that a user configures in form fields and convert those into SC values to generate an XDR to simulate.

Another common use-case is signing arbitrary XDR's sent from a dapp. In this scenario, you'll want to dig into the invocations being called by a Soroban XDR and show them to the user in a way that they can understand what they're signing.

We'll go through each of these scenarios below.

Encoding SC Values
In Freighter, we do this by utilizing helper methods in @stellar/stellar-sdk.

The below example is an abridged version of what Freighter does under the hood when it initiates a token transfer. It is designed for a token transfer invocation, but this approach would work for any smart contract invocation.


import {
  Address,
  Contract,
  TransactionBuilder,
  Memo,
  SorobanRpc,
  TransactionBuilder,
  XdrLargeInt,
} from "stellar-sdk";

/* For this example, we are assuming the token adheres to the interface documented in SEP-0041 */
const generateTransferXdr =
  (contractId, serverUrl, publicKey, destination, amount, fee, networkPassphrase, memo) => {
    // the contract id of the token
    const contract = new Contract(contractId);

    const server = new SorobanRpc.Server(serverUrl);
    const sourceAccount = await server.getAccount(publicKey);
    const builder = new TransactionBuilder(sourceAccount, {
      fee,
      networkPassphrase,
    });

    // these values would be entered by the user
    // we will use some helper methods to convert the addresses and the amount into SC vals
    const transferParams = [
      new Address(publicKey).toScVal(), // from
      new Address(destination).toScVal(), // to
      new XdrLargeInt("i128", amount).toI128(), // amount
    ];

    // call the `transfer` method with the listed params
    const transaction = builder
      .addOperation(contract.call("transfer", ...transferParams))
      .setTimeout(180);

    if (memo) {
      transaction.addMemo(Memo.text(memo));
    }

    transaction.build();

    // simulate the transaction
    const simulationTransaction = await server.simulateTransaction(
      transaction,
    );

    // and now assemble the transaction before signing
    const preparedTransaction = SorobanRpc.assembleTransaction(
      transaction,
      simulationTransaction,
    )
      .build()
      .toXDR();

    return {
      simulationTransaction,
      preparedTransaction,
    };
}

Walking the invocation tree and parsing SC Values
If you have an XDR of a transaction containing an invocation, you may want to show the contents to the user. We'll walk the whole invocation tree to show the user all the invocations they are authorizing by signing. This is important as invocations can contain subinvocations that the user may not expect. This is an abridged version of what Freighter does when signing an XDR from a dapp.

const walkAndParse = (transactionXdr, networkPassphrase) => {
  const transaction = TransactionBuilder.fromXDR(
    transactionXdr,
    networkPassphrase
  );

  // for this simple example, let's just grab the first operation's first auth entry
  const op = transaction.operations[0];
  const firstAuthEntry = op.auth[0];

  const rootInvocation = firstAuthEntry.rootInvocation();

  /* This is a generic example of how to grab the function name, contract id, and the parameters of the
  invocation. This is useful for showing a user some details about the function that is actually going to 
  be called by the smart contract */
  const getInvocationArgs = (invocation) => {
    const fn = invocation.function();
    const _invocation = fn.contractFn();
    const contractId = StrKey.encodeContract(
      _invocation.contractAddress().contractId()
    );

    const fnName = _invocation.functionName().toString();
    const args = _invocation.args();

    return { fnName, contractId, args };
  };

  const invocations = [];

  /* We'll recursively walk the invocation tree to get all of the sub-invocations and pull out the 
  function name, contractId, and args, as shown above */

  walkInvocationTree(rootInvocation, (inv) => {
    const args = getInvocationArgs(inv);
    if (args) {
      invocations.push(args);
    }

    return null;
  });

  /* We now have some each information about the root invocation and its subinvocations, 
  but all the data is in SC val format, so it is still unreadable for users */

  // For simplicity, let's just grab the first invocation and show how to parse it
  const firstInvocation = invocations[0];
  const firstInvocationArgs = firstInvocation.args;

  /* Generally, we can just use `scValToNative` to decode a SC val into a usable JS data type
  but this may not work for all SC vals.
  For more information check the function scValByType in extension/src/popup/helpers/soroban.ts */
  const humanReadableArgs = firstInvocationArgs.map((a) => scValToNative(a));

  return humanReadableArgs;
};

## Integrate Freighter with a React dapp
Wallets are an essential part of any dapp. They allow users to interact with the blockchain and sign transactions. In this section, you'll learn how to integrate the Freighter wallet into your React dapps.

WalletData Component
In the example crowdfund dapp, the WalletData component plays a key role in wallet integration. Let's break down the code and understand its functionality:

/components/moleculres/wallet-data/index.tsx
import React from "react";
import { useAccount, useIsMounted } from "../../../hooks";
import { ConnectButton } from "../../atoms";
import styles from "./style.module.css";

export function WalletData() {
  const mounted = useIsMounted();
  const account = useAccount();

  return (
    <>
      {mounted && account ? (
        <div className={styles.displayData}>
          <div className={styles.card}>{account.displayName}</div>
        </div>
      ) : (
        <ConnectButton label="Connect Wallet" />
      )}
    </>
  );
}

Here's a breakdown of the code:

The mounted variable is obtained using the useIsMounted hook, indicating whether the component is currently mounted or not.
The useAccount hook is used to fetch the user's account data, and the data property is destructured from the result.
Conditional rendering is used to display different content based on the component's mount status and the availability of account data.
If the component is mounted and the account data is available, the user's wallet data is displayed. This includes the account's display name.
If the component is not mounted or the account data is not available, a ConnectButton component is rendered, allowing the user to connect with Freighter.


## # Freighter Integration Guide (for Soroban Example Dapp)

This document explains how this project integrates the Freighter wallet and how to reproduce the same workflow in your own app. It includes practical, copy‑pasteable examples, Next.js/React caveats, and Soroban signing notes.

The code here references and builds on the actual usage in this repo:

- Connect button uses `setAllowed` (components/atoms/connect-button/index.tsx:2, components/atoms/connect-button/index.tsx:15)
- Account hook uses `isConnected` and `getUserInfo` (hooks/useAccount.ts:2, hooks/useAccount.ts:7)
- Dependency: `@stellar/freighter-api` (package.json:21)


## Prerequisites

- Install the Freighter browser extension (Chrome/Firefox) and enable Experimental Mode.
- Select the correct network in Freighter:
  - Futurenet: `Test SDF Future Network ; October 2022`
  - Standalone (local): `Standalone Network ; February 2017`
- Fund the selected account on that network (friendbot or faucet as applicable).


## Install Dependencies

```bash
npm install @stellar/freighter-api soroban-client
```

This project pins Freighter API in `package.json` and uses `soroban-client@1.0.0-beta.2`.


## Detecting Freighter and Site Permission

Freighter’s permission model is opt‑in per site. Users must approve your domain. Two high‑level checks:

```ts
import {
  isConnected,
  // isAllowed,     // optional older check pattern
  // isFreighter,   // optional: detect extension availability
} from '@stellar/freighter-api'

// Returns true if Freighter is installed AND the site is connected
const connected = await isConnected()
```

Prompt the user to approve your site (same button this repo uses):

```ts
import { setAllowed } from '@stellar/freighter-api'

// Call inside a click handler; Freighter will show a permission prompt.
await setAllowed()
```

In this repo, the connect button wires `onClick={setAllowed}` directly:

- `components/atoms/connect-button/index.tsx:15`


## Getting the User’s Public Key

There are two common approaches; this repo uses `getUserInfo()`:

```ts
import { getUserInfo } from '@stellar/freighter-api'

const user = await getUserInfo()
// user.publicKey contains the Stellar address (G...) if connected
```

You can also call `getPublicKey()` directly if you only need the address:

```ts
import { getPublicKey } from '@stellar/freighter-api'

const publicKey = await getPublicKey()
```

Project hook pattern used here (memoized + render‑friendly):

- `hooks/useAccount.ts` fetches once via `isConnected()` then `getUserInfo()` and exposes a stable `{ address, displayName }` object. This avoids unnecessary rerenders while keeping code simple for pages/components.


## Next.js / React Gotchas (SSR)

- Do not call Freighter APIs during server‑side render. They rely on `window` and the browser extension. Use `useEffect` or event handlers.
- If you need to conditionally render “Connect” UI, gate it by client‑side state set in `useEffect` after checking `isConnected()`.
- Example pattern:

```tsx
import { useEffect, useState } from 'react'
import { isConnected, getUserInfo, setAllowed } from '@stellar/freighter-api'

export function ConnectOrAddress() {
  const [user, setUser] = useState<{ publicKey: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        if (await isConnected()) {
          const u = await getUserInfo()
          if (u) setUser(u)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <button disabled>Loading…</button>
  if (!user) return <button onClick={() => setAllowed()}>Connect Freighter</button>
  return <span>{user.publicKey.slice(0, 4)}…{user.publicKey.slice(-4)}</span>
}
```


## Reading and Verifying the Network

Use `getNetwork()` to read what the user selected in Freighter, and validate it against what your app expects.

```ts
import { getNetwork } from '@stellar/freighter-api'

const net = await getNetwork()
// Example shape: { network: 'FUTURENET', networkPassphrase: 'Test SDF Future Network ; October 2022', ... }

const EXPECT = 'Test SDF Future Network ; October 2022' // or 'Standalone Network ; February 2017'
if (net.networkPassphrase !== EXPECT) {
  throw new Error('Please switch Freighter to the expected network')
}
```

Note: Some networks (e.g., a local RPC) require adding a custom network in Freighter settings (documented in this repo’s README). You typically cannot force‑switch the user programmatically; guide them to change it in Freighter.


## Signing a Transaction with Freighter (Soroban)

Typical Soroban flow (client‑side):

1) Build/prepare the transaction using `soroban-client` and your RPC endpoint
2) Ask Freighter to sign the transaction XDR
3) Submit to the RPC server

Minimal example:

```ts
import * as SorobanClient from 'soroban-client'
import { getPublicKey, getNetwork, signTransaction } from '@stellar/freighter-api'

async function buildAndSignExample() {
  // 1) Ensure account + network
  const publicKey = await getPublicKey()
  const { networkPassphrase } = await getNetwork()

  // 2) Prepare a transaction (example: simple account bump; replace with your contract call)
  const rpc = new SorobanClient.SorobanRpc.Server('http://localhost:8000/soroban/rpc')
  const source = await rpc.getAccount(publicKey)

  const tx = new SorobanClient.TransactionBuilder(source, {
    fee: '100000',
    networkPassphrase,
  })
    // Add your operation(s) here; for Soroban contract calls use invokeHostFunction helpers
    .setTimeout(30)
    .build()

  // 3) Let Freighter sign the transaction
  const signedXdr = await signTransaction(tx.toXDR(), { networkPassphrase })

  // 4) Submit the signed XDR to the network
  const signed = SorobanClient.TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
  const res = await rpc.sendTransaction(signed)
  return res
}
```

Notes:

- Always pass the exact `networkPassphrase` Freighter is on when signing.
- On Soroban, many contract calls require “simulation/prepare” before final submit. Integrate your prepare flow before the `signTransaction` step as usual.
- If the user rejects in Freighter, `signTransaction` will throw; handle it gracefully.


## Message and Auth Signing

Freighter can also sign arbitrary blobs and Soroban auth entries:

```ts
import { signBlob, signAuthEntry } from '@stellar/freighter-api'

const blobSignature = await signBlob({
  address: await getPublicKey(),
  blob: Buffer.from('hello world').toString('base64'),
})

// For Soroban auth entries (advanced; tailor to your auth payload)
const authSig = await signAuthEntry({
  entryXDR: '<AUTH_ENTRY_XDR>',
  networkPassphrase: (await getNetwork()).networkPassphrase,
})
```


## Putting It Together: A Reusable Hook

This project’s hook caches the Freighter lookup and returns a stable object for UI rendering. You can reuse or adapt it:

```ts
// hooks/useAccount.ts (excerpt)
// See hooks/useAccount.ts:2 and hooks/useAccount.ts:7 in this repo
import { useEffect, useState } from 'react'
import { isConnected, getUserInfo } from '@stellar/freighter-api'

let address: string
let addressLookup = (async () => {
  if (await isConnected()) return getUserInfo()
})()

const addressObject = { address: '', displayName: '' }
const addressToHistoricObject = (addr: string) => {
  addressObject.address = addr
  addressObject.displayName = `${addr.slice(0, 4)}...${addr.slice(-4)}`
  return addressObject
}

export function useAccount(): typeof addressObject | null {
  const [, setLoading] = useState(address === undefined)
  useEffect(() => {
    if (address !== undefined) return
    addressLookup
      .then(user => { if (user) address = user.publicKey })
      .finally(() => setLoading(false))
  }, [])
  if (address) return addressToHistoricObject(address)
  return null
}
```


## Connect Button: Minimal and Safe

This project exposes a small button that just triggers Freighter’s site permission:

```tsx
// components/atoms/connect-button/index.tsx (excerpt)
// See components/atoms/connect-button/index.tsx:15 in this repo
import { setAllowed } from '@stellar/freighter-api'

export function ConnectButton({ label }: { label: string }) {
  return (
    <button onClick={setAllowed}>{label}</button>
  )
}
``;

You can enhance it by disabling while pending and surfacing errors:

```tsx
function ConnectButtonImproved() {
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)
  const onClick = async () => {
    setBusy(true)
    setErr(null)
    try {
      await setAllowed()
    } catch (e: any) {
      setErr(e?.message ?? 'User rejected or Freighter not available')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <button disabled={busy} onClick={onClick}>
        {busy ? 'Connecting…' : 'Connect Freighter'}
      </button>
      {err && <div role="alert">{err}</div>}
    </div>
  )
}
```


## Common Pitfalls and Fixes

- Extension not installed: `isConnected()` will be false. UI should show “Install Freighter” with a link.
- Site not allowed: Call `setAllowed()` from a user gesture (button click). Browsers block popups outside user gestures.
- Wrong network: Compare `getNetwork().networkPassphrase` with the backend you target. Show a clear instruction to switch.
- Unfunded account: Backend queries or contract calls may fail. Provide a “Fund account” helper or link to friendbot.
- SSR issues: Only call Freighter in the browser (use `useEffect` or events). Guard any `window` usage.
- TypeScript typings: `@stellar/freighter-api` ships types; ensure your `tsconfig` includes DOM libs.


## Debugging Tips

- Check availability quickly in DevTools:

```js
await import('@stellar/freighter-api').then(m => m.isConnected())
```

- Inspect the detected network:

```js
await import('@stellar/freighter-api').then(m => m.getNetwork())
```

- Verify the public key:

```js
await import('@stellar/freighter-api').then(m => m.getPublicKey())
```


## Minimal Integration Checklist

- Add `@stellar/freighter-api` to your project.
- Show a “Connect Freighter” button wired to `setAllowed()`.
- After connect, call `getUserInfo()` or `getPublicKey()` and store the address.
- Validate `getNetwork().networkPassphrase` matches your expected backend.
- Build Soroban transactions, sign with `signTransaction(xdr, { networkPassphrase })`, and submit to your RPC.


## References to This Repo

- `components/atoms/connect-button/index.tsx:15` — connect on click via `setAllowed`
- `hooks/useAccount.ts:2` — import of `isConnected` and `getUserInfo`
- `hooks/useAccount.ts:7` — initial connection check and lookup
- `package.json:21` — dependency on `@stellar/freighter-api`


---

If you want, you can copy these snippets into your other project directly. If your setup differs (e.g., Vite, CRA, non‑Next.js), the same browser‑only rule applies: call Freighter APIs from event handlers or inside `useEffect` on the client.

