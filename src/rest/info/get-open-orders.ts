/** Ordre ouvert natif HL (`openOrders`) — type consommé par `getOpenOrders` unifié. */
export interface OpenOrder {
  coin: string;
  limitPx: string;
  oid: number;
  side: string;
  sz: string;
  timestamp: number;
  origSz?: string;
  cloid?: string;
}
