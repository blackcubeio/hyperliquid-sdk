# @blackcube/hyperliquid-sdk

[![npm](https://img.shields.io/npm/v/@blackcube/hyperliquid-sdk.svg)](https://www.npmjs.com/package/@blackcube/hyperliquid-sdk)
[![license](https://img.shields.io/npm/l/@blackcube/hyperliquid-sdk.svg)](./LICENSE)

TypeScript SDK for the [Hyperliquid](https://hyperliquid.xyz) exchange — a high-performance
perpetuals & spot DEX on its own L1. Full coverage of the REST `info` / `exchange` endpoints,
the WebSocket API, and EIP-712 request signing.

> **Unofficial / community SDK.** Not affiliated with or endorsed by Hyperliquid. "Hyperliquid"
> is a trademark of its respective owner. Use at your own risk.

## Features

- ✅ **REST `info`** — mids, meta, order book, clearinghouse state, open orders, fills, candles, funding, spot meta…
- ✅ **REST `exchange`** — orders (limit/market/modify/cancel/cancel-by-cloid/batch), leverage, isolated margin, scheduled cancel
- ✅ **User-signed actions** — `usdSend`, `spotSend`, `withdraw`, `usdClassTransfer`, `approveAgent`
- ✅ **WebSocket** — typed subscriptions and signed trading actions over `post`
- ✅ **Signing** — EIP-712 + msgpack (L1 actions) and EIP-712 typed data (user-signed), secp256k1, API/agent wallets
- ✅ Typed end-to-end, ESM + CJS + `.d.ts`, Node.js and browser-safe (crypto via [`@noble`](https://paulmillr.com/noble/))
- ✅ Mainnet & testnet out of the box

## Install

```bash
npm install @blackcube/hyperliquid-sdk
# or
pnpm add @blackcube/hyperliquid-sdk
```

Requires Node.js ≥ 22 (for the built-in WebSocket used by `WsClient`; or inject one). Browsers work as-is.

## Quick start

```ts
import {
  init,
  getAllMids,
  getMeta,
  createLimitOrder,
  cancelOrdersByCloid,
  assetIndex,
  WsClient,
} from '@blackcube/hyperliquid-sdk';

// Initialise once — the whole API inherits this config.
// Register one signer per account address; reference an account on signed calls.
init({
  network: 'testnet',
  signers: { [process.env.EVM_PUBLIC_KEY]: { privateKey: process.env.EVM_PRIVATE_KEY } },
});

// Public read
const mids = await getAllMids();

// Signed write — `account` is optional when a single signer is registered
const meta = await getMeta();
const asset = assetIndex(meta.universe, 'BTC'); // perp asset ID = index in meta.universe
const result = await createLimitOrder({ asset, isBuy: true, price: 30000, size: 0.001, tif: 'Alo' });

// WebSocket: stream + signed actions
const ws = new WsClient();
await ws.connect();
ws.subscribeAllMids((data) => console.log(data));
await ws.createLimitOrder({ asset, isBuy: true, price: 30000, size: 0.001, tif: 'Alo' });
```

## Configuration

`init(options)` sets a single global config; every call inherits it.

| Option | Type | Default |
|---|---|---|
| `network` | `'mainnet' \| 'testnet'` | `'mainnet'` |
| `restUrl` / `wsUrl` | `string` | per `network` |
| `fetch` | `FetchLike` | `globalThis.fetch` |
| `webSocket` | `WebSocketFactory` | `globalThis.WebSocket` |
| `signers` | `Record<account, Signer>` | — (required for signed writes) |

Signed writes reference a registered account: register signers keyed by account address in
`init({ signers })` (`Signer = { privateKey, vaultAddress? }`), then pass the `account` per call
(optional when a single account is registered). Multi-account ready. See [doc/signing](./doc/signing.md).

## API documentation

Organised like the [Hyperliquid API docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api):

- **REST** — [Info (reads)](./doc/rest-api/info.md) · [Exchange (signed actions)](./doc/rest-api/exchange.md)
- **WebSocket** — [Subscriptions & trading](./doc/websocket.md)
- **Signing** — [EIP-712 / msgpack signing](./doc/signing.md)

Full index: [`doc/`](./doc/README.md).

## Conventions

- Public API in **camelCase**; the `exchange` wire uses Hyperliquid's short keys (`a`/`b`/`p`/`s`/`r`/`t`/`c`) internally.
- Amounts and prices are **decimal strings** on the wire (`floatToWire` formats numbers for you).
- Asset IDs are integers: perps = index in `meta.universe`, spot = `10000 + index` (see `assetIndex`).
- Errors throw `HyperliquidApiError` (`status`, `message`).

## Development

```bash
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm lint        # biome
pnpm test        # vitest (real integration tests against mainnet reads + testnet writes)
pnpm build       # tsup → dist (ESM + CJS + d.ts)
```

> Tests are **real integration tests** (no mocks): public reads/WebSocket hit mainnet, and the
> write lifecycle hits testnet. Signed tests require `EVM_PUBLIC_KEY` / `EVM_PRIVATE_KEY` in `.env`
> and run sequentially.

## License

[BSD-3-Clause](./LICENSE) © Blackcube
