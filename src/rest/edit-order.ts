import type { MarketKind, Side } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildModifyAction } from './exchange/modify-order';
import { getMeta } from './info/get-meta';

/**
 * Paramètres unifiés. HL **remplace l'ordre entier** lors d'une modification → `side` requis
 * (contrairement à Aster/Pacifica qui ne changent que prix/quantité).
 */
export interface EditOrderParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** Sens (requis côté HL — l'ordre est remplacé). */
  side: Side;
  /** Nouvelle quantité. */
  size: string;
  /** Nouveau prix. */
  price: string;
  /** ID d'ordre exchange (oid). */
  id: string;
  /** Reduce-only. */
  reduceOnly?: boolean;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
}

/** Résultat unifié d'une modification d'ordre (référence du nouvel ordre). */
export interface EditOrderResult {
  name: string;
  id: string;
  xtras?: Record<string, unknown>;
}

/** Modifie un ordre existant (**écriture signée**, HL `/exchange` — remplace l'ordre). */
export function editOrder(params: EditOrderParams, label: string): Promise<EditOrderResult> {
  return getMeta(undefined, label).then((meta) => {
    const asset = assetIndex(meta.universe, params.name);
    return exchangeL1Action(
      buildModifyAction({
        oid: Number(params.id),
        order: {
          asset,
          isBuy: params.side === 'buy',
          price: params.price,
          size: params.size,
          reduceOnly: params.reduceOnly,
          tif: 'Gtc',
        },
      }),
      label,
    ).then((response) => ({ name: params.name, id: params.id, xtras: { response } }));
  });
}
