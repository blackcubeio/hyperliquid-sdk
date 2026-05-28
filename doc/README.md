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
- [Signing](./signing.md) — EIP-712 + msgpack (L1) and EIP-712 typed data (user-signed), signer registry, API/agent wallets

## Installation

```bash
pnpm add @blackcube/hyperliquid-sdk
```

Works in Node.js (≥ 22) and the browser (crypto via `@noble`).

## Initialisation

The SDK is initialised **once**; the whole API inherits the configuration.

```ts
import { init } from '@blackcube/hyperliquid-sdk';

init();                                                               // mainnet
init({ network: 'testnet' });                                         // testnet (reads only)
init({ network: 'testnet', signers: { [account]: { privateKey } } }); // + signer registry
```

| Option | Type | Default |
|---|---|---|
| `network` | `'mainnet' \| 'testnet'` | `'mainnet'` |
| `restUrl` / `wsUrl` | `string` | per `network` |
| `fetch` | `FetchLike` | `globalThis.fetch` |
| `webSocket` | `WebSocketFactory` | `globalThis.WebSocket` |
| `signers` | `Record<account, Signer>` | — (required for writes) |

Calling the API before `init()` throws `Hyperliquid SDK not initialized`. `resetConfig()` resets it.

## Two endpoints

Hyperliquid exposes only two REST endpoints:

- **`POST /info`** — all reads, **unsigned**. Body `{ type, … }`.
- **`POST /exchange`** — all state changes, **signed**. Body `{ action, nonce, signature, vaultAddress? }`.

The SDK wraps both: `infoRequest` for reads, `exchangeL1Action` / `userSignedRequest` for writes
(used internally by the typed functions).

## Multi-account

Register one signer per account address in `init({ signers })`, then reference an account by
address on signed calls — `createLimitOrder(params, account)` — and on account subscriptions.
With a single registered account the `account` argument is optional.

## Asset IDs

Orders and cancels use an integer `asset`:

- **Perps** — index in the `meta.universe` response (`BTC = 0` on mainnet). Use `assetIndex(meta.universe, 'BTC')`.
- **Spot** — `10000 + index` of the pair in `spotMeta.universe`.
- **Builder-deployed perps** — `100000 + perpDexIndex * 10000 + index`.

## Conventions

- **Public API in camelCase**; the `exchange` wire uses Hyperliquid's short keys internally.
- **Amounts/prices are decimal strings** on the wire (`floatToWire` formats numbers).
- Errors throw `HyperliquidApiError` (`status`, `message`).
- Writes reference a registered [account](./signing.md) (registry in `init`, `account` per call).
