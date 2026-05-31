// ── Surface publique du SDK Hyperliquid ───────────────────────────────────────
// Point d'entrée unique : la classe `Hyperliquid`. Tout le reste (fonctions REST, clients WS
// bruts, signing, types natifs) est interne et n'est pas exporté.

/** Façade : `new Hyperliquid(signers, { default })` puis `.perp()/.spot()/.account()/.system()/.helpers()/.ws()`. */
export { Hyperliquid, type HyperliquidDexOptions } from './dex/hyperliquid';

/** Contrat : interfaces de capacités + types d'entrée (Input) des méthodes. */
export type * from './dex/contract';

/** Interfaces **complémentaires** Hyperliquid (surplus via `dex.native.<capacité>()`). */
export type * from './dex/native-contract';

/** Configuration d'un signer (passé au constructeur) et réseau. */
export type { Signer, Network } from './common/types';

/** Types **de sortie** unifiés renvoyés par les méthodes de la façade. */
export type {
  Balance,
  Candle,
  FundingRate,
  MarketKind,
  Order,
  OrderBook,
  OrderBookLevel,
  Pair,
  Position,
  Price,
  Side,
  SubAccount,
  Trade,
  UserTrade,
} from './common/types';

/** Types **de sortie** spécifiques au namespace `native` (cf. `doc/native.md`). */
export type { Ack } from './converters/ack';
export type {
  AccountFees,
  AccountRole,
  FundingPayment,
  LedgerUpdate,
  PortfolioWindow,
  RateLimit,
} from './converters/account';
export type { CancelResult } from './converters/cancel';
export type { ReferralInfo } from './converters/referral';
export type { Delegation, StakingDelta, StakingReward, StakingSummary } from './converters/staking';
export type { TwapPlacement } from './converters/twap';
export type { VaultDetails, VaultEquity } from './converters/vault';

/** Unsubscribe : valeur de retour des souscriptions WS. */
export type { Unsubscribe } from './common/ws';
