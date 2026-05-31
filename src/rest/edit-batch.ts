import type { HyperliquidClient } from '../common/config';
import type { Order, Tif } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildBatchModifyAction } from './exchange/modify-order';
import { getMeta } from './info/get-meta';

/** Leg de modification d'un lot, au **vocabulaire commun** (remplace l'ordre `id`). */
export interface EditBatchLeg {
  /** ID de l'ordre exchange (oid) à modifier. */
  id: string;
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Sens (HL remplace l'ordre entier). */
  side: 'buy' | 'sell';
  /** Nouvelle quantité (chaîne décimale). */
  size: string;
  /** Nouveau prix (chaîne décimale). */
  price: string;
  /** Time-in-force ; défaut `gtc`. */
  tif?: 'gtc' | 'ioc' | 'fok' | 'alo';
  /** Reduce-only. */
  reduceOnly?: boolean;
  /** Client order id (bytes16 hex `0x…`). */
  clientId?: string;
}

const TIF: Record<'gtc' | 'ioc' | 'fok' | 'alo', Tif> = {
  gtc: 'Gtc',
  ioc: 'Ioc',
  fok: 'Ioc',
  alo: 'Alo',
};

interface BatchResponse {
  response?: { data?: { statuses?: { resting?: { oid: number }; filled?: { oid: number } }[] } };
}

/**
 * Modifie un **lot** d'ordres au format unifié (écriture signée, HL `batchModify`, 1 action). Entrée
 * = legs en **vocabulaire commun** (`id`/`name`/`side`/`size`/`price`) ; sortie = `Order[]` (type
 * commun), 1 `Order` par leg, `id`/`status`/`filled` dérivés de la réponse — **même normalisation que
 * `placeBatch`**.
 */
export function editBatchOrders(
  client: HyperliquidClient,
  legs: EditBatchLeg[],
  label: string,
): Promise<Order[]> {
  return getMeta(client, undefined, label).then((meta) => {
    const modifies = legs.map((leg) => ({
      oid: Number(leg.id),
      order: {
        asset: assetIndex(meta.universe, leg.name),
        isBuy: leg.side === 'buy',
        price: leg.price,
        size: leg.size,
        reduceOnly: leg.reduceOnly,
        tif: TIF[leg.tif ?? 'gtc'],
        cloid: leg.clientId as `0x${string}` | undefined,
      },
    }));
    return exchangeL1Action<BatchResponse>(client, buildBatchModifyAction(modifies), label).then(
      (res) => {
        const statuses = res.response?.data?.statuses ?? [];
        return legs.map((leg, i) => {
          const status = statuses[i];
          const oid = status?.resting?.oid ?? status?.filled?.oid;
          return {
            name: leg.name,
            kind: 'perp' as const,
            id: oid === undefined ? leg.id : String(oid),
            clientId: leg.clientId ?? null,
            side: leg.side,
            type: 'limit' as const,
            price: leg.price,
            size: leg.size,
            filled: status?.filled === undefined ? '0' : leg.size,
            status: status?.filled === undefined ? ('open' as const) : ('filled' as const),
            tif: leg.tif ?? 'gtc',
            reduceOnly: leg.reduceOnly ?? null,
            time: Date.now(),
            xtras: { status },
          };
        });
      },
    );
  });
}
