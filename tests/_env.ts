import { existsSync, readFileSync } from 'node:fs';

/** Lit une variable depuis le `.env` racine (ou les variables d'environnement). undefined si absente. */
export function readEnv(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (fromProcess !== undefined && fromProcess !== '') {
    return fromProcess;
  }
  const url = new URL('../.env', import.meta.url);
  if (existsSync(url) === false) {
    return undefined;
  }
  const line = readFileSync(url, 'utf-8')
    .split('\n')
    .find((entry) => entry.startsWith(`${name}=`));
  if (line === undefined) {
    return undefined;
  }
  const value = line.slice(name.length + 1).trim();
  return value === '' ? undefined : value;
}
