export interface Signature {
  r: `0x${string}`;
  s: `0x${string}`;
  v: number;
}

export interface Eip712Field {
  name: string;
  type: string;
}

export type Eip712Types = Record<string, readonly Eip712Field[]>;

export interface Eip712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: `0x${string}`;
}
