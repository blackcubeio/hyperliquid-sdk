# REST — Info (reads)

All reads go through `POST /info` and are **unsigned** (🔓 public). Pass the **real account
address** for user-specific queries (never an agent wallet address → empty result).

Every read takes an **optional** trailing `label`: with no label it targets **mainnet**; with a
label it targets that signer's network. An unknown label throws. The network is never global.

```ts
import { init, getAllMids, getClearinghouseState } from '@blackcube/hyperliquid-sdk';

init({ signers: { tester: { privateKey, publicKey, network: 'testnet' } } });
const mids = await getAllMids();                       // mainnet (no label)
const testMids = await getAllMids(undefined, 'tester'); // testnet (label's network)
const state = await getClearinghouseState({ user: '0x…' }, 'tester');
```

## Market data

| Function | `type` | Returns |
|---|---|---|
| `getAllMids(dex?, label?)` | `allMids` | `Record<coin, string>` — mid prices |
| `getMeta(dex?, label?)` | `meta` | `{ universe: AssetMeta[] }` — perps universe (asset ID = index) |
| `getMetaAndAssetCtxs(label?)` | `metaAndAssetCtxs` | `[Meta, AssetCtx[]]` — meta + mark/funding/OI per asset |
| `getL2Book({ coin, nSigFigs?, mantissa? }, label?)` | `l2Book` | `{ coin, time, levels: [bids, asks] }` |
| `getCandleSnapshot({ coin, interval, startTime, endTime? }, label?)` | `candleSnapshot` | `Candle[]` (params nested under `req`) |
| `getFundingHistory({ coin, startTime, endTime? }, label?)` | `fundingHistory` | `FundingHistoryEntry[]` |
| `getSpotMeta(label?)` | `spotMeta` | `{ tokens, universe }` — spot tokens & pairs |

## Account & orders

| Function | `type` | Returns |
|---|---|---|
| `getClearinghouseState({ user, dex? }, label?)` | `clearinghouseState` | perps margin summary + `assetPositions` |
| `getOpenOrders({ user, dex? }, label?)` | `openOrders` | `OpenOrder[]` |
| `getFrontendOpenOrders({ user, dex? }, label?)` | `frontendOpenOrders` | `FrontendOrder[]` (with order type, triggers, TP/SL) |
| `getUserFills({ user, aggregateByTime? }, label?)` | `userFills` | `UserFill[]` |
| `getUserFillsByTime({ user, startTime, endTime?, aggregateByTime? }, label?)` | `userFillsByTime` | `UserFill[]` (≤ 500/page; paginate by `time`) |
| `getOrderStatus({ user, oid }, label?)` | `orderStatus` | `{ status, order? }` (`oid` = number or cloid hex) |

The low-level `infoRequest<T>(body, label?)` is exported for any `info` request not covered by a typed helper.
