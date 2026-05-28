# WebSocket

`WsClient` connects to `wss://api.hyperliquid.xyz/ws` (or testnet), manages subscriptions with
dispatch by `channel`, ping/pong heartbeat, reconnection with re-subscription, and request/response
via `post` (including **signed trading actions**).

The network and the signer are chosen by a `label` passed at construction. Without a label the
socket connects to **mainnet** (read-only); signed actions then require a labelled client.

```ts
import { init, WsClient, assetIndex, getMeta } from '@blackcube/hyperliquid-sdk';

init({ signers: { tester: { privateKey, publicKey, network: 'testnet' } } });

const ws = new WsClient({ label: 'tester' }); // connects to the label's network (testnet)
await ws.connect();

// Streams
const unsubscribe = ws.subscribeAllMids((data) => console.log(data));
ws.subscribeL2Book({ coin: 'BTC' }, (book) => console.log(book));

// Signed trading over WS — signs with the client's label
const asset = assetIndex((await getMeta(undefined, 'tester')).universe, 'BTC');
await ws.createLimitOrder({ asset, isBuy: true, price: 30000, size: 0.001, tif: 'Alo' });

unsubscribe();
ws.disconnect();
```

## Subscriptions (🔓 public streams / 🔑 account streams)

Each `subscribe*` returns an `Unsubscribe` function. Handlers receive the message `data`.

| Method | subscription `type` |
|---|---|
| `subscribeAllMids(handler)` | `allMids` |
| `subscribeL2Book({ coin }, handler)` | `l2Book` |
| `subscribeTrades({ coin }, handler)` | `trades` |
| `subscribeBbo({ coin }, handler)` | `bbo` |
| `subscribeCandle({ coin, interval }, handler)` | `candle` |
| `subscribeOrderUpdates({ user }, handler)` | `orderUpdates` |
| `subscribeUserFills({ user }, handler)` | `userFills` |
| `subscribeWebData2({ user }, handler)` | `webData2` |

Generic: `subscribe(subscription, handler)` for any subscription `{ type, … }`.

## Signed trading actions (🔑)

Mirror the REST exchange verbs, sent over the socket via `post` (`{ type: 'action', payload }`).
They sign with the client's `label` (set at construction) — no per-call signer argument:

| Method | action |
|---|---|
| `createLimitOrder(order)` | `order` |
| `createMarketOrder(order)` | `order` (IOC) |
| `cancelOrder({ asset, oid })` | `cancel` |
| `editOrder({ oid, order })` | `modify` |

## Request/response & lifecycle

| Method | Purpose |
|---|---|
| `connect()` / `disconnect()` | open / close the socket (auto-reconnect re-subscribes) |
| `post(request)` | `POST`-over-WS by numeric id; resolves with the `post` response |
| `startHeartbeat()` / `stopHeartbeat()` | ping loop (default 50 s; HL closes idle ~60 s) |
| `onMessage` / `onError` / `onClose` / `onReconnect` | optional callbacks |
