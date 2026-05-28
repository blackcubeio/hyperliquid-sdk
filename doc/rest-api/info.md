# REST — Info (reads)

All reads go through `POST /info` and are **unsigned** (🔓 public). Pass the **real account
address** for user-specific queries (never an agent wallet address → empty result).

```ts
import { init, getAllMids, getClearinghouseState } from '@blackcube/hyperliquid-sdk';

init({ network: 'mainnet' });
const mids = await getAllMids();
const state = await getClearinghouseState({ user: '0x…' });
```

## Market data

| Function | `type` | Returns |
|---|---|---|
| `getAllMids(dex?)` | `allMids` | `Record<coin, string>` — mid prices |
| `getMeta(dex?)` | `meta` | `{ universe: AssetMeta[] }` — perps universe (asset ID = index) |
| `getMetaAndAssetCtxs()` | `metaAndAssetCtxs` | `[Meta, AssetCtx[]]` — meta + mark/funding/OI per asset |
| `getL2Book({ coin, nSigFigs?, mantissa? })` | `l2Book` | `{ coin, time, levels: [bids, asks] }` |
| `getCandleSnapshot({ coin, interval, startTime, endTime? })` | `candleSnapshot` | `Candle[]` (params nested under `req`) |
| `getFundingHistory({ coin, startTime, endTime? })` | `fundingHistory` | `FundingHistoryEntry[]` |
| `getSpotMeta()` | `spotMeta` | `{ tokens, universe }` — spot tokens & pairs |

## Account & orders

| Function | `type` | Returns |
|---|---|---|
| `getClearinghouseState({ user, dex? })` | `clearinghouseState` | perps margin summary + `assetPositions` |
| `getOpenOrders({ user, dex? })` | `openOrders` | `OpenOrder[]` |
| `getFrontendOpenOrders({ user, dex? })` | `frontendOpenOrders` | `FrontendOrder[]` (with order type, triggers, TP/SL) |
| `getUserFills({ user, aggregateByTime? })` | `userFills` | `UserFill[]` |
| `getUserFillsByTime({ user, startTime, endTime?, aggregateByTime? })` | `userFillsByTime` | `UserFill[]` (≤ 500/page; paginate by `time`) |
| `getOrderStatus({ user, oid })` | `orderStatus` | `{ status, order? }` (`oid` = number or cloid hex) |

The low-level `infoRequest<T>(body)` is exported for any `info` request not covered by a typed helper.
