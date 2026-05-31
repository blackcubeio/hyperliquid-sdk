# @blackcube/hyperliquid-sdk

TypeScript SDK pour l'exchange [Hyperliquid](https://hyperliquid.xyz) — DEX perpetuals & spot
sur sa propre L1. Même surface que `@blackcube/aster-sdk` et `@blackcube/pacifica-sdk`.

> **SDK communautaire / non officiel.** Non affilié à Hyperliquid. Usage à vos risques.

## Installation

```bash
pnpm add @blackcube/hyperliquid-sdk
```

Node.js (≥ 22) et navigateur (crypto via `@noble`).

## Tout passe par la classe `Hyperliquid`

Tu n'appelles jamais un endpoint REST ni un client WebSocket directement. Une seule classe
gère la connexion, la signature (EIP-712 + msgpack), le réseau (mainnet/testnet) et la
conversion vers les types unifiés Blackcube.

```ts
import { Hyperliquid } from '@blackcube/hyperliquid-sdk';

const dex = new Hyperliquid(
  { deskA: { privateKey: '0x…', publicKey: '0x…', network: 'testnet' } },
  { default: 'deskA' },
);

// REST : requête → réponse
const candles = await dex.perp().getCandles({ name: 'BTC', interval: '1m', limit: 100 });
const order = await dex.perp().place({
  name: 'BTC', side: 'buy', type: 'limit', size: '0.001', price: '20000',
});

// WebSocket : abonnement → flux
const off = dex.ws().subscribeCandles({ name: 'BTC', interval: '1m' }, (candle) => {
  console.log(candle.c);
});
off(); // se désabonne (ferme le socket s'il n'y a plus d'abonné)
```

## REST vs WebSocket — la seule distinction à connaître

- **REST** (`perp()`, `spot()`, `account()`) : **requête → réponse**. Tu `await`
  un appel, tu reçois une valeur, terminé.
- **WebSocket** (`ws()`, `wsSpot()`) : **abonnement → flux**. Tu passes un *handler* rappelé
  **à chaque** mise à jour, tant que tu n'as pas appelé la fonction de désabonnement renvoyée.
  Pas de `connect()`/`disconnect()` : le socket s'ouvre au premier `subscribe` et se ferme
  seul quand le dernier abonnement est retiré.

Tous les retours (REST comme WS) sont au **format unifié** (`Candle`, `Order`, `OrderBook`,
`Position`, `Trade`, `UserTrade`, `Price`, `Balance`…), identique entre les SDK Blackcube.

## Construction

```ts
new Hyperliquid(signers?, options?)
```

- **`signers`** : `Record<label, Signer>`. Un `Signer` Hyperliquid =
  `{ privateKey, publicKey, network, vaultAddress? }` — clé secp256k1 (EVM). `privateKey` est
  l'API/agent wallet qui signe ; `publicKey` est l'adresse réelle du compte (master/sub) lue par
  l'API. Sans signer, seules les lectures publiques fonctionnent.
- **`options.default`** : label utilisé quand tu n'en précises pas (sinon le premier signer).
- Autres `options` (rarement utiles) : `fetch`, `webSocket`, `restUrls`, `wsUrls`.

Chaque scope accepte un `label` optionnel pour choisir le compte : `dex.perp('deskB')`,
`dex.account('deskB')`… Sans argument → signer par défaut. **Plusieurs instances `Hyperliquid`
(comptes/réseaux différents) coexistent** sans interférence — chacune a sa propre config (pas de
singleton global).

## Deux produits, un `kind` porté par le scope

Hyperliquid mêle perp et spot dans une même API : une paire **spot** se nomme `BASE/QUOTE`
(ex. `PURR/USDC`) ou `@index` (ex. `@1`) ; tout le reste est un **perp** (`BTC`, `HYPE`…). Le SDK
en déduit le `kind`, et le **scope** (`perp()` vs `spot()`) le confirme et l'annote sur les retours.

### `dex.perp(label?)` / `dex.spot(label?)` — marché + trading + compte du produit

| Catégorie | Méthodes |
|---|---|
| Marché (public) | `getPairs()`, `getCandles(q)`, `getOrderBook(q)`, `getPrices()`, `getFundingHistory(q)`, `getExchangeInfo()` |
| Compte du produit (signé) | `getPositions(q?)`, `getOpens(q?)`, `getUserTrades(q?)`, `getAccountInfo()` |
| Trading (signé) | `place(i)`, `cancel(i)`, `cancelAll(i)`, `edit(i)`, `updateLeverage(i)`, `setMarginMode(i)`, `addIsolatedMargin(i)`, `removeIsolatedMargin(i)` |

> **Spécificités Hyperliquid** (la surface unifiée n'expose que ce qui existe) :
> - pas de **trades publics REST** (`getTrades`) ni d'**historique d'ordres** (`getOrderHistory`) ;
> - `placeOrder` accepte `limit` / `market` (le `market` est un IOC borné par `price`) ;
> - `setMarginMode` est traduit en `updateLeverage(isCross)` (HL couple mode **et** levier) : la
>   méthode préserve le levier de la position courante, ou retombe sur `1×` s'il n'y en a pas.

### `dex.account(label?)` — compte transverse (sans produit)

`getBalances()` (soldes spot), `withdraw(i)`.

> Hyperliquid n'expose pas de **liste de sous-comptes** : pas de `getSubAccounts()`.

> Hyperliquid n'a ni `ping` ni horloge serveur publics : **pas de scope `system()`** (capacité
> `ISystem` non implémentée).

### `dex.helpers()` — crypto (EVM)

`keyTypeOf(pk)`, `privateKeyToAddress(pk)`, `toChecksumAddress(addr)`. *(Hyperliquid est EVM-only :
pas d'helpers Solana.)*

### `dex.ws(label?)` (perp) / `dex.wsSpot(label?)` (spot) — temps réel

Chaque `subscribeX` renvoie une fonction de désabonnement (`Unsubscribe`). Les flux user-data
(`subscribeOrders`, `subscribeUserTrades`) utilisent l'adresse du compte, résolue depuis le signer.

| Catégorie | Méthodes |
|---|---|
| Public | `subscribeCandles(q, cb)`, `subscribeOrderBook(q, cb)`, `subscribeTrades(q, cb)`, `subscribeBbo(q, cb)` (→ `OrderBook` 1 niveau), `subscribePrices(cb)` (→ `Price[]`) |
| Compte (signé) | `subscribeOrders(cb)`, `subscribeUserTrades(cb)` |

> Hyperliquid n'a pas de flux de **positions** dédié : pas de `subscribePositions()`.

### Scopes spécifiques Hyperliquid (hors contrat commun)

Hyperliquid offre des opérations qui n'existent pas sur les autres DEX — exposées à part :

- `dex.transfers(label?)` : `usdSend(i)`, `usdClassTransfer(i)` (perp ↔ spot), `spotSend(i)`.
- `dex.agent(label?)` : `approveAgent(i)`, `scheduleCancel(i?)` (dead-man's switch).

## Exemples

```ts
// Lecture publique sans signer
const pub = new Hyperliquid();
const book = await pub.perp().getOrderBook({ name: 'BTC' });

// Cycle d'ordre (testnet)
const created = await dex.perp().place({
  name: 'BTC', side: 'buy', type: 'limit', tif: 'alo', size: '0.001', price: '20000',
});
await dex.perp().cancel({ name: 'BTC', id: created.id });

// Compte transverse
const balances = await dex.account().getBalances();

// Temps réel : suivre ses propres fills
const off = dex.ws().subscribeUserTrades((fill) => console.log(fill.price, fill.size));
```

## Erreurs

Les appels rejettent un `HyperliquidApiError` (`status`, `message`).

## Documentation

Détail des signatures (EIP-712 L1 + user-signed, msgpack) : [`doc/signing.md`](doc/signing.md).

## License

BSD-3-Clause © Blackcube
