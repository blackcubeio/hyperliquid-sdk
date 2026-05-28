import { describe, expect, it } from 'vitest';
import { USD_SEND_TYPES, buildUsdSendAction } from '../src/rest/exchange/usd-send';
import { signUserSignedAction } from '../src/rest/signing';

const PRIVATE_KEY = '0x822e9959e022b78423eb653a62ea0020cd283e71a2a8133a6ff2aeffaf373cff';

describe('usdSend (action user-signed)', () => {
  it('buildUsdSendAction + signUserSignedAction reproduit le vecteur connu', () => {
    const action = {
      ...buildUsdSendAction(
        {
          destination: '0x1234567890123456789012345678901234567890',
          amount: '1000',
          time: 1234567890,
        },
        1234567890,
      ),
      hyperliquidChain: 'Mainnet',
    };
    expect(
      signUserSignedAction({ privateKey: PRIVATE_KEY, action, types: USD_SEND_TYPES }),
    ).toEqual({
      r: '0xf777c38efe7c24cc71209526ae608f4e384d0586edf578f0e97b4b9f7c7adcc6',
      s: '0x104a4a97c48ae77bf5bd777bdd45fe72d8f5ff29116b5ff64fd8cfe4ea610786',
      v: 28,
    });
  });
});
