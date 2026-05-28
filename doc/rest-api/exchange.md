# REST — Exchange (signed actions)

All state changes go through `POST /exchange` and are **signed** (🔑 requires a registered
signer). Every function takes a **mandatory** trailing `label` (the registry key) — it selects both
the wallet and the network, and omitting it **throws**. See [Signing](../signing.md).

```ts
import { init, createLimitOrder, cancelOrder, assetIndex, getMeta } from '@blackcube/hyperliquid-sdk';

init({ signers: { tester: { privateKey, publicKey, network: 'testnet' } } });
const asset = assetIndex((await getMeta(undefined, 'tester')).universe, 'BTC');

const res = await createLimitOrder({ asset, isBuy: true, price: 30000, size: 0.001, tif: 'Alo' }, 'tester');
await cancelOrder({ asset, oid: 12345 }, 'tester');
```

## Orders

| Function | action | Notes |
|---|---|---|
| `createLimitOrder(order, label)` | `order` | limit order; `tif` = `Gtc` \| `Ioc` \| `Alo` (default `Gtc`) |
| `createMarketOrder(order, label)` | `order` | IOC at `order.price` (HL has no native market type — `price` bounds slippage) |
| `placeOrders(orders, label)` | `order` | several orders in one atomic action |
| `cancelOrder({ asset, oid }, label)` | `cancel` | cancel by order ID |
| `cancelOrders(cancels, label)` | `cancel` | batch cancel by oid |
| `cancelOrdersByCloid(cancels, label)` | `cancelByCloid` | cancel by client order ID |
| `editOrder({ oid, order }, label)` | `modify` | replace an existing order |
| `batchModifyOrders(modifies, label)` | `batchModify` | several modifies in one action |

`OrderParams = { asset, isBuy, price, size, reduceOnly?, tif?, cloid? }`. `price`/`size` accept a
number (formatted via `floatToWire`) or a pre-formatted string. `cloid` is a bytes16 hex.

## Account

| Function | action | Notes |
|---|---|---|
| `updateLeverage({ asset, isCross, leverage }, label)` | `updateLeverage` | cross/isolated leverage |
| `updateIsolatedMargin({ asset, isBuy, ntli }, label)` | `updateIsolatedMargin` | add/remove isolated margin (`ntli` = micro-USD int) |
| `scheduleCancel({ time? }, label)` | `scheduleCancel` | dead-man's switch (omit `time` to disable) |

## User-signed transfers & account management

EIP-712 typed-data actions (see [Signing](../signing.md)). Each exposes its `*_TYPES` and a `build*Action` helper.

| Function | action | Notes |
|---|---|---|
| `usdSend({ destination, amount, time? }, label)` | `usdSend` | send USDC to another HL account |
| `spotSend({ destination, token, amount, time? }, label)` | `spotSend` | send a spot token |
| `withdraw({ destination, amount, time? }, label)` | `withdraw3` | withdraw USDC to Arbitrum |
| `usdClassTransfer({ amount, toPerp, nonce? }, label)` | `usdClassTransfer` | move USDC between perp and spot wallets |
| `approveAgent({ agentAddress, agentName?, nonce? }, label)` | `approveAgent` | authorise an API/agent wallet to sign |

## Low-level

- `exchangeL1Action<T>(action, label)` — sign an arbitrary L1 action with the labelled signer and post it.
- `userSignedRequest<T>({ action, types, nonce, label })` — sign an arbitrary user-signed action.
- `postExchange<T>(body, network)` — raw `POST /exchange` on the given network (already-built body).

Responses throw `HyperliquidApiError` on `{ status: "err" }` or HTTP errors; otherwise return the
parsed `{ status: "ok", response }` body.
