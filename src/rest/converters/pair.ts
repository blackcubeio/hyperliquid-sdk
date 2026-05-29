import type { Pair } from '../../common/types';
import type { AssetMeta } from '../info/get-meta';
import type { SpotPair, SpotToken } from '../info/get-meta-spot';

/** Pas de quantité dérivé des décimales de taille (`10^-d`). */
function stepFromDecimals(d: number): string {
  if (d <= 0) {
    return '1';
  }
  return `0.${'0'.repeat(d - 1)}1`;
}

/**
 * Convertisseur **bijectif** paire : `toCommon(native) → Pair` / `toNative(pair) → native`.
 * Dispatch sur `kind` (présent dans `AssetMeta`/`SpotPair`). Le cœur unifié est extrait ;
 * **tout le reste** va dans `xtras` → `toNative(toCommon(x)) ≡ x`.
 * Les `SpotToken` (résolution base/quote/szDecimals du spot) sont fournis au constructeur.
 */
export class PairConverter {
  constructor(private readonly tokens: SpotToken[] = []) {}

  toCommon(native: AssetMeta | SpotPair): Pair {
    return native.kind === 'spot'
      ? this.spotToCommon(native as SpotPair)
      : this.perpToCommon(native as AssetMeta);
  }

  toNative(pair: Pair): AssetMeta | SpotPair {
    if (pair.kind === 'spot') {
      return { name: pair.name, kind: pair.kind, ...pair.xtras } as unknown as SpotPair;
    }
    return {
      name: pair.name,
      szDecimals: pair.szDecimals,
      maxLeverage: pair.maxLeverage,
      kind: pair.kind,
      ...pair.xtras,
    } as unknown as AssetMeta;
  }

  private perpToCommon(asset: AssetMeta): Pair {
    const { name, szDecimals, maxLeverage, kind, ...rest } = asset;
    const pair: Pair = {
      name,
      base: name,
      quote: 'USDC',
      kind,
      szDecimals,
      maxLeverage,
      stepSize: stepFromDecimals(szDecimals),
      status: asset.isDelisted === true ? 'DELISTED' : 'TRADING',
    };
    if (Object.keys(rest).length > 0) {
      pair.xtras = rest as Record<string, unknown>;
    }
    return pair;
  }

  private spotToCommon(spot: SpotPair): Pair {
    const baseToken = this.tokens.find((token) => token.index === spot.tokens[0]);
    const quoteToken = this.tokens.find((token) => token.index === spot.tokens[1]);
    const szDecimals = baseToken?.szDecimals ?? 0;
    const { name, kind, ...rest } = spot;
    const pair: Pair = {
      name,
      base: baseToken?.name ?? String(spot.tokens[0]),
      quote: quoteToken?.name ?? String(spot.tokens[1]),
      kind,
      szDecimals,
      stepSize: stepFromDecimals(szDecimals),
    };
    if (Object.keys(rest).length > 0) {
      pair.xtras = rest as Record<string, unknown>;
    }
    return pair;
  }
}
