import { infoRequest } from '../client';

export interface SpotToken {
  name: string;
  szDecimals: number;
  weiDecimals: number;
  index: number;
  tokenId: string;
  isCanonical: boolean;
  evmContract: string | null;
  fullName: string | null;
}

export interface SpotPair {
  name: string;
  /** `[baseTokenIndex, quoteTokenIndex]`. */
  tokens: [number, number];
  index: number;
  isCanonical: boolean;
}

export interface SpotMeta {
  tokens: SpotToken[];
  universe: SpotPair[];
}

/** Métadonnées du marché spot (tokens + paires). L'asset ID spot d'une paire = `10000 + index`. */
export function getSpotMeta(label?: string): Promise<SpotMeta> {
  return infoRequest<SpotMeta>({ type: 'spotMeta' }, label);
}
