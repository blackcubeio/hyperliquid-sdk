import type { MarketKind } from '../common/types';
import { assetIndex } from '../common/utils';
import { exchangeL1Action } from './client';
import { buildCancelAction } from './exchange/cancel-order';
import { getMeta } from './info/get-meta';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface CancelOrderParams {
  /** Paire/symbole (= `Pair.name`, coin HL). */
  name: string;
  /** ID d'ordre exchange (oid). */
  id: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
}

/** Annule un ordre par `id`/oid (**écriture signée**, HL `/exchange`). */
export function cancelOrder(params: CancelOrderParams, label: string): Promise<void> {
  return getMeta(undefined, label).then((meta) => {
    const asset = assetIndex(meta.universe, params.name);
    return exchangeL1Action(buildCancelAction([{ asset, oid: Number(params.id) }]), label).then(
      () => undefined,
    );
  });
}
