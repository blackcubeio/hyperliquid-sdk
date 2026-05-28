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
- ✅ **Mainnet & testnet at the same time** — the network is carried per signer, not globally

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

// Initialise once. Register one signer per label; each signer carries its own
// network, so mainnet and testnet live side by side in the same process.
init({
  signers: {
    trader: { privateKey: '0x…', publicKey: '0x…', network: 'mainnet' },
    tester: { privateKey: '0x…', publicKey: '0x…', network: 'testnet' },
  },
});

// Public read — label is OPTIONAL. No label → mainnet. A label → that signer's network.
const mids = await getAllMids();                 // mainnet
const testMids = await getAllMids(undefined, 'tester'); // testnet

// Signed write — label is MANDATORY (it picks the wallet *and* the network).
// Omitting it throws, so you can never sign on the wrong chain by accident.
const meta = await getMeta(undefined, 'tester');
const asset = assetIndex(meta.universe, 'BTC'); // perp asset ID = index in meta.universe
const result = await createLimitOrder(
  { asset, isBuy: true, price: 30000, size: 0.001, tif: 'Alo' },
  'tester',
);

// WebSocket: stream + signed actions. Pass the label at construction; reads default to mainnet.
const ws = new WsClient({ label: 'tester' });
await ws.connect();
ws.subscribeAllMids((data) => console.log(data));
await ws.createLimitOrder({ asset, isBuy: true, price: 30000, size: 0.001, tif: 'Alo' });
```

## Configuration

`init(options)` sets a single global config; every call inherits it.

| Option | Type | Default |
|---|---|---|
| `signers` | `Record<label, Signer>` | — (required for signed writes) |
| `fetch` | `FetchLike` | `globalThis.fetch` |
| `webSocket` | `WebSocketFactory` | `globalThis.WebSocket` |
| `restUrls` / `wsUrls` | `Record<Network, string>` | per network |

A `Signer` is self-contained and **carries its own network**:

```ts
type Signer = {
  privateKey: `0x${string}`;
  publicKey: `0x${string}`;
  network: 'mainnet' | 'testnet';
  vaultAddress?: `0x${string}`; // optional, for vault / sub-account trading
};
```

Register signers under arbitrary **labels** (`trader`, `tester`, …), then pass the label per call:

- **Read methods** (don't touch funds): label is **optional**. No label → **mainnet** fallback; a
  label → that signer's network. Unknown label throws.
- **Write methods** (orders, transfers, leverage…): label is **mandatory**. Omitting it throws — the
  label is what selects both the wallet *and* the network, so there is no implicit default.

This makes mainnet and testnet usable simultaneously in one process. See [doc/signing](./doc/signing.md).

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
