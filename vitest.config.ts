import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Les tests d'intégration partagent les mêmes comptes testnet réels :
    // exécution séquentielle pour éviter que les read-back de solde/état
    // soient faussés par des opérations concurrentes.
    fileParallelism: false,
    // docs/blackcube/ref contient les SDK de référence (nktkas) avec leurs propres
    // tests Deno/jsr : on ne les exécute pas.
    exclude: [...configDefaults.exclude, 'docs/**'],
  },
});
