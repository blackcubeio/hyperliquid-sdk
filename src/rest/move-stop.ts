import type { HyperliquidClient } from '../common/config';
import type { MarketKind } from '../common/types';
import { exchangeL1Action } from './client';
import { buildModifyAction } from './exchange/modify-order';
import { resolveAsset } from './info/resolve-asset';

/** Params internes : déplace un SL `stopMarket` reduce-only en place via l'action `modify`. */
export interface MoveStopOrderParams {
  name: string;
  /** oid du SL courant à remplacer. */
  stopId: string;
  /** Sens de l'ordre SL (opposé à la position). */
  exitIsBuy: boolean;
  triggerPrice: string;
  price: string;
  size: string;
  kind?: MarketKind;
}

/**
 * Déplace un SL (`stopMarket` reduce-only) EN PLACE : action `modify` avec le wire `trigger` reconstruit
 * (`buildOrderWire` produit un `trigger` dès que `triggerPx` est défini). Atomique côté HL — la position n'est
 * jamais sans SL. HL répond `{type:'default'}` SANS le nouvel oid (et le `modify` peut réémettre un oid) :
 * on renvoie l'oid CIBLÉ ; l'appelant qui a besoin du SL courant relit `getOpens`.
 */
export function moveStopOrder(
  client: HyperliquidClient,
  params: MoveStopOrderParams,
  label: string,
): Promise<{ name: string; id: string }> {
  return resolveAsset(client, params.name, params.kind ?? 'perp', label).then((asset) => {
    return exchangeL1Action(
      client,
      buildModifyAction({
        oid: Number(params.stopId),
        order: {
          asset,
          isBuy: params.exitIsBuy,
          price: params.price,
          size: params.size,
          reduceOnly: true,
          triggerPx: params.triggerPrice,
          isMarket: true,
          tpsl: 'sl',
        },
      }),
      label,
    ).then(() => ({ name: params.name, id: params.stopId }));
  });
}
