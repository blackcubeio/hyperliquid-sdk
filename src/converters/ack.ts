/**
 * Accusé d'une **écriture signée** Hyperliquid sans concept de retour plus riche (approbations,
 * créations sans ressource lisible immédiatement, distributions…). HL répond
 * `{ status: 'ok' | 'err', response: … }` : on expose un type **nommé** minimal, le natif complet
 * restant dans `xtras` (rien n'est jeté).
 */
export interface Ack {
  /** `true` si HL a accepté l'action (`status === 'ok'`). */
  ok: boolean;
  /** Réponse native complète (rien jeté). */
  xtras: Record<string, unknown>;
}

/** Forme native d'une réponse `/exchange` HL. */
export interface AckNative {
  status?: string;
  response?: unknown;
  [key: string]: unknown;
}

/** Convertisseur **réponse `/exchange` → {@link Ack}** : `ok = status === 'ok'`. */
export class AckConverter {
  toCommon(wire: AckNative): Ack {
    return { ok: wire.status === 'ok', xtras: wire as Record<string, unknown> };
  }
}
