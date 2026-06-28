import type { MarketKind } from './types';

/**
 * Formate un PRIX aux règles HL : ≤ 5 chiffres significatifs ET ≤ `MAX_DECIMALS − szDecimals` décimales, où
 * MAX_DECIMALS = 6 (perp) / 8 (spot). Les prix ENTIERS sont toujours valides (cap ≤ 0 → arrondi entier). `szDecimals`
 * vient des infos de la paire (`meta.universe`). Doit être appliqué à TOUT prix d'ordre (entrée, SL trigger/price,
 * TP trigger/price) AVANT le wire : sinon un trigger trop précis est rejeté par HL (« does not exist » / leg ignoré).
 */
export function formatBoundPrice(raw: number, szDecimals: number, kind: MarketKind): string {
  const maxDecimals = (kind === 'spot' ? 8 : 6) - szDecimals;
  const sig = Number(raw.toPrecision(5));
  if (maxDecimals <= 0) {
    return String(Math.round(sig));
  }
  const factor = 10 ** maxDecimals;
  return String(Math.round(sig * factor) / factor);
}

/**
 * Formate un nombre en chaîne « wire » Hyperliquid : 8 décimales max, zéros de fin
 * retirés. Iso `float_to_wire` du SDK Python (lève si l'arrondi perd de la précision).
 */
export function floatToWire(x: number): string {
  const rounded = x.toFixed(8);
  if (Math.abs(Number(rounded) - x) >= 1e-12) {
    throw new Error(`floatToWire : arrondi destructeur sur ${x}`);
  }
  let normalized = rounded.includes('.') ? rounded.replace(/0+$/, '').replace(/\.$/, '') : rounded;
  if (normalized === '-0') {
    normalized = '0';
  }
  return normalized;
}

/**
 * Normalise une valeur de prix/taille au format « wire » HL (zéros de fin retirés), qu'elle arrive en `number`
 * OU en `string`. Une `string` mal normalisée (ex. `"70.190"` issue d'un `toFixed`) signée telle quelle ferait
 * diverger le hash de celui recalculé par HL (qui normalise) → `User or API Wallet … does not exist`. On repasse
 * donc TOUTE valeur par `floatToWire`.
 */
export function toWireValue(value: number | string): string {
  return floatToWire(typeof value === 'string' ? Number(value) : value);
}

/**
 * Asset ID (perp) d'une coin = son index dans `meta.universe`. Lève si introuvable.
 * Pour le spot, l'asset ID est `10000 + index` de la paire dans `spotMeta.universe`.
 */
export function assetIndex(universe: readonly { name: string }[], coin: string): number {
  const index = universe.findIndex((asset) => asset.name === coin);
  if (index === -1) {
    throw new Error(`Coin introuvable dans l'univers : ${coin}`);
  }
  return index;
}

/** Convertit un datetime unifié `YYYY-MM-DD HH:MM:SS` (UTC, C7) en millisecondes epoch. */
export function dateToMs(date: string): number {
  return new Date(`${date.replace(' ', 'T')}Z`).getTime();
}
