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
| `candleSnapshot(p)` | `{ coin; interval; startTime; endTime? }` | `Promise<Candle[]>` |
| `metaAndAssetCtxs()` | — | `Promise<[Meta, AssetCtx[]]>` (perp) |
| `metaAndAssetCtxsSpot()` | — | `Promise<[SpotMeta, SpotAssetCtx[]]>` |
| `frontendOpenOrders(p)` | `{ user: 0x; dex? }` | `Promise<FrontendOrder[]>` |
| `predictedFundings()` | — | `Promise<unknown>` (funding prédit par venue) |
| `perpDexs()` | — | `Promise<unknown>` (perp DEX builder-deployed) |

```ts
await dex.native.marketData().allMids();
await dex.native.marketData().candleSnapshot({ coin: 'BTC', interval: '1h', startTime: Date.now() - 6 * 3600_000 });
await dex.native.marketData().metaAndAssetCtxs();
await dex.native.marketData().metaAndAssetCtxsSpot();
await dex.native.marketData().frontendOpenOrders({ user: '0x…' });
await dex.native.marketData().predictedFundings();
await dex.native.marketData().perpDexs();
```

## `native.account()` — `IAccountExtra` (lectures de compte étendues)
*(`user` = adresse du signer, injectée par le scope.)*
| Méthode | Entrée | Sortie |
|---|---|---|
| `fees()` | — | `Promise<unknown>` (taux maker/taker, remises) |
| `portfolio()` | — | `Promise<unknown>` (séries valeur/PnL) |
| `funding(q)` | `{ startTime; endTime? }` | `Promise<unknown>` (paiements funding) |
| `ledger(q)` | `{ startTime; endTime? }` | `Promise<unknown>` (mouvements hors funding) |
| `role()` | — | `Promise<unknown>` (user/agent/vault/subAccount) |
| `rateLimit()` | — | `Promise<unknown>` (volume, requêtes) |
| `historicalOrders()` | — | `Promise<unknown>` (ordres historiques) |

```ts
await dex.native.account().fees();
await dex.native.account().portfolio();
await dex.native.account().funding({ startTime: Date.now() - 7 * 86_400_000 });
await dex.native.account().ledger({ startTime: Date.now() - 7 * 86_400_000 });
await dex.native.account().role();
await dex.native.account().rateLimit();
await dex.native.account().historicalOrders();
```

## `native.advancedOrders()` — `IAdvancedOrders` (batch / cloid / query / fills)
| Méthode | Entrée | Sortie |
|---|---|---|
| `placeBatch(orders)` | `PlaceBatch` | `Promise<unknown>` (statuses) |
| `cancelMany(cancels)` | `CancelMany` | `Promise<unknown>` |
| `cancelManyByClientId(cancels)` | `CancelManyByClientId` | `Promise<unknown>` |
| `modifyBatch(modifies)` | `ModifyBatch` | `Promise<unknown>` |
| `query(p)` | `{ user: 0x; oid: number \| 0x }` | `Promise<OrderStatusResponse>` |
| `fillsByTime(p)` | `{ user: 0x; startTime; endTime? }` | `Promise<UserFill[]>` |

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
| `approve(p)` | `ApproveAgent` | `Promise<unknown>` |

```ts
await dex.native.agents().approve({ agentAddress: '0x…', agentName: 'bot' });
```

## `native.transfers()` — `ITransfers` (USDC perp / bascule perp↔spot / token spot / inter-DEX)
| Méthode | Entrée | Sortie |
|---|---|---|
| `usdSend(p)` | `UsdSend` | `Promise<unknown>` |
| `usdClassTransfer(p)` | `UsdClassTransfer` | `Promise<unknown>` |
| `spotSend(p)` | `SpotSend` | `Promise<unknown>` |
| `sendAsset(p)` | `SendAsset` `{ destination; sourceDex?; destinationDex?; token; amount; fromSubAccount? }` | `Promise<unknown>` |

```ts
await dex.native.transfers().usdSend({ destination: '0x…', amount: '10' });
await dex.native.transfers().usdClassTransfer({ amount: '10', toPerp: false }); // perp → spot
await dex.native.transfers().spotSend({ destination: '0x…', token: 'USDC:0x…', amount: '10' });
await dex.native.transfers().sendAsset({ destination: '0x…', sourceDex: '', destinationDex: 'spot', token: 'USDC', amount: '10' });
```

## `native.subAccounts()` — `ISubAccountsAdmin` (sous-comptes)
| Méthode | Entrée | Sortie |
|---|---|---|
| `create(p)` | `CreateSubAccount` `{ name }` | `Promise<unknown>` |
| `transfer(p)` | `SubAccountTransfer` `{ subAccountUser: 0x; isDeposit; usd }` | `Promise<unknown>` |
| `spotTransfer(p)` | `SubAccountSpotTransfer` `{ subAccountUser; isDeposit; token; amount }` | `Promise<unknown>` |
| `modify(p)` | `SubAccountModify` `{ subAccountUser; name }` | `Promise<unknown>` |
| `list()` | — | `Promise<unknown>` (sous-comptes du master) |

```ts
await dex.native.subAccounts().create({ name: 'bot-1' });
await dex.native.subAccounts().transfer({ subAccountUser: '0x…', isDeposit: true, usd: '10' });   // master → sub
await dex.native.subAccounts().transfer({ subAccountUser: '0x…', isDeposit: false, usd: '10' });  // sub → master
await dex.native.subAccounts().spotTransfer({ subAccountUser: '0x…', isDeposit: true, token: 'USDC:0x…', amount: '5' });
await dex.native.subAccounts().modify({ subAccountUser: '0x…', name: 'bot-2' });
await dex.native.subAccounts().list();
```

## `native.staking()` — `IStaking` (staking HYPE)
*(le retrait de staking a un **délai de déblocage** ; `deposit`/`withdraw`/`delegate` sont des écritures à lockup.)*
| Méthode | Entrée | Sortie |
|---|---|---|
| `deposit(p)` | `StakingDeposit` `{ amount }` | `Promise<unknown>` (HYPE → solde de staking) |
| `withdraw(p)` | `StakingWithdraw` `{ amount }` | `Promise<unknown>` (solde de staking → spot) |
| `delegate(p)` | `Delegate` `{ validator: 0x; amount; isUndelegate }` | `Promise<unknown>` |
| `delegations()` | — | `Promise<unknown>` (délégations en cours) |
| `summary()` | — | `Promise<unknown>` (staké / non-staké / en retrait) |
| `history()` | — | `Promise<unknown>` |
| `rewards()` | — | `Promise<unknown>` |

```ts
await dex.native.staking().deposit({ amount: '10' });   // 10 HYPE → staking
await dex.native.staking().delegate({ validator: '0x…', amount: '10', isUndelegate: false });
await dex.native.staking().delegate({ validator: '0x…', amount: '10', isUndelegate: true });
await dex.native.staking().withdraw({ amount: '10' });   // staking → spot (après déblocage)
await dex.native.staking().delegations();
await dex.native.staking().summary();
await dex.native.staking().history();
await dex.native.staking().rewards();
```

---

> Validation (`tests/native.testnet.test.ts`, testnet réel) : `advancedOrders` (placeBatch → query →
> cancelMany), `account` (lectures par adresse), `subAccounts.list()` + **transfert USDC aller-retour**
> master↔sous-compte si un sous-compte existe. Les **créations** (`subAccounts.create`, agents) et
> `sendAsset` sont **préparées + documentées** mais testées **manuellement** (pas de création de
> ressource/clé en test automatisé).
