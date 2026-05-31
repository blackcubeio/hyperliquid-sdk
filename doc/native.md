# Surface `native` — spécifique à `@blackcube/hyperliquid-sdk`

Capacités **propres à Hyperliquid**, hors contrat unifié (voir [`common.md`](common.md) pour le portable).
Accès uniforme à tous les SDK : **`dex.native.<capacité>(label?)`**. Les noms d'interfaces (`IAgents`,
`IStaking`, `IVaults`…) et de méthodes sont **identiques entre SDK** ; seuls les types de params
diffèrent. (Le surplus **ordres** — `placeBatch`/`placeTwap`/… — est porté par `perp()`/`spot()`,
pas par un scope `native` ; voir plus bas.)

```ts
const dex = new Hyperliquid({ desk: signer }, { default: 'desk' });
dex.native.marketData().allMids();
```

`label?` choisit le signer (défaut : signer par défaut). Lectures publiques (`marketData`) : `label`
optionnel, `new Hyperliquid()` suffit. Écritures (`agents`, `staking`, `vaults` mutatifs) :
signées (un signer est requis).

---

## `native.marketData()` — `INativeMarket` (lectures publiques)
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

## `native.account()` — `INativeAccount` (lectures de compte étendues)
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

## Surplus ordres — `INativeOrders`, porté par `perp()` / `spot()`

> Le surplus **ordres** (batch / cloid / lecture / fills / TWAP) n'a **pas** de scope `native`
> dédié : il est exposé directement sur le scope marché `dex.perp()` / `dex.spot()`, aux côtés des
> verbes communs (`place`/`cancel`/`edit`…).

| Méthode | Entrée | Sortie |
|---|---|---|
| `placeBatch(orders)` | `PlaceBatch` | `Promise<unknown>` (statuses) |
| `cancelMany(cancels)` | `CancelMany` | `Promise<unknown>` |
| `cancelManyByClientId(cancels)` | `CancelManyByClientId` | `Promise<unknown>` |
| `editBatch(modifies)` | `ModifyBatch` | `Promise<unknown>` |
| `getById(p)` | `{ user: 0x; oid: number \| 0x }` | `Promise<OrderStatusResponse>` |
| `getFills(p)` | `{ user: 0x; startTime; endTime? }` | `Promise<UserFill[]>` |
| `placeTwap(p)` | `TwapOrder` | `Promise<unknown>` (twapId) |
| `cancelTwap(p)` | `TwapCancel` | `Promise<unknown>` |
| `getTwapFills()` | — | `Promise<unknown>` (fills des slices) |

```ts
const res = await dex.perp().placeBatch([{ asset: 0, isBuy: true, price: '50000', size: '0.001', tif: 'Alo' }]);
const oid = res.response.data.statuses[0].resting.oid;
await dex.perp().getById({ user: '0x…', oid });
await dex.perp().cancelMany([{ asset: 0, oid }]);
await dex.perp().cancelManyByClientId([{ asset: 0, cloid: '0x…' }]);
await dex.perp().editBatch([{ oid, order: { asset: 0, isBuy: true, price: '49000', size: '0.001' } }]);
await dex.perp().getFills({ user: '0x…', startTime: Date.now() - 86_400_000 });
// TWAP
const twap = await dex.perp().placeTwap({ asset: 0, isBuy: true, size: '0.001', minutes: 30 });
await dex.perp().cancelTwap({ asset: 0, twapId: 123 });
await dex.perp().getTwapFills();
```

## `native.agents()` — `IAgents` (API wallets / agents)
| Méthode | Entrée | Sortie |
|---|---|---|
| `approve(p)` | `ApproveAgent` | `Promise<unknown>` |

```ts
await dex.native.agents().approve({ agentAddress: '0x…', agentName: 'bot' });
```

> **Transferts** : `transfers()` est désormais un scope **commun** (`dex.transfers()`), plus dans
> `native`. Voir `doc/common.md` → modèle unifié `transfer({ from?, to, asset?, amount })`.

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

## `native.vaults()` — `IVaults` (vaults)
| Méthode | Entrée | Sortie |
|---|---|---|
| `transfer(p)` | `VaultTransfer` `{ vaultAddress: 0x; isDeposit; usd }` | `Promise<unknown>` (dépôt/retrait) |
| `create(p)` | `CreateVault` `{ name; description; initialUsd≥100 }` | `Promise<unknown>` |
| `modify(p)` | `VaultModify` `{ vaultAddress; allowDeposits?; alwaysCloseOnWithdraw? }` | `Promise<unknown>` |
| `distribute(p)` | `VaultDistribute` `{ vaultAddress; usd }` | `Promise<unknown>` |
| `details(p)` | `{ vaultAddress: 0x; user? }` | `Promise<unknown>` |
| `equities()` | — | `Promise<unknown>` (équités du compte dans les vaults suivis) |

```ts
await dex.native.vaults().transfer({ vaultAddress: '0x…', isDeposit: true, usd: '100' });   // dépôt
await dex.native.vaults().transfer({ vaultAddress: '0x…', isDeposit: false, usd: '100' });  // retrait
await dex.native.vaults().create({ name: 'My Vault', description: 'desc 10+ chars', initialUsd: '100' });
await dex.native.vaults().modify({ vaultAddress: '0x…', allowDeposits: false });
await dex.native.vaults().distribute({ vaultAddress: '0x…', usd: '50' });
await dex.native.vaults().details({ vaultAddress: '0x…' });
await dex.native.vaults().equities();
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

## `native.referral()` — `IReferral` (parrainage)
| Méthode | Entrée | Sortie |
|---|---|---|
| `set(p)` | `SetReferrer` `{ code }` (une seule fois) | `Promise<unknown>` |
| `info()` | — | `Promise<unknown>` (code, parrain, filleuls) |

```ts
await dex.native.referral().set({ code: 'MYCODE' });
await dex.native.referral().info();
```

## `native.builderFee()` — `IBuilderFee` (fee builder)
| Méthode | Entrée | Sortie |
|---|---|---|
| `approve(p)` | `ApproveBuilderFee` `{ maxFeeRate: "0.001%"; builder: 0x }` | `Promise<unknown>` |
| `max(p)` | `{ user: 0x; builder: 0x }` | `Promise<unknown>` (fee max approuvé) |

```ts
await dex.native.builderFee().approve({ maxFeeRate: '0.001%', builder: '0x…' });
await dex.native.builderFee().max({ user: '0x…', builder: '0x…' });
```

---

> **Validation** (`tests/native.testnet.test.ts` + `tests/native.test.ts`, réseaux réels) :
> - **public mainnet** : `marketData` (allMids, metaAndAssetCtxs, candleSnapshot, predictedFundings, perpDexs).
> - **testnet signé/réel** : surplus ordres sur `perp()` (placeBatch → getById → cancelMany, placeTwap
>   → cancelTwap, twapId réel), `account` (fees/role/rateLimit/portfolio/historicalOrders),
>   `transfers().transfer` perp↔spot (commun, signé), `vaults.equities` + `vaults.transfer` (signé),
>   `staking` (lectures + withdraw signé), `subAccounts.list` + transfert USDC aller-retour (si un
>   sous-compte existe), `referral.info`, `builderFee.max`.
> - **préparées + documentées, testées manuellement** (créations/one-shot/lockup, sans test automatisé
>   créant une ressource ou bougeant des fonds inutilement) : `subAccounts.create/spotTransfer/modify`,
>   `vaults.create/modify/distribute`, `staking.deposit/delegate`, `referral.set`, `builderFee.approve`,
>   `agents.approve`.
