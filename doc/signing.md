# Signing

Hyperliquid runs on an EVM chain, so requests are signed with **secp256k1 / EIP-712**. There are
two distinct schemes, both implemented in `src/rest/signing.ts` (validated byte-for-byte against
the official Python SDK and the `nktkas` TS SDK vectors).

## L1 actions (orders, cancels, modify, leverage…)

1. `msgpack(action)` — key order matters; the SDK builds the wire action with the exact field order.
2. append `nonce` (uint64 BE) + `vaultAddress` marker (`0x00`, or `0x01` + 20 bytes) + optional `expiresAfter`.
3. `keccak256` of the whole → `connectionId`.
4. EIP-712 sign with domain `Exchange` (**chainId 1337**), type `Agent { source, connectionId }`,
   `source = 'a'` (mainnet) / `'b'` (testnet).
5. signature `{ r, s, v }`.

```ts
import { createL1ActionHash, signL1Action } from '@blackcube/hyperliquid-sdk';

const action = { type: 'cancel', cancels: [{ a: 0, o: 12345 }] };
const hash = createL1ActionHash({ action, nonce: Date.now() });
const sig = signL1Action({ privateKey, action, nonce: Date.now(), isTestnet: true });
```

## User-signed actions (transfers, withdraw, approve agent…)

Standard EIP-712 typed data: domain `HyperliquidSignTransaction`, `chainId` from the action's
`signatureChainId` (`0x66eee`), `hyperliquidChain` = `Mainnet`/`Testnet`. Each action carries its
own types.

```ts
import { signUserSignedAction, USD_SEND_TYPES } from '@blackcube/hyperliquid-sdk';

const sig = signUserSignedAction({ privateKey, action, types: USD_SEND_TYPES });
```

## Signer registry, labels & networks

Signers are registered **per label** in `init({ signers })`. A signer is self-contained and
**carries its own network** — that's what lets mainnet and testnet coexist in one process:

```ts
interface Signer {
  privateKey: `0x${string}`;       // API/agent wallet key used to sign
  publicKey: `0x${string}`;        // the account address (used for reads & as L1 source)
  network: 'mainnet' | 'testnet';  // the chain this signer acts on
  vaultAddress?: `0x${string}`;    // vault / sub-account included in L1 actions
}

init({
  signers: {
    trader: { privateKey: TRADER_KEY, publicKey: '0x1171…', network: 'mainnet' },
    tester: { privateKey: TESTER_KEY, publicKey: '0xabcd…', network: 'testnet' },
  },
});

createLimitOrder(params, 'tester');   // 2nd arg = the label; network comes from the signer
```

Two resolvers back the read/write rules:

- `resolveSigner(label)` — for **writes**. The label is **mandatory**: a missing label throws
  `Un signer (label) est obligatoire pour cette action signée`, an unknown one throws
  `Aucun signer enregistré sous "…"`. It returns the key, the public address, the network and the
  optional vault — the network drives the L1 `source` (`a`/`b`) and the wire `hyperliquidChain`.
- `resolveReadNetwork(label?)` — for **reads**. The label is **optional**: no label → `mainnet`,
  a label → that signer's network; an unknown label still throws.

> **API / agent wallets.** A master account can approve API wallets (`approveAgent`) to sign on its
> behalf. The API wallet only **signs** — to read account data you must pass the **master/sub
> address** (querying the agent address returns empty). Each signer's `privateKey` may be the
> master key or an approved agent key.

## Primitives

| Function | Purpose |
|---|---|
| `createL1ActionHash({ action, nonce, vaultAddress?, expiresAfter? })` | keccak256 hash of an L1 action |
| `signL1Action({ privateKey, action, nonce, isTestnet?, vaultAddress?, expiresAfter? })` | sign an L1 action → `{ r, s, v }` |
| `signUserSignedAction({ privateKey, action, types })` | sign a user-signed (EIP-712 typed) action |
| `privateKeyToAddress(privateKey)` | derive the EVM address from a private key |

Dependencies: `@noble/curves` (secp256k1), `@noble/hashes` (keccak256), `@msgpack/msgpack`. No `viem`/`ethers`.
