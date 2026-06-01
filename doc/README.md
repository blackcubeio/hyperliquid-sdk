# @blackcube/hyperliquid-sdk — Documentation

SDK TypeScript pour l'exchange [Hyperliquid](https://hyperliquid.xyz) (DEX perpetuals & spot).
Tout passe par la classe **`Hyperliquid`** — voir le [README](../README.md) pour la surface
complète (scopes `perp`/`spot`/`account`/`transfers`/`helpers`/`ws`/`wsSpot` + namespace `native`,
REST vs WebSocket, exemples).

## Sommaire

- [README](../README.md) — la classe `Hyperliquid`, les scopes, REST vs WebSocket, exemples.
- [Surface commune](./common.md) — le **contrat unifié** (identique sur les 4 SDK Blackcube).
- [Surface native](./native.md) — les capacités **spécifiques à Hyperliquid** (`dex.native.<cap>()`).
- [Signing](./signing.md) — schémas de signature (EIP-712 L1 + user-signed, msgpack), signers
  par label, réseau par signer, API/agent wallets.

## Rappel : REST vs WebSocket

- **REST** (`perp()`, `spot()`, `account()`, `transfers()`, `helpers()`) — **requête → réponse** : tu
  `await`, tu reçois une valeur.
- **WebSocket** (`ws()`, `wsSpot()`) — **abonnement → flux** : un handler rappelé à chaque mise à
  jour, jusqu'au désabonnement. Socket ouvert au 1er `subscribe`, fermé au dernier `unsubscribe`.

Tous les retours sont au **format unifié Blackcube**, identique entre les SDK Aster / Hyperliquid /
Pacifica / Lighter.
