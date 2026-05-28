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
