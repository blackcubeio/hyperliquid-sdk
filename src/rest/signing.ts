import { encode as encodeMsgpack } from '@msgpack/msgpack';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, concatBytes, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import type { Eip712Domain, Eip712Types, Signature } from '../common/types';

type Action = Record<string, unknown> | unknown[];

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

const DOMAIN_TYPE: Eip712Types = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ],
};

/**
 * Normalise une valeur pour que `@msgpack/msgpack` produise les mêmes octets que
 * le backend Hyperliquid (et le SDK Python) : retire les `undefined` (sinon encodés
 * en nil au lieu d'être omis) et élargit les entiers hors plage int32 en `BigInt`
 * (sinon encodés en float64 au lieu de int64). Le hash dépend de l'ordre des clés.
 */
function adjust(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(adjust);
  }
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const entry = (value as Record<string, unknown>)[key];
      if (entry !== undefined) {
        result[key] = adjust(entry);
      }
    }
    return result;
  }
  if (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    (value >= 0x100000000 || value < -0x80000000)
  ) {
    return BigInt(value);
  }
  return value;
}

function uint64Bytes(n: number | bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(n));
  return bytes;
}

function bigintToBytes32(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let remaining = value;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}

/**
 * Hash keccak256 d'une action L1 : `msgpack(action) + nonce(u64 BE) + vaultMarker +
 * expiresMarker?`. Iso `action_hash` du SDK Python.
 */
export function createL1ActionHash(args: {
  action: Action;
  nonce: number;
  vaultAddress?: `0x${string}`;
  expiresAfter?: number;
}): `0x${string}` {
  const { action, nonce, vaultAddress, expiresAfter } = args;
  const parts: Uint8Array[] = [
    encodeMsgpack(adjust(action), { useBigInt64: true }),
    uint64Bytes(nonce),
  ];
  if (vaultAddress === undefined) {
    parts.push(new Uint8Array([0]));
  } else {
    parts.push(new Uint8Array([1]), hexToBytes(vaultAddress.slice(2)));
  }
  if (expiresAfter !== undefined) {
    parts.push(new Uint8Array([0]), uint64Bytes(expiresAfter));
  }
  return `0x${bytesToHex(keccak_256(concatBytes(...parts)))}`;
}

function encodeType(primaryType: string, types: Eip712Types): string {
  // Les types Hyperliquid sont plats (aucune struct imbriquée) : pas de résolution de dépendances.
  const fields = types[primaryType] ?? [];
  return `${primaryType}(${fields.map((f) => `${f.type} ${f.name}`).join(',')})`;
}

function encodeField(type: string, value: unknown): Uint8Array {
  if (type === 'string') {
    return keccak_256(utf8ToBytes(value as string));
  }
  if (type === 'bytes32') {
    return hexToBytes((value as string).slice(2));
  }
  if (type === 'address') {
    const out = new Uint8Array(32);
    out.set(hexToBytes((value as string).slice(2)), 12);
    return out;
  }
  if (type === 'bool') {
    const out = new Uint8Array(32);
    out[31] = value ? 1 : 0;
    return out;
  }
  if (type.startsWith('uint') || type.startsWith('int')) {
    return bigintToBytes32(BigInt(value as number | bigint | string));
  }
  throw new Error(`Type EIP-712 non supporté : ${type}`);
}

function hashStruct(
  primaryType: string,
  types: Eip712Types,
  data: Record<string, unknown>,
): Uint8Array {
  const parts: Uint8Array[] = [keccak_256(utf8ToBytes(encodeType(primaryType, types)))];
  for (const field of types[primaryType] ?? []) {
    parts.push(encodeField(field.type, data[field.name]));
  }
  return keccak_256(concatBytes(...parts));
}

function hashTypedData(
  domain: Eip712Domain,
  types: Eip712Types,
  primaryType: string,
  message: Record<string, unknown>,
): Uint8Array {
  const domainSeparator = hashStruct(
    'EIP712Domain',
    DOMAIN_TYPE,
    domain as unknown as Record<string, unknown>,
  );
  const structHash = hashStruct(primaryType, types, message);
  return keccak_256(concatBytes(new Uint8Array([0x19, 0x01]), domainSeparator, structHash));
}

function signDigest(digest: Uint8Array, privateKey: `0x${string}`): Signature {
  const sig = secp256k1.sign(digest, hexToBytes(privateKey.slice(2)));
  return {
    r: `0x${bytesToHex(bigintToBytes32(sig.r))}`,
    s: `0x${bytesToHex(bigintToBytes32(sig.s))}`,
    v: sig.recovery + 27,
  };
}

/**
 * Signe une action L1 (order, cancel, modify…) : hash → EIP-712 domaine `Exchange`
 * (chainId 1337), type `Agent { source, connectionId }`, `source` = 'a' (mainnet) / 'b' (testnet).
 */
export function signL1Action(args: {
  privateKey: `0x${string}`;
  action: Action;
  nonce: number;
  isTestnet?: boolean;
  vaultAddress?: `0x${string}`;
  expiresAfter?: number;
}): Signature {
  const { privateKey, action, nonce, isTestnet = false, vaultAddress, expiresAfter } = args;
  const connectionId = createL1ActionHash({ action, nonce, vaultAddress, expiresAfter });
  const digest = hashTypedData(
    { name: 'Exchange', version: '1', chainId: 1337, verifyingContract: ZERO_ADDRESS },
    {
      Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' },
      ],
    },
    'Agent',
    { source: isTestnet ? 'b' : 'a', connectionId },
  );
  return signDigest(digest, privateKey);
}

/**
 * Signe une action user-signed (usdSend, withdraw3, approveAgent…) : EIP-712 domaine
 * `HyperliquidSignTransaction`, chainId = `signatureChainId` de l'action, types fournis.
 */
export function signUserSignedAction(args: {
  privateKey: `0x${string}`;
  action: Record<string, unknown> & { signatureChainId: `0x${string}` };
  types: Eip712Types;
}): Signature {
  const { privateKey, action, types } = args;
  const primaryType = Object.keys(types)[0];
  if (primaryType === undefined) {
    throw new Error('types EIP-712 vide');
  }
  const digest = hashTypedData(
    {
      name: 'HyperliquidSignTransaction',
      version: '1',
      chainId: Number.parseInt(action.signatureChainId, 16),
      verifyingContract: ZERO_ADDRESS,
    },
    types,
    primaryType,
    action,
  );
  return signDigest(digest, privateKey);
}

/** Adresse EVM (0x, minuscules) dérivée d'une clé privée secp256k1. */
export function privateKeyToAddress(privateKey: `0x${string}`): `0x${string}` {
  const publicKey = secp256k1.getPublicKey(hexToBytes(privateKey.slice(2)), false);
  return `0x${bytesToHex(keccak_256(publicKey.slice(1)).slice(12))}`;
}
