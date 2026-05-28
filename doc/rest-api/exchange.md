# REST — Exchange (signed actions)

All state changes go through `POST /exchange` and are **signed** (🔑 requires a registered
signer). Every function takes an optional `account?` (the registry key) — omit it when a single
signer is registered. See [Signing](../signing.md).

```ts
import { init, createLimitOrder, cancelOrder, assetIndex, getMeta } from '@blackcube/hyperliquid-sdk';

init({ network: 'testnet', signers: { [account]: { privateKey } } });
const asset = assetIndex((await getMeta()).universe, 'BTC');

const res = await createLimitOrder({ asset, isBuy: true, price: 30000, size: 0.001, tif: 'Alo' });
await cancelOrder({ asset, oid: 12345 });
```

## Orders

| Function | action | Notes |
|---|---|---|
| `createLimitOrder(order, account?)` | `order` | limit order; `tif` = `Gtc` \| `Ioc` \| `Alo` (default `Gtc`) |
| `createMarketOrder(order, account?)` | `order` | IOC at `order.price` (HL has no native market type — `price` bounds slippage) |
| `placeOrders(orders, account?)` | `order` | several orders in one atomic action |
| `cancelOrder({ asset, oid }, account?)` | `cancel` | cancel by order ID |
| `cancelOrders(cancels, account?)` | `cancel` | batch cancel by oid |
| `cancelOrdersByCloid(cancels, account?)` | `cancelByCloid` | cancel by client order ID |
| `editOrder({ oid, order }, account?)` | `modify` | replace an existing order |
| `batchModifyOrders(modifies, account?)` | `batchModify` | several modifies in one action |

`OrderParams = { asset, isBuy, price, size, reduceOnly?, tif?, cloid? }`. `price`/`size` accept a
number (formatted via `floatToWire`) or a pre-formatted string. `cloid` is a bytes16 hex.

## Account

| Function | action | Notes |
|---|---|---|
| `updateLeverage({ asset, isCross, leverage }, account?)` | `updateLeverage` | cross/isolated leverage |
| `updateIsolatedMargin({ asset, isBuy, ntli }, account?)` | `updateIsolatedMargin` | add/remove isolated margin (`ntli` = micro-USD int) |
| `scheduleCancel({ time? }, account?)` | `scheduleCancel` | dead-man's switch (omit `time` to disable) |

## User-signed transfers & account management

EIP-712 typed-data actions (see [Signing](../signing.md)). Each exposes its `*_TYPES` and a `build*Action` helper.

| Function | action | Notes |
|---|---|---|
| `usdSend({ destination, amount, time? }, account?)` | `usdSend` | send USDC to another HL account |
| `spotSend({ destination, token, amount, time? }, account?)` | `spotSend` | send a spot token |
| `withdraw({ destination, amount, time? }, account?)` | `withdraw3` | withdraw USDC to Arbitrum |
| `usdClassTransfer({ amount, toPerp, nonce? }, account?)` | `usdClassTransfer` | move USDC between perp and spot wallets |
| `approveAgent({ agentAddress, agentName?, nonce? }, account?)` | `approveAgent` | authorise an API/agent wallet to sign |

## Low-level

- `exchangeL1Action<T>(action, account?)` — sign an arbitrary L1 action and post it.
- `userSignedRequest<T>({ action, types, nonce, account? })` — sign an arbitrary user-signed action.
- `postExchange<T>(body)` — raw `POST /exchange` (already-built body).

Responses throw `HyperliquidApiError` on `{ status: "err" }` or HTTP errors; otherwise return the
parsed `{ status: "ok", response }` body.
