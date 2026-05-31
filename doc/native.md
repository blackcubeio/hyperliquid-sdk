# Surface `native` — spécifique à `@blackcube/hyperliquid-sdk`

Capacités **propres à Hyperliquid**, hors contrat unifié (voir [`common.md`](common.md) pour le portable).
Accès uniforme à tous les SDK : **`dex.native.<capacité>(label?)`**. Les noms d'interfaces (`IAgents`,
`ITransfers`, `IAdvancedOrders`…) et de méthodes sont **identiques entre SDK** ; seuls les types de
params diffèrent.

```ts
const dex = new Hyperliquid({ desk: signer }, { default: 'desk' });
dex.native.marketData().allMids();
```

`label?` choisit le signer (défaut : signer par défaut). Lectures publiques (`marketData`) : `label`
optionnel, `new Hyperliquid()` suffit. Écritures (`advancedOrders` mutatifs, `agents`, `transfers`) :
signées (un signer est requis).

---

## `native.marketData()` — `IMarketDataExtra` (lectures publiques)
| Méthode | Entrée | Sortie |
|---|---|---|
| `allMids(dex?)` | `string?` | `Promise<AllMids>` (map `coin → mid`) |
| `candleSnapshot(p)` | `CandleSnapshotQuery` | `Promise<Candle[]>` |
| `metaAndAssetCtxs()` | — | `Promise<[Meta, AssetCtx[]]>` (perp) |
| `metaAndAssetCtxsSpot()` | — | `Promise<[SpotMeta, SpotAssetCtx[]]>` |
| `frontendOpenOrders(p)` | `FrontendOpenOrdersQuery` | `Promise<FrontendOrder[]>` |

```ts
await dex.native.marketData().allMids();
await dex.native.marketData().candleSnapshot({ coin: 'BTC', interval: '1h', startTime: Date.now() - 6 * 3600_000 });
await dex.native.marketData().metaAndAssetCtxs();
await dex.native.marketData().metaAndAssetCtxsSpot();
await dex.native.marketData().frontendOpenOrders({ user: '0x…' });
```

## `native.advancedOrders()` — `IAdvancedOrders` (batch / cloid / query / fills)
| Méthode | Entrée | Sortie |
|---|---|---|
| `placeBatch(orders)` | `PlaceBatchInput` | `Promise<unknown>` (statuses) |
| `cancelMany(cancels)` | `CancelManyInput` | `Promise<unknown>` |
| `cancelManyByClientId(cancels)` | `CancelManyByClientIdInput` | `Promise<unknown>` |
| `modifyBatch(modifies)` | `ModifyBatchInput` | `Promise<unknown>` |
| `query(p)` | `OrderStatusQuery` | `Promise<OrderStatusResponse>` |
| `fillsByTime(p)` | `FillsByTimeQuery` | `Promise<UserFill[]>` |

```ts
const res = await dex.native.advancedOrders().placeBatch([{ asset: 0, isBuy: true, price: '50000', size: '0.001', tif: 'Alo' }]);
const oid = res.response.data.statuses[0].resting.oid;
await dex.native.advancedOrders().query({ user: '0x…', oid });
await dex.native.advancedOrders().cancelMany([{ asset: 0, oid }]);
await dex.native.advancedOrders().cancelManyByClientId([{ asset: 0, cloid: '0x…' }]);
await dex.native.advancedOrders().modifyBatch([{ oid, order: { asset: 0, isBuy: true, price: '49000', size: '0.001' } }]);
await dex.native.advancedOrders().fillsByTime({ user: '0x…', startTime: Date.now() - 86_400_000 });
```

## `native.agents()` — `IAgents` (API wallets / agents)
| Méthode | Entrée | Sortie |
|---|---|---|
| `approve(p)` | `ApproveAgentInput` | `Promise<unknown>` |

```ts
await dex.native.agents().approve({ agentAddress: '0x…', agentName: 'bot' });
```

## `native.transfers()` — `ITransfers` (USDC perp / bascule perp↔spot / token spot)
| Méthode | Entrée | Sortie |
|---|---|---|
| `usdSend(p)` | `UsdSendInput` | `Promise<unknown>` |
| `usdClassTransfer(p)` | `UsdClassTransferInput` | `Promise<unknown>` |
| `spotSend(p)` | `SpotSendInput` | `Promise<unknown>` |

```ts
await dex.native.transfers().usdSend({ destination: '0x…', amount: '10' });
await dex.native.transfers().usdClassTransfer({ amount: '10', toPerp: false }); // perp → spot
await dex.native.transfers().spotSend({ destination: '0x…', token: 'USDC:0x…', amount: '10' });
```

---

> Validation : `tests/native.test.ts` (lectures publiques mainnet) et `tests/native.testnet.test.ts`
> (chemin signé `advancedOrders` : placeBatch → query → cancelMany sur testnet réel).
