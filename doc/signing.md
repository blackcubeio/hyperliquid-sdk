# Signing

Hyperliquid runs on an EVM chain, so requests are signed with **secp256k1 / EIP-712**. There are
two distinct schemes, both implemented in `src/rest/signing.ts` (validated byte-for-byte against
the official Python SDK and the `nktkas` TS SDK vectors). Signing is **internal** : la classe
`Hyperliquid` signe pour toi, tu ne manipules jamais ces primitives directement.

## L1 actions (orders, cancels, modify, leverage…)

1. `msgpack(action)` — key order matters; the SDK builds the wire action with the exact field order.
2. append `nonce` (uint64 BE) + `vaultAddress` marker (`0x00`, or `0x01` + 20 bytes) + optional `expiresAfter`.
3. `keccak256` of the whole → `connectionId`.
4. EIP-712 sign with domain `Exchange` (**chainId 1337**), type `Agent { source, connectionId }`,
   `source = 'a'` (mainnet) / `'b'` (testnet).
5. signature `{ r, s, v }`.

## User-signed actions (transfers, withdraw, approve agent…)

Standard EIP-712 typed data: domain `HyperliquidSignTransaction`, `chainId` from the action's
`signatureChainId` (`0x66eee`), `hyperliquidChain` = `Mainnet`/`Testnet`. Each action carries its
own types. Exposées via les scopes `dex.transfers(...)` / `dex.native.agents(...)`.

## Signers, labels & networks

Tu passes les signers au **constructeur** `new Hyperliquid(signers, { default })` — un par
**label**. Chaque signer est autonome et **porte son propre réseau** : c'est ce qui permet à
mainnet et testnet de coexister dans le même process (plus de singleton global).

```ts
interface Signer {
  privateKey: `0x${string}`;       // API/agent wallet key used to sign
  publicKey: `0x${string}`;        // the account address (used for reads & as L1 source)
  network: 'mainnet' | 'testnet';  // the chain this signer acts on
  vaultAddress?: `0x${string}`;    // vault / sub-account included in L1 actions
}

const dex = new Hyperliquid(
  {
    trader: { privateKey: TRADER_KEY, publicKey: '0x1171…', network: 'mainnet' },
    tester: { privateKey: TESTER_KEY, publicKey: '0xabcd…', network: 'testnet' },
  },
  { default: 'trader' },
);

await dex.perp('tester').place(params);  // le label choisit le compte ET le réseau
await dex.perp().getCandles(query);            // lecture publique, signer par défaut
```

Règles lecture / écriture, internes à la façade :

- **Lectures** (marché, `getCandles`, subscriptions…) — pas de signer requis ; sans label →
  **mainnet**, un label → le réseau de ce signer.
- **Écritures** (`placeOrder`, `withdraw`, `updateLeverage`…) — un signer (label, ou défaut) est
  **obligatoire** ; il fixe le wallet **et** le réseau (`source` L1 `a`/`b`, `hyperliquidChain`).

> **API / agent wallets.** A master account can approve API wallets (`dex.native.agents().approve`) to
> sign on its behalf. The API wallet only **signs** — to read account data you must pass the
> **master/sub address** as `publicKey` (querying the agent address returns empty).

## Primitives internes

Toutes dans `src/rest/signing.ts`, utilisées par la façade :

| Fonction | Rôle |
|---|---|
| `createL1ActionHash({ action, nonce, vaultAddress?, expiresAfter? })` | keccak256 hash d'une action L1 |
| `signL1Action({ privateKey, action, nonce, isTestnet?, vaultAddress?, expiresAfter? })` | signe une action L1 → `{ r, s, v }` |
| `signUserSignedAction({ privateKey, action, types })` | signe une action user-signed (EIP-712 typée) |
| `privateKeyToAddress(privateKey)` | dérive l'adresse EVM depuis une clé privée |
| `keyTypeOf(privateKey)` / `toChecksumAddress(address)` | helpers exposés via `dex.helpers()` |

Dependencies: `@noble/curves` (secp256k1), `@noble/hashes` (keccak256), `@msgpack/msgpack`. No `viem`/`ethers`.
