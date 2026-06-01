/**
 * Coalescing + throttling des messages d'abonnement/désabonnement d'une socket Hyperliquid.
 *
 * Version **généralisée** du `SubscriptionBatcher` d'Aster (même surface publique : `subscribe`,
 * `unsubscribe`, `resubscribe`, `setOpen`, `reset`). Le format de wire HL n'est pas le
 * `{ method, params, id }` de Binance : on passe donc des **fabriques de frame** (`buildSub` /
 * `buildUnsub`) au lieu de coder les méthodes en dur.
 *
 * HL accepte ~2000 messages/minute par connexion ; un abonnement massif (« tous les perps »)
 * émis sans throttle peut faire bannir. Ce batcher accumule les souscriptions sur un micro-tick
 * et émet **un** message par lot (`chunk` clés, défaut 1 pour HL : 1 subscription par message),
 * espacés de `intervalMs` (défaut 60 ms ≈ 16/s, sûr sous le plafond).
 */
export class SubscriptionBatcher {
  private readonly pendingSub = new Set<string>();
  private readonly pendingUnsub = new Set<string>();
  private readonly outbox: string[] = [];
  private flushScheduled = false;
  private draining = false;
  private open = false;

  /**
   * @param rawSend    Émet une frame déjà sérialisée sur la socket.
   * @param buildSub   Fabrique la frame d'abonnement à partir des clés (HL : 1 clé).
   * @param buildUnsub Fabrique la frame de désabonnement à partir des clés (HL : 1 clé).
   * @param chunk      Nombre max de clés par message (HL : 1).
   * @param intervalMs Espacement minimal entre deux messages.
   */
  constructor(
    private readonly rawSend: (frame: string) => void,
    private readonly buildSub: (names: string[]) => unknown,
    private readonly buildUnsub: (names: string[]) => unknown,
    private readonly chunk = 1,
    private readonly intervalMs = 60,
  ) {}

  /** Marque une clé à souscrire (annule un unsubscribe en attente de la même). */
  public subscribe(name: string): void {
    this.pendingUnsub.delete(name);
    this.pendingSub.add(name);
    this.schedule();
  }

  /** Marque une clé à désouscrire (annule un subscribe en attente de la même). */
  public unsubscribe(name: string): void {
    this.pendingSub.delete(name);
    this.pendingUnsub.add(name);
    this.schedule();
  }

  /** Ré-souscrit en masse (reconnexion) : rejoue toutes les clés encore suivies. */
  public resubscribe(names: Iterable<string>): void {
    for (const name of names) {
      this.pendingUnsub.delete(name);
      this.pendingSub.add(name);
    }
    this.schedule();
  }

  /** Bascule l'état de la socket : à l'ouverture, on draine la file (throttlée). */
  public setOpen(isOpen: boolean): void {
    this.open = isOpen;
    if (isOpen === true) {
      this.pump();
    }
  }

  /** Vide la file d'envoi (socket fermée) ; les clés suivies sont rejouées via `resubscribe`. */
  public reset(): void {
    this.outbox.length = 0;
    this.draining = false;
  }

  private schedule(): void {
    if (this.flushScheduled === true) {
      return;
    }
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      this.flush();
    });
  }

  private flush(): void {
    this.enqueue(this.buildUnsub, this.pendingUnsub);
    this.pendingUnsub.clear();
    this.enqueue(this.buildSub, this.pendingSub);
    this.pendingSub.clear();
  }

  private enqueue(build: (names: string[]) => unknown, names: Set<string>): void {
    const all = [...names];
    for (let i = 0; i < all.length; i += this.chunk) {
      const slice = all.slice(i, i + this.chunk);
      this.outbox.push(JSON.stringify(build(slice)));
    }
    this.pump();
  }

  private pump(): void {
    if (this.draining === true || this.open === false || this.outbox.length === 0) {
      return;
    }
    this.draining = true;
    const frame = this.outbox.shift() as string;
    this.rawSend(frame);
    setTimeout(() => {
      this.draining = false;
      this.pump();
    }, this.intervalMs);
  }
}
