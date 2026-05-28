import { describe, expect, it } from 'vitest';
import { createL1ActionHash, signL1Action, signUserSignedAction } from '../src/rest/signing';

// Vecteurs de référence : nktkas/hyperliquid tests/signing/mod.test.ts.
const PRIVATE_KEY = '0x822e9959e022b78423eb653a62ea0020cd283e71a2a8133a6ff2aeffaf373cff';
const ACTION = {
  type: 'order',
  orders: [{ a: 0, b: true, p: '30000', s: '0.1', r: false, t: { limit: { tif: 'Gtc' } } }],
  grouping: 'na',
};
const NONCE = 1234567890;
const VAULT = '0x1234567890123456789012345678901234567890' as const;
const EXPIRES = 1234567890;

describe('createL1ActionHash', () => {
  it('base', () => {
    expect(createL1ActionHash({ action: ACTION, nonce: NONCE })).toBe(
      '0x25367e0dba84351148288c2233cd6130ed6cec5967ded0c0b7334f36f957cc90',
    );
  });
  it('avec vaultAddress', () => {
    expect(createL1ActionHash({ action: ACTION, nonce: NONCE, vaultAddress: VAULT })).toBe(
      '0x214e2ea3270981b6fd18174216691e69f56872663139d396b10ded319cb4bb1e',
    );
  });
  it('avec expiresAfter', () => {
    expect(createL1ActionHash({ action: ACTION, nonce: NONCE, expiresAfter: EXPIRES })).toBe(
      '0xc30b002ba3775e4c31c43c1dfd3291dfc85c6ae06c6b9f393991de86cad5fac7',
    );
  });
  it('avec les deux', () => {
    expect(
      createL1ActionHash({
        action: ACTION,
        nonce: NONCE,
        vaultAddress: VAULT,
        expiresAfter: EXPIRES,
      }),
    ).toBe('0x2d62412aa0fc57441b5189841d81554a6a9680bf07204e1454983a9ca44f0744');
  });
});

describe('signL1Action', () => {
  it('mainnet', () => {
    expect(signL1Action({ privateKey: PRIVATE_KEY, action: ACTION, nonce: NONCE })).toEqual({
      r: '0x61078d8ffa3cb591de045438a1ae2ed299b271891d1943a33901e7cfb3a31ed8',
      s: '0x0e91df4f9841641d3322dad8d932874b74d7e082cdb5b533f804964a6963aef9',
      v: 28,
    });
  });
  it('testnet', () => {
    expect(
      signL1Action({ privateKey: PRIVATE_KEY, action: ACTION, nonce: NONCE, isTestnet: true }),
    ).toEqual({
      r: '0x6b0283a894d87b996ad0182b86251cc80d27d61ef307449a2ed249a508ded1f7',
      s: '0x6f884e79f4a0a10af62db831af6f8e03b3f11d899eb49b352f836746ee9226da',
      v: 27,
    });
  });
});

describe('signUserSignedAction', () => {
  it('usdSend', () => {
    const action = {
      hyperliquidChain: 'Mainnet',
      signatureChainId: '0x66eee',
      destination: '0x1234567890123456789012345678901234567890',
      amount: '1000',
      time: 1234567890,
    } as const;
    const types = {
      'HyperliquidTransaction:UsdSend': [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'destination', type: 'string' },
        { name: 'amount', type: 'string' },
        { name: 'time', type: 'uint64' },
      ],
    };
    expect(signUserSignedAction({ privateKey: PRIVATE_KEY, action, types })).toEqual({
      r: '0xf777c38efe7c24cc71209526ae608f4e384d0586edf578f0e97b4b9f7c7adcc6',
      s: '0x104a4a97c48ae77bf5bd777bdd45fe72d8f5ff29116b5ff64fd8cfe4ea610786',
      v: 28,
    });
  });
});
