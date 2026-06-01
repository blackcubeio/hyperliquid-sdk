# Signatures

Hyperliquid tourne sur une chaîne EVM : les requêtes sont donc signées en **secp256k1 / EIP-712**.
Il existe deux schémas distincts, tous deux implémentés dans `src/rest/signing.ts` (validés octet par
octet contre le SDK Python officiel et les vecteurs du SDK TS `nktkas`). La signature est **interne** :
la classe `Hyperliquid` signe pour toi, tu ne manipules jamais ces primitives directement.

## Actions L1 (ordres, annulations, modifications, levier…)

1. `msgpack(action)` — l'ordre des clés compte ; le SDK construit l'action sur le fil avec l'ordre
   de champs exact.
2. ajout du `nonce` (uint64 BE) + marqueur `vaultAddress` (`0x00`, ou `0x01` + 20 octets) +
   `expiresAfter` optionnel.
3. `keccak256` de l'ensemble → `connectionId`.
4. signature EIP-712 avec le domaine `Exchange` (**chainId 1337**), le type `Agent { source, connectionId }`,
   `source = 'a'` (mainnet) / `'b'` (testnet).
5. signature `{ r, s, v }`.

## Actions user-signed (transferts, retrait, autorisation d'agent…)

Données typées EIP-712 standard : domaine `HyperliquidSignTransaction`, `chainId` issu du
`signatureChainId` de l'action (`0x66eee`), `hyperliquidChain` = `Mainnet`/`Testnet`. Chaque action
porte ses propres types. Exposées via les scopes `dex.transfers(...)` / `dex.native.agents(...)`.

## Signers, labels et réseaux

Tu passes les signers au **constructeur** `new Hyperliquid(signers, { default })` — un par **label**.
Chaque signer est autonome et **porte son propre réseau** : c'est ce qui permet à mainnet et testnet de
coexister dans le même process (plus de singleton global).

```ts
interface Signer {
  privateKey: `0x${string}`;       // clé du wallet API/agent utilisée pour signer
  publicKey: `0x${string}`;        // l'adresse du compte (lectures & source L1)
  network: 'mainnet' | 'testnet';  // la chaîne sur laquelle agit ce signer
  vaultAddress?: `0x${string}`;    // vault / sous-compte inclus dans les actions L1
}

const dex = new Hyperliquid(
  {
    trader: { privateKey: TRADER_KEY, publicKey: '0x1171…', network: 'mainnet' },
    tester: { privateKey: TESTER_KEY, publicKey: '0xabcd…', network: 'testnet' },
  },
  { default: 'trader' },
);

await dex.perp('tester').place(params);  // le label choisit le compte ET le réseau
await dex.perp().getCandles(query);      // lecture publique, signer par défaut
```

Règles lecture / écriture, internes à la façade :

- **Lectures** (marché, `getCandles`, souscriptions…) — pas de signer requis ; sans label →
  **mainnet**, un label → le réseau de ce signer.
- **Écritures** (`place`, `withdraw`, `updateLeverage`…) — un signer (label, ou défaut) est
  **obligatoire** ; il fixe le wallet **et** le réseau (`source` L1 `a`/`b`, `hyperliquidChain`).

> **Wallets API / agents.** Un compte master peut autoriser des wallets API (`dex.native.agents().approve`)
> à signer en son nom. Le wallet API ne fait que **signer** — pour lire les données de compte, tu dois
> passer l'adresse **master/sous-compte** comme `publicKey` (interroger l'adresse de l'agent renvoie vide).

## Primitives internes

Toutes dans `src/rest/signing.ts`, utilisées par la façade :

| Fonction | Rôle |
|---|---|
| `createL1ActionHash({ action, nonce, vaultAddress?, expiresAfter? })` | hash keccak256 d'une action L1 |
| `signL1Action({ privateKey, action, nonce, isTestnet?, vaultAddress?, expiresAfter? })` | signe une action L1 → `{ r, s, v }` |
| `signUserSignedAction({ privateKey, action, types })` | signe une action user-signed (EIP-712 typée) |
| `privateKeyToAddress(privateKey)` | dérive l'adresse EVM depuis une clé privée |
| `keyTypeOf(privateKey)` / `toChecksumAddress(address)` | helpers exposés via `dex.helpers()` |

Dépendances : `@noble/curves` (secp256k1), `@noble/hashes` (keccak256), `@msgpack/msgpack`.
Pas de `viem`/`ethers`.
