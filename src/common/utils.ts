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

/** Renvoie une valeur de prix/taille déjà en chaîne, ou la formate si c'est un nombre. */
export function toWireValue(value: number | string): string {
  return typeof value === 'string' ? value : floatToWire(value);
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
