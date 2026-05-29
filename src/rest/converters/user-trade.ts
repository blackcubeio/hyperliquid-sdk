import type { UserTrade } from '../../common/types';
import type { UserFill } from '../info/get-user-fills';

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
    return {
      coin: trade.name,
      px: trade.price,
      sz: trade.size,
      time: trade.time,
      closedPnl: trade.pnl as string,
      oid: Number(trade.orderId),
      fee: trade.fee,
      tid: Number(trade.id),
      feeToken: trade.feeAsset as string,
      ...trade.xtras,
    } as unknown as UserTradeNative;
  }
}
