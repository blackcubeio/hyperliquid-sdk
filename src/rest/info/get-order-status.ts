import { infoRequest } from '../client';

export interface OrderStatusResponse {
  /** "order" si trouvé, sinon "unknownOid". */
  status: string;
  order?: unknown;
}

/** Statut d'un ordre par `oid` (number) ou client order ID (hex). */
export function getOrderStatus(
  params: {
    user: `0x${string}`;
    oid: number | `0x${string}`;
  },
  label?: string,
): Promise<OrderStatusResponse> {
  return infoRequest<OrderStatusResponse>(
    {
      type: 'orderStatus',
      user: params.user,
      oid: params.oid,
    },
    label,
  );
}
