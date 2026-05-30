import type { Trade } from '../../common/types';

/**
 * Payload WS `trades` Hyperliquid — array d'éléments `{coin, side, px, sz, time, hash, tid, users}`.
 * `side` = côté du **taker** (`"B"` achat / `"A"` vente). HL n'a pas de trades publics REST.
 */
export interface TradeWsNative {
  coin: string;
  side: string;
  px: string;
  sz: string;
  time: number;
  hash: string;
  tid: number;
  users: string[];
}

/**
 * Convertisseur WS **unidirectionnel** trade : `toCommon(payload) → Trade`.
 * `side` = taker (`B`→buy / `A`→sell) ; `maker = null` (trade public, pas de rôle de fill).
 * Le hors-cœur (`coin/hash/users`) va dans `xtras` — rien jeté.
 */
export class TradeWsConverter {
  toCommon(wire: TradeWsNative): Trade {
    const { px, sz, side, time, tid, ...rest } = wire;
    return {
      price: px,
      size: sz,
      side: side === 'B' ? 'buy' : 'sell',
      maker: null,
      time,
      id: tid,
      xtras: rest as Record<string, unknown>,
    };
  }
}
