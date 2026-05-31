/**
 * Résultat **par leg** d'une annulation par lot (`cancelMany`/`cancelManyByClientId`). HL répond
 * `{ status:'ok', response:{ data:{ statuses:[ 'success' | { error } ] } } }` (1 statut par leg, dans
 * l'ordre de l'entrée). On expose un type **nommé** aligné sur le vocabulaire commun (`id`/`clientId`)
 * + `status` lisible ; le statut natif reste dans `xtras`.
 */
export interface CancelResult {
  /** ID d'ordre exchange (oid) ciblé ; `null` si l'annulation visait un `clientId`. */
  id: string | null;
  /** Client order id ciblé ; `null` si l'annulation visait un `id`. */
  clientId: string | null;
  /** `ok` si HL a accepté l'annulation de ce leg, sinon `error`. */
  status: 'ok' | 'error';
  /** Statut natif du leg (`'success'` ou `{ error }`). */
  xtras: Record<string, unknown>;
}

/** Statut natif d'un leg : `'success'` ou `{ error: string }`. */
export type CancelLegNative = 'success' | { error: string } | Record<string, unknown>;

/** Réponse native d'une annulation par lot. */
export interface CancelManyNative {
  response?: { data?: { statuses?: CancelLegNative[] } };
  [key: string]: unknown;
}

/** Référence d'un leg d'entrée (pour reporter `id`/`clientId` dans le résultat). */
export interface CancelLegRef {
  id: string | null;
  clientId: string | null;
}

/**
 * Convertisseur **annulation par lot → `CancelResult[]`** : associe chaque statut natif au leg
 * d'entrée correspondant (par position).
 */
export class CancelConverter {
  toCommon(wire: CancelManyNative, refs: CancelLegRef[]): CancelResult[] {
    const statuses = wire.response?.data?.statuses ?? [];
    return refs.map((ref, i) => {
      const native = statuses[i];
      return {
        id: ref.id,
        clientId: ref.clientId,
        status: native === 'success' ? 'ok' : 'error',
        xtras: { status: native },
      };
    });
  }
}
