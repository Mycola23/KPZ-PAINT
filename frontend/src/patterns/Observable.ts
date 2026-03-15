export class Observable<T = void> {
    private readonly subs = new Map<symbol, (e: T) => void>();

    subscribe(cb: (e: T) => void): () => void {
        const key = Symbol();
        this.subs.set(key, cb);
        return () => this.subs.delete(key);
    }

    protected notify(event: T): void {
        this.subs.forEach(cb => {
            try {
                cb(event);
            } catch (err) {
                console.error('[Observable]', err);
            }
        });
    }

    get subscriberCount(): number {
        return this.subs.size;
    }
    unsubscribeAll(): void {
        this.subs.clear();
    }
}
