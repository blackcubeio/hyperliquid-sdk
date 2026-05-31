# Surface `native` — spécifique à `@blackcube/hyperliquid-sdk`

Capacités **propres à Hyperliquid**, hors contrat unifié (voir [`common.md`](common.md) pour le portable).
Accès **`dex.native.<capacité>(label?)`**. Le namespace `native` **miroite** le commun :

| commun (portable) | natif (spécifique) |
|---|---|
| `dex.perp()` | `dex.native.perp()` — reads marché + ordres avancés |
| `dex.account()` | `dex.native.account()` — lectures de compte étendues |
| `dex.transfers()` | — |

Les capacités **sans équivalent commun** restent propres : `native.agents()`, `native.subAccounts()`,
`native.vaults()`, `native.staking()`, `native.referral()`, `native.builders()`.

```ts
const dex = new Hyperliquid({ desk: signer }, { default: 'desk' });
dex.native.perp().getAllMids();
```

`label?` choisit le signer (défaut : signer par défaut). Lectures publiques (`native.perp()` reads) :
`label` optionnel, `new Hyperliquid()` suffit. Écritures (ordres avancés, `agents`, `staking`,
`vaults` mutatifs) : signées (un signer est requis).

---

## `native.perp()` — `INativePerp` (miroir natif de `perp()`)
Surplus **perp** : lectures marché supplémentaires (publiques) **+** ordres avancés (signés).
Formes natives assumées (shapes par **index d'actif**) — hors contrat portable, contrairement à
`dex.perp().place()`.

| Méthode | Entrée | Sortie |
|---|---|---|
| `getAllMids(dex?)` | `string?` | **`Promise<Mid[]>`** (`{ name; mid }`) |
| `getCandleSnapshot(p)` | `{ name; interval; startTime?; endTime? }` (datetime) | **`Promise<Candle[]>`** (type commun) |
| `getMetaAndAssetCtxs()` | — | `Promise<[Meta, AssetCtx[]]>` (perp) |
| `getMetaAndAssetCtxsSpot()` | — | `Promise<[SpotMeta, SpotAssetCtx[]]>` |
| `getFrontendOpenOrders(p?)` | `{ name? }` | **`Promise<Order[]>`** (type commun) |
| `getPredictedFundings()` | — | `Promise<unknown>` |
| `getPerpDexs()` | — | `Promise<unknown>` |
| `placeBatch(orders)` | `PlaceOrderParams[]` (vocab commun) | **`Promise<Order[]>`** (1 par leg) |
| `cancelMany(cancels)` | `CancelLegParams[]` `{ name; id }` | **`Promise<CancelResult[]>`** (1 par leg) |
| `cancelManyByClientId(cancels)` | `CancelByClientIdLegParams[]` `{ name; clientId }` | **`Promise<CancelResult[]>`** (1 par leg) |
| `editBatch(modifies)` | `EditBatchLegParams[]` `{ id; name; side; size; price }` | **`Promise<Order[]>`** (1 par leg) |
| `getById(p)` | `{ name; id }` | **`Promise<Order>`** (type commun) |
| `getFills(p)` | `{ startTime; endTime? }` (datetime) | **`Promise<UserTrade[]>`** |
| `placeTwap(p)` | `TwapOrderParams` `{ name; side; size; minutes; reduceOnly?; randomize? }` | **`Promise<TwapPlacement>`** (`id` du TWAP) |
| `cancelTwap(p)` | `TwapCancelParams` `{ name; id }` | **`Promise<Ack>`** |
| `getTwapFills()` | — | **`Promise<UserTrade[]>`** (`twapId` dans `xtras`) |

`CancelResult` : `{ id; clientId; status: 'ok'\|'error'; xtras }`. `TwapPlacement` :
`{ id; name; side; size; status: 'running'\|'error'; xtras }`. `Ack` (accusé d'écriture signée) :
`{ ok: boolean; xtras }`.

```ts
// lectures marché — I/O normalisés (types communs)
const mids = await dex.native.perp().getAllMids();                       // → Mid[] { name, mid }
await dex.native.perp().getCandleSnapshot({ name: 'BTC', interval: '1h', startTime: '2026-05-31 00:00:00' }); // → Candle[]
const open = await dex.native.perp().getFrontendOpenOrders({ name: 'BTC' });  // → Order[]
// ordres avancés — I/O normalisés (vocab commun + types communs)
const orders = await dex.native.perp().placeBatch([
  { name: 'BTC', side: 'buy', type: 'limit', price: '50000', size: '0.001', tif: 'alo' },
]); // → Order[]
const one = await dex.native.perp().getById({ name: 'BTC', id: orders[0].id }); // → Order
const fills = await dex.native.perp().getFills({ startTime: '2026-05-31 00:00:00' }); // → UserTrade[]
const cancelled = await dex.native.perp().cancelMany([{ name: 'BTC', id: orders[0].id }]); // → CancelResult[]
await dex.native.perp().cancelManyByClientId([{ name: 'BTC', clientId: '0x…' }]);          // → CancelResult[]
const edited = await dex.native.perp().editBatch([
  { id: orders[0].id, name: 'BTC', side: 'buy', size: '0.002', price: '49000' },
]); // → Order[]
const twap = await dex.native.perp().placeTwap({ name: 'BTC', side: 'buy', size: '0.001', minutes: 30 }); // → TwapPlacement
await dex.native.perp().cancelTwap({ name: 'BTC', id: twap.id ?? '' });  // → Ack
const twapFills = await dex.native.perp().getTwapFills();                // → UserTrade[]
```

## `native.account()` — `INativeAccount` (miroir natif de `account()`, lectures étendues)
*(`user` = adresse du signer, injectée par le scope. Toutes les sorties sont **typées** — jamais
`unknown`. Le natif complet est conservé dans `xtras`.)*
| Méthode | Entrée | Sortie |
|---|---|---|
| `getFees()` | — | **`Promise<AccountFees>`** `{ crossRate; addRate; spotCrossRate; spotAddRate; referralDiscount; dailyVolume; xtras }` |
| `getPortfolio()` | — | **`Promise<PortfolioWindow[]>`** `{ window; accountValueHistory; pnlHistory; volume; xtras }` |
| `getFunding(q)` | `{ startTime; endTime? }` (datetime `YYYY-MM-DD HH:MM:SS`) | **`Promise<FundingPayment[]>`** `{ name; amount; rate; time; xtras }` |
| `getLedger(q)` | `{ startTime; endTime? }` (datetime `YYYY-MM-DD HH:MM:SS`) | **`Promise<LedgerUpdate[]>`** `{ type; amount; time; xtras }` |
| `getRole()` | — | **`Promise<AccountRole>`** `{ role; xtras }` |
| `getRateLimit()` | — | **`Promise<RateLimit>`** `{ cumVolume; used; cap; xtras }` |
| `getHistoricalOrders()` | — | **`Promise<Order[]>`** (type commun, statut final) |

```ts
await dex.native.account().getFees();        // → AccountFees
await dex.native.account().getPortfolio();   // → PortfolioWindow[]
await dex.native.account().getFunding({ startTime: '2026-05-24 00:00:00' }); // → FundingPayment[]
await dex.native.account().getLedger({ startTime: '2026-05-24 00:00:00' });  // → LedgerUpdate[]
await dex.native.account().getRole();        // → AccountRole
await dex.native.account().getRateLimit();   // → RateLimit
await dex.native.account().getHistoricalOrders(); // → Order[]
```

## `native.agents()` — `IAgents` (API wallets / agents)
| Méthode | Entrée | Sortie |
|---|---|---|
| `approve(p)` | `ApproveAgentParams` | **`Promise<Ack>`** `{ ok; xtras }` |

```ts
await dex.native.agents().approve({ agentAddress: '0x…', agentName: 'bot' });
```

> **Transferts** : `transfers()` est désormais un scope **commun** (`dex.transfers()`), plus dans
> `native`. Voir `doc/common.md` → modèle unifié `transfer({ from?, to, asset?, amount })`.

## `native.subAccounts()` — `ISubAccountsAdmin` (sous-comptes)
*(les **transferts** master↔sous-compte sont sur le scope commun `transfers()`.)*
| Méthode | Entrée | Sortie |
|---|---|---|
| `create(p)` | `CreateSubAccountParams` `{ name }` | **`Promise<Ack>`** |
| `modify(p)` | `SubAccountModifyParams` `{ subAccountUser; name }` | **`Promise<Ack>`** |
| `getList()` | — | **`Promise<SubAccount[]>`** (type commun ; `address`, reste dans `xtras`) |

```ts
await dex.native.subAccounts().create({ name: 'bot-1' });
await dex.native.subAccounts().modify({ subAccountUser: '0x…', name: 'bot-2' });
await dex.native.subAccounts().getList();
// Transferts master↔sous-compte : dex.transfers().transfer({ to: { subAccount: '0x…' }, amount: '10' })
```

## `native.vaults()` — `IVaults` (vaults)
| Méthode | Entrée | Sortie |
|---|---|---|
| `transfer(p)` | `VaultTransferParams` `{ vaultAddress: 0x; isDeposit; usd }` | **`Promise<Ack>`** (dépôt/retrait) |
| `create(p)` | `CreateVaultParams` `{ name; description; initialUsd≥100 }` | **`Promise<Ack>`** |
| `modify(p)` | `VaultModifyParams` `{ vaultAddress; allowDeposits?; alwaysCloseOnWithdraw? }` | **`Promise<Ack>`** |
| `distribute(p)` | `VaultDistributeParams` `{ vaultAddress; usd }` | **`Promise<Ack>`** |
| `getDetails(p)` | `{ vaultAddress: 0x; user? }` | **`Promise<VaultDetails>`** `{ name; vaultAddress; leader; description; allowDeposits; xtras }` |
| `getEquities()` | — | **`Promise<VaultEquity[]>`** `{ vaultAddress; equity; lockedUntil; xtras }` |

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
| `deposit(p)` | `StakingDepositParams` `{ amount }` | **`Promise<Ack>`** (HYPE → solde de staking) |
| `withdraw(p)` | `StakingWithdrawParams` `{ amount }` | **`Promise<Ack>`** (solde de staking → spot) |
| `delegate(p)` | `DelegateParams` `{ validator: 0x; amount; isUndelegate }` | **`Promise<Ack>`** |
| `getDelegations()` | — | **`Promise<Delegation[]>`** `{ validator; amount; lockedUntil; xtras }` |
| `getSummary()` | — | **`Promise<StakingSummary>`** `{ delegated; undelegated; totalPendingWithdrawal; nPendingWithdrawals; xtras }` |
| `getHistory()` | — | **`Promise<StakingDelta[]>`** `{ type; amount; time; xtras }` |
| `getRewards()` | — | **`Promise<StakingReward[]>`** `{ source; amount; time; xtras }` |

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
| `set(p)` | `SetReferrerParams` `{ code }` (une seule fois) | **`Promise<Ack>`** |
| `getInfo()` | — | **`Promise<ReferralInfo>`** `{ code; referredBy; nReferred; xtras }` |

```ts
await dex.native.referral().set({ code: 'MYCODE' });
await dex.native.referral().getInfo();
```

## `native.builders()` — `IBuilders` (fee builders)
| Méthode | Entrée | Sortie |
|---|---|---|
| `approve(p)` | `ApproveBuilderFeeParams` `{ maxFeeRate: "0.001%"; builder: 0x }` | **`Promise<Ack>`** |
| `getMaxFee(p)` | `{ user: 0x; builder: 0x }` | **`Promise<number>`** (fee max approuvé, dixièmes de bps) |

```ts
await dex.native.builders().approve({ maxFeeRate: '0.001%', builder: '0x…' });
await dex.native.builders().getMaxFee({ user: '0x…', builder: '0x…' });
```

---

> **Validation** (`tests/native.testnet.test.ts` + `tests/native.test.ts`, réseaux réels) :
> - **public mainnet** : `native.perp()` reads (getAllMids, getMetaAndAssetCtxs, getCandleSnapshot, getPredictedFundings, getPerpDexs).
> - **testnet signé/réel** : `native.perp()` ordres avancés (placeBatch → getById → cancelMany, I/O normalisés ;
>   placeTwap → cancelTwap, `TwapPlacement.id` réel), `account` (getFees/getRole/getRateLimit/getPortfolio/getHistoricalOrders),
>   `transfers().transfer` perp↔spot (commun, signé), `vaults.getEquities` + `vaults.transfer` (signé),
>   `staking` (lectures + withdraw signé), `subAccounts.getList` + transfert USDC aller-retour via
>   `transfers()` (si un sous-compte existe), `referral.getInfo`, `builders.getMaxFee`.
> - **préparées + documentées, testées manuellement** (créations/one-shot/lockup, sans test automatisé
>   créant une ressource ou bougeant des fonds inutilement) : `subAccounts.create/modify`,
>   `vaults.create/modify/distribute`, `staking.deposit/delegate`, `referral.set`, `builders.approve`,
>   `agents.approve`.
