# Surface `native` — spécifique à `@blackcube/hyperliquid-sdk`

Capacités **propres à Hyperliquid**, hors contrat unifié (voir [`common.md`](common.md) pour le portable).
Accès uniforme à tous les SDK : **`dex.native.<capacité>(label?)`**. Les noms d'interfaces (`IAgents`,
`IStaking`, `IVaults`…) et de méthodes sont **identiques entre SDK** ; seuls les types de params
diffèrent. (Le surplus **ordres** — `placeBatch`/`placeTwap`/… — est porté par `perp()`/`spot()`,
pas par un scope `native` ; voir plus bas.)

```ts
const dex = new Hyperliquid({ desk: signer }, { default: 'desk' });
dex.native.marketData().getAllMids();
```

`label?` choisit le signer (défaut : signer par défaut). Lectures publiques (`marketData`) : `label`
optionnel, `new Hyperliquid()` suffit. Écritures (`agents`, `staking`, `vaults` mutatifs) :
signées (un signer est requis).

---

## `native.marketData()` — `INativeMarket` (lectures publiques)
| Méthode | Entrée | Sortie |
|---|---|---|
| `getAllMids(dex?)` | `string?` | `Promise<AllMids>` (map `coin → mid`) |
| `getCandleSnapshot(p)` | `{ coin; interval; startTime; endTime? }` | `Promise<Candle[]>` |
| `getMetaAndAssetCtxs()` | — | `Promise<[Meta, AssetCtx[]]>` (perp) |
| `getMetaAndAssetCtxsSpot()` | — | `Promise<[SpotMeta, SpotAssetCtx[]]>` |
| `getFrontendOpenOrders(p)` | `{ user: 0x; dex? }` | `Promise<FrontendOrder[]>` |
| `getPredictedFundings()` | — | `Promise<unknown>` (funding prédit par venue) |
| `getPerpDexs()` | — | `Promise<unknown>` (perp DEX builder-deployed) |

```ts
await dex.native.marketData().getAllMids();
await dex.native.marketData().getCandleSnapshot({ coin: 'BTC', interval: '1h', startTime: Date.now() - 6 * 3600_000 });
await dex.native.marketData().getMetaAndAssetCtxs();
await dex.native.marketData().getMetaAndAssetCtxsSpot();
await dex.native.marketData().getFrontendOpenOrders({ user: '0x…' });
await dex.native.marketData().getPredictedFundings();
await dex.native.marketData().getPerpDexs();
```

## `native.account()` — `INativeAccount` (lectures de compte étendues)
*(`user` = adresse du signer, injectée par le scope.)*
| Méthode | Entrée | Sortie |
|---|---|---|
| `getFees()` | — | `Promise<unknown>` (taux maker/taker, remises) |
| `getPortfolio()` | — | `Promise<unknown>` (séries valeur/PnL) |
| `getFunding(q)` | `{ startTime; endTime? }` (datetime `YYYY-MM-DD HH:MM:SS`) | `Promise<unknown>` (paiements funding) |
| `getLedger(q)` | `{ startTime; endTime? }` (datetime `YYYY-MM-DD HH:MM:SS`) | `Promise<unknown>` (mouvements hors funding) |
| `getRole()` | — | `Promise<unknown>` (user/agent/vault/subAccount) |
| `getRateLimit()` | — | `Promise<unknown>` (volume, requêtes) |
| `getHistoricalOrders()` | — | `Promise<unknown>` (ordres historiques) |

```ts
await dex.native.account().getFees();
await dex.native.account().getPortfolio();
await dex.native.account().getFunding({ startTime: Date.now() - 7 * 86_400_000 });
await dex.native.account().getLedger({ startTime: Date.now() - 7 * 86_400_000 });
await dex.native.account().getRole();
await dex.native.account().getRateLimit();
await dex.native.account().getHistoricalOrders();
```

## Surplus ordres — `INativeOrders`, porté par `perp()` / `spot()`

> Le surplus **ordres** (batch / cloid / lecture / fills / TWAP) n'a **pas** de scope `native`
> dédié : il est exposé directement sur le scope marché `dex.perp()` / `dex.spot()`, aux côtés des
> verbes communs (`place`/`cancel`/`edit`…).

| Méthode | Entrée | Sortie |
|---|---|---|
| `placeBatch(orders)` | `PlaceBatchParams` | `Promise<unknown>` (statuses) |
| `cancelMany(cancels)` | `CancelManyParams` | `Promise<unknown>` |
| `cancelManyByClientId(cancels)` | `CancelManyByClientIdParams` | `Promise<unknown>` |
| `editBatch(modifies)` | `EditBatchParams` | `Promise<unknown>` |
| `getById(p)` | `{ user: 0x; oid: number \| 0x }` | `Promise<OrderStatusResponse>` |
| `getFills(p)` | `{ user: 0x; startTime; endTime? }` | `Promise<UserFill[]>` |
| `placeTwap(p)` | `TwapOrderParams` | `Promise<unknown>` (twapId) |
| `cancelTwap(p)` | `TwapCancelParams` | `Promise<unknown>` |
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
| `approve(p)` | `ApproveAgentParams` | `Promise<unknown>` |

```ts
await dex.native.agents().approve({ agentAddress: '0x…', agentName: 'bot' });
```

> **Transferts** : `transfers()` est désormais un scope **commun** (`dex.transfers()`), plus dans
> `native`. Voir `doc/common.md` → modèle unifié `transfer({ from?, to, asset?, amount })`.

## `native.subAccounts()` — `ISubAccountsAdmin` (sous-comptes)
*(les **transferts** master↔sous-compte sont sur le scope commun `transfers()`.)*
| Méthode | Entrée | Sortie |
|---|---|---|
| `create(p)` | `CreateSubAccountParams` `{ name }` | `Promise<unknown>` |
| `modify(p)` | `SubAccountModifyParams` `{ subAccountUser; name }` | `Promise<unknown>` |
| `getList()` | — | `Promise<unknown>` (sous-comptes du master) |

```ts
await dex.native.subAccounts().create({ name: 'bot-1' });
await dex.native.subAccounts().modify({ subAccountUser: '0x…', name: 'bot-2' });
await dex.native.subAccounts().getList();
// Transferts master↔sous-compte : dex.transfers().transfer({ to: { subAccount: '0x…' }, amount: '10' })
```

## `native.vaults()` — `IVaults` (vaults)
| Méthode | Entrée | Sortie |
|---|---|---|
| `transfer(p)` | `VaultTransferParams` `{ vaultAddress: 0x; isDeposit; usd }` | `Promise<unknown>` (dépôt/retrait) |
| `create(p)` | `CreateVaultParams` `{ name; description; initialUsd≥100 }` | `Promise<unknown>` |
| `modify(p)` | `VaultModifyParams` `{ vaultAddress; allowDeposits?; alwaysCloseOnWithdraw? }` | `Promise<unknown>` |
| `distribute(p)` | `VaultDistributeParams` `{ vaultAddress; usd }` | `Promise<unknown>` |
| `getDetails(p)` | `{ vaultAddress: 0x; user? }` | `Promise<unknown>` |
| `getEquities()` | — | `Promise<unknown>` (équités du compte dans les vaults suivis) |

```ts
await dex.native.vaults().transfer({ vaultAddress: '0x…', isDeposit: true, usd: '100' });   // dépôt
await dex.native.vaults().transfer({ vaultAddress: '0x…', isDeposit: false, usd: '100' });  // retrait
await dex.native.vaults().create({ name: 'My Vault', description: 'desc 10+ chars', initialUsd: '100' });
await dex.native.vaults().modify({ vaultAddress: '0x…', allowDeposits: false });
await dex.native.vaults().distribute({ vaultAddress: '0x…', usd: '50' });
await dex.native.vaults().getDetails({ vaultAddress: '0x…' });
await dex.native.vaults().getEquities();
```

## `native.staking()` — `IStaking` (staking HYPE)
*(le retrait de staking a un **délai de déblocage** ; `deposit`/`withdraw`/`delegate` sont des écritures à lockup.)*
| Méthode | Entrée | Sortie |
|---|---|---|
| `deposit(p)` | `StakingDepositParams` `{ amount }` | `Promise<unknown>` (HYPE → solde de staking) |
| `withdraw(p)` | `StakingWithdrawParams` `{ amount }` | `Promise<unknown>` (solde de staking → spot) |
| `delegate(p)` | `DelegateParams` `{ validator: 0x; amount; isUndelegate }` | `Promise<unknown>` |
| `getDelegations()` | — | `Promise<unknown>` (délégations en cours) |
| `getSummary()` | — | `Promise<unknown>` (staké / non-staké / en retrait) |
| `getHistory()` | — | `Promise<unknown>` |
| `getRewards()` | — | `Promise<unknown>` |

```ts
await dex.native.staking().deposit({ amount: '10' });   // 10 HYPE → staking
await dex.native.staking().delegate({ validator: '0x…', amount: '10', isUndelegate: false });
await dex.native.staking().delegate({ validator: '0x…', amount: '10', isUndelegate: true });
await dex.native.staking().withdraw({ amount: '10' });   // staking → spot (après déblocage)
await dex.native.staking().getDelegations();
await dex.native.staking().getSummary();
await dex.native.staking().getHistory();
await dex.native.staking().getRewards();
```

## `native.referral()` — `IReferral` (parrainage)
| Méthode | Entrée | Sortie |
|---|---|---|
| `set(p)` | `SetReferrerParams` `{ code }` (une seule fois) | `Promise<unknown>` |
| `getInfo()` | — | `Promise<unknown>` (code, parrain, filleuls) |

```ts
await dex.native.referral().set({ code: 'MYCODE' });
await dex.native.referral().getInfo();
```

## `native.builders()` — `IBuilders` (fee builders)
| Méthode | Entrée | Sortie |
|---|---|---|
| `approve(p)` | `ApproveBuilderFeeParams` `{ maxFeeRate: "0.001%"; builder: 0x }` | `Promise<unknown>` |
| `getMaxFee(p)` | `{ user: 0x; builder: 0x }` | `Promise<unknown>` (fee max approuvé) |

```ts
await dex.native.builders().approve({ maxFeeRate: '0.001%', builder: '0x…' });
await dex.native.builders().getMaxFee({ user: '0x…', builder: '0x…' });
```

---

> **Validation** (`tests/native.testnet.test.ts` + `tests/native.test.ts`, réseaux réels) :
> - **public mainnet** : `marketData` (getAllMids, getMetaAndAssetCtxs, getCandleSnapshot, getPredictedFundings, getPerpDexs).
> - **testnet signé/réel** : surplus ordres sur `perp()` (placeBatch → getById → cancelMany, placeTwap
>   → cancelTwap, twapId réel), `account` (getFees/getRole/getRateLimit/getPortfolio/getHistoricalOrders),
>   `transfers().transfer` perp↔spot (commun, signé), `vaults.getEquities` + `vaults.transfer` (signé),
>   `staking` (lectures + withdraw signé), `subAccounts.getList` + transfert USDC aller-retour via
>   `transfers()` (si un sous-compte existe), `referral.getInfo`, `builders.getMaxFee`.
> - **préparées + documentées, testées manuellement** (créations/one-shot/lockup, sans test automatisé
>   créant une ressource ou bougeant des fonds inutilement) : `subAccounts.create/modify`,
>   `vaults.create/modify/distribute`, `staking.deposit/delegate`, `referral.set`, `builders.approve`,
>   `agents.approve`.
