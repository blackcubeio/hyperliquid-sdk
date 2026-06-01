// Vérifie que la **surface publique** (src/index.ts) expose bien tout ce que la doc présente comme
// importable, et que chaque import `{ X } from '@blackcube/hyperliquid-sdk'` des docs compile.
//
// Politique d'export du SDK : seule la classe `Hyperliquid` est exportée comme **valeur** runtime ;
// tout le reste (interfaces de capacités, types d'entrée `…Params`, types de sortie) est exporté en
// `type`. Aucun enum / fonction libre / constante n'est documenté comme importable → aucun autre
// symbole runtime à exposer (HL est le SDK le plus propre sur ce point).

import { describe, expect, it } from 'vitest';
import * as sdk from '../src';
import { Hyperliquid } from '../src';
import type {
  // ── types d'entrée (Params) documentés dans common.md / native.md ──
  AccountHistoryParams,
  // ── types de sortie communs documentés dans common.md ──
  Ack,
  ApproveAgentParams,
  Balance,
  CancelByClientIdLegParams,
  CancelLegParams,
  CancelOrderParams,
  CancelResult,
  Candle,
  CandlesParams,
  Delegation,
  EditOrderParams,
  FundingParams,
  HyperliquidDexOptions,
  // ── interfaces de capacités natives documentées dans native.md ──
  IAgents,
  INativeAccount,
  INativePerp,
  Mid,
  Network,
  Order,
  OrderBook,
  Pair,
  PlaceOrderParams,
  Position,
  Price,
  Side,
  Signer,
  SubAccount,
  TransferParams,
  TwapPlacement,
  Unsubscribe,
} from '../src';

describe('Surface publique (src/index.ts)', () => {
  it('exporte `Hyperliquid` comme valeur runtime (classe instanciable)', () => {
    expect(typeof Hyperliquid).toBe('function');
    expect(typeof sdk.Hyperliquid).toBe('function');
    const dex = new Hyperliquid();
    expect(dex).toBeInstanceOf(Hyperliquid);
  });

  it('expose les scopes RÉELS de la façade (et PAS `system`)', () => {
    const dex = new Hyperliquid();
    // scopes réels documentés (README + common.md + native.md)
    expect(typeof dex.perp).toBe('function');
    expect(typeof dex.spot).toBe('function');
    expect(typeof dex.account).toBe('function');
    expect(typeof dex.transfers).toBe('function');
    expect(typeof dex.helpers).toBe('function');
    expect(typeof dex.ws).toBe('function');
    expect(typeof dex.wsSpot).toBe('function');
    expect(typeof dex.native).toBe('object');
    // namespace native (miroir + capacités propres)
    expect(typeof dex.native.perp).toBe('function');
    expect(typeof dex.native.account).toBe('function');
    expect(typeof dex.native.agents).toBe('function');
    expect(typeof dex.native.subAccounts).toBe('function');
    expect(typeof dex.native.vaults).toBe('function');
    expect(typeof dex.native.staking).toBe('function');
    expect(typeof dex.native.referral).toBe('function');
    expect(typeof dex.native.builders).toBe('function');
    // HL n'a PAS de scope system() (ni ping ni horloge serveur publics)
    expect('system' in dex).toBe(false);
  });

  it('`helpers()` (EVM) répond — seul helper synchrone sans réseau', () => {
    const helpers = new Hyperliquid().helpers();
    expect(typeof helpers.keyTypeOf).toBe('function');
    expect(typeof helpers.privateKeyToAddress).toBe('function');
    expect(typeof helpers.toChecksumAddress).toBe('function');
  });

  it('exerce les types publics (compilation only)', () => {
    // Si l'un de ces types n'était plus exporté, le fichier ne compilerait pas (tsc --noEmit).
    const candlesQuery: CandlesParams = { name: 'BTC', interval: '1h', limit: 10 };
    const placeInput: PlaceOrderParams = {
      name: 'BTC',
      side: 'buy',
      type: 'limit',
      size: '0.001',
      price: '50000',
    };
    const cancelInput: CancelOrderParams = { name: 'BTC', id: '1' };
    const editInput: EditOrderParams = { name: 'BTC', id: '1', side: 'buy', size: '0.002' };
    const fundingQuery: FundingParams = { name: 'BTC' };
    const transferInput: TransferParams = { to: { wallet: 'spot' }, amount: '10' };
    const accountHistory: AccountHistoryParams = { startTime: '2026-05-31 00:00:00' };
    const cancelLeg: CancelLegParams = { name: 'BTC', id: '1' };
    const cancelByCloid: CancelByClientIdLegParams = { name: 'BTC', clientId: '0x1' };
    const network: Network = 'testnet';
    const side: Side = 'buy';
    const options: HyperliquidDexOptions = { default: 'desk' };

    // sorties communes + natives (présence par construction d'objets minimaux typés)
    const unsub: Unsubscribe = () => undefined;
    const ack: Ack = { ok: true, xtras: {} };
    const mid: Mid = { name: 'BTC', mid: '50000' };

    expect(candlesQuery.name).toBe('BTC');
    expect(placeInput.type).toBe('limit');
    expect(cancelInput.id).toBe('1');
    expect(editInput.side).toBe('buy');
    expect(fundingQuery.name).toBe('BTC');
    expect(transferInput.amount).toBe('10');
    expect(accountHistory.startTime).toContain('2026');
    expect(cancelLeg.id).toBe('1');
    expect(cancelByCloid.clientId).toBe('0x1');
    expect(network).toBe('testnet');
    expect(side).toBe('buy');
    expect(options.default).toBe('desk');
    expect(unsub()).toBeUndefined();
    expect(ack.ok).toBe(true);
    expect(mid.mid).toBe('50000');

    // Référence purement type-level (jamais exécutée) pour ancrer les types restants exportés.
    const _typeRefs = (): [
      Signer,
      ApproveAgentParams,
      CancelResult,
      Delegation,
      TwapPlacement,
      Balance,
      Candle,
      Order,
      OrderBook,
      Pair,
      Position,
      Price,
      SubAccount,
      IAgents,
      INativeAccount,
      INativePerp,
    ] => {
      throw new Error('jamais appelé');
    };
    expect(typeof _typeRefs).toBe('function');
  });
});
