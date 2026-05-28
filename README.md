# @blackcube/hyperliquid-sdk

TypeScript SDK for the [Hyperliquid](https://hyperliquid.xyz) exchange (perpetuals & spot DEX).

Covers the REST `info` (reads) and `exchange` (signed actions) endpoints, WebSocket
subscriptions, and EIP-712 request signing. Node.js (≥22) and browser-safe (crypto via `@noble`).

> Status: early development. Built on the same mould as `@blackcube/pacifica-sdk`.

## Install

```sh
pnpm add @blackcube/hyperliquid-sdk
```

## Scripts

- `pnpm build` — bundle (ESM + CJS + `.d.ts`) via tsup
- `pnpm test` — Vitest (real testnet, no mocks)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — Biome

## License

BSD-3-Clause
