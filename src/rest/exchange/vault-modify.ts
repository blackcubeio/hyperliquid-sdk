import type { HyperliquidClient } from '../../common/config';
import { exchangeL1Action } from '../client';

/** Construit l'action L1 `vaultModify` (`null` = réglage inchangé). */
export function buildVaultModifyAction(params: {
  vaultAddress: `0x${string}`;
  allowDeposits: boolean | null;
  alwaysCloseOnWithdraw: boolean | null;
}): Record<string, unknown> {
  return {
    type: 'vaultModify',
    vaultAddress: params.vaultAddress,
    allowDeposits: params.allowDeposits,
    alwaysCloseOnWithdraw: params.alwaysCloseOnWithdraw,
  };
}

/** Modifie les réglages d'un vault (signé, `/exchange`). */
export function vaultModify<TResponse = unknown>(
  client: HyperliquidClient,
  params: {
    vaultAddress: `0x${string}`;
    allowDeposits?: boolean | null;
    alwaysCloseOnWithdraw?: boolean | null;
  },
  label: string,
): Promise<TResponse> {
  return exchangeL1Action<TResponse>(
    client,
    buildVaultModifyAction({
      vaultAddress: params.vaultAddress,
      allowDeposits: params.allowDeposits ?? null,
      alwaysCloseOnWithdraw: params.alwaysCloseOnWithdraw ?? null,
    }),
    label,
  );
}
