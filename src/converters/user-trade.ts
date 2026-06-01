import type { UserTrade } from '../common/types';
import type { UserFill } from '../common/types';

/** Fill natif HL (`userFills`). */
export type UserTradeNative = UserFill;

/**
 * Convertisseur **bijectif** fill : `toCommon(native) → UserTrade` / inverse.
 * `side` B/A → buy/sell, `maker = !crossed` ; natifs (side, startPosition, dir, hash, crossed)
 * conservés dans `xtras` → `toNative` les restitue.
 */
export class UserTradeConverter {
  toCommon(wire: UserTradeNative): UserTrade {
    const { coin, px, sz, time, closedPnl, oid, fee, tid, feeToken, ...rest } = wire;
    return {
      name: coin,
      kind: coin.includes('/') || /^@\d+$/.test(coin) ? 'spot' : 'perp',
      id: String(tid),
      orderId: String(oid),
      side: rest.side === 'B' ? 'buy' : 'sell',
      price: px,
      size: sz,
      fee,
      feeAsset: feeToken,
      pnl: closedPnl,
      maker: !rest.crossed,
      time,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(trade: UserTrade): UserTradeNative {
    // `xtras` porte les champs natifs omis du cœur (`side`/`startPosition`/`dir`/`hash`/`crossed`) :
    // on les restitue explicitement (pas de double cast — la forme native est typée).
    const xtras = (trade.xtras ?? {}) as Partial<UserTradeNative>;
    return {
      coin: trade.name,
      px: trade.price,
      sz: trade.size,
      side: xtras.side ?? (trade.side === 'buy' ? 'B' : 'A'),
      time: trade.time,
      startPosition: xtras.startPosition ?? '0',
      dir: xtras.dir ?? '',
      closedPnl: trade.pnl ?? '0',
      hash: xtras.hash ?? '',
      oid: Number(trade.orderId),
      crossed: xtras.crossed ?? trade.maker === false,
      fee: trade.fee,
      tid: Number(trade.id),
      feeToken: trade.feeAsset ?? '',
    };
  }
}
