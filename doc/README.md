# @blackcube/hyperliquid-sdk — Documentation

TypeScript SDK for the [Hyperliquid](https://hyperliquid.xyz) exchange (perpetuals & spot DEX).
Organised like the [Hyperliquid API docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api).

## Contents

### REST
- [Info](./rest-api/info.md) — reads (public `POST /info`): mids, meta, book, account state, orders, fills, candles, funding
- [Exchange](./rest-api/exchange.md) — signed actions (`POST /exchange`): orders, cancels, modify, leverage, transfers, withdraw

### WebSocket
- [Subscriptions & trading](./websocket.md) — real-time streams and signed actions over `post`

### Signing
- [Signing](./signing.md) — EIP-712 + msgpack (L1) and EIP-712 typed data (user-signed), signer registry (network per signer), API/agent wallets

## Installation

```bash
pnpm add @blackcube/hyperliquid-sdk
```

Works in Node.js (≥ 22) and the browser (crypto via `@noble`).

## Initialisation

The SDK is initialised **once**; the whole API inherits the configuration.

```ts
import { init } from '@blackcube/hyperliquid-sdk';

init();                                                          // reads only, mainnet fallback
init({
  signers: {
    trader: { privateKey, publicKey, network: 'mainnet' },       // a mainnet signer
    tester: { privateKey, publicKey, network: 'testnet' },       // a testnet signer
  },
});
```

| Option | Type | Default |
|---|---|---|
| `signers` | `Record<label, Signer>` | — (required for writes) |
| `fetch` | `FetchLike` | `globalThis.fetch` |
| `webSocket` | `WebSocketFactory` | `globalThis.WebSocket` |
| `restUrls` / `wsUrls` | `Record<Network, string>` | per network |

Each `Signer` carries its own `network`, so mainnet and testnet coexist in one process. Calling the
API before `init()` throws `Hyperliquid SDK not initialized`. `resetConfig()` resets it.

## Two endpoints

Hyperliquid exposes only two REST endpoints:

- **`POST /info`** — all reads, **unsigned**. Body `{ type, … }`.
- **`POST /exchange`** — all state changes, **signed**. Body `{ action, nonce, signature, vaultAddress? }`.

The SDK wraps both: `infoRequest` for reads, `exchangeL1Action` / `userSignedRequest` for writes
(used internally by the typed functions).

## Labels, networks & read/write rules

Register one signer per **label** in `init({ signers })`; each signer carries its own `network`.
Every call takes the label as a trailing argument:

- **Reads** (`getAllMids`, `getMeta`, subscriptions…) — label is **optional**. No label → **mainnet**;
  a label → that signer's network. `getAllMids(undefined, 'tester')`.
- **Writes** (`createLimitOrder`, `usdSend`, `updateLeverage`…) — label is **mandatory** and throws if
  omitted. It selects both the wallet and the network: `createLimitOrder(params, 'tester')`.

Because the network lives on the signer, mainnet and testnet are usable at the same time.

## Asset IDs

Orders and cancels use an integer `asset`:

- **Perps** — index in the `meta.universe` response (`BTC = 0` on mainnet). Use `assetIndex(meta.universe, 'BTC')`.
- **Spot** — `10000 + index` of the pair in `spotMeta.universe`.
- **Builder-deployed perps** — `100000 + perpDexIndex * 10000 + index`.

## Conventions

- **Public API in camelCase**; the `exchange` wire uses Hyperliquid's short keys internally.
- **Amounts/prices are decimal strings** on the wire (`floatToWire` formats numbers).
- Errors throw `HyperliquidApiError` (`status`, `message`).
- Writes reference a registered signer by [label](./signing.md) (registry in `init`, label per call).
