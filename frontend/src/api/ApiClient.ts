export interface DrawingListItem {
    id: number;
    title: string;
    thumbnail: string | null;
    width: number;
    height: number;
    updated_at: string;
}

export interface DrawingFull extends DrawingListItem {
    canvas_json: string;
    file_path: string | null;
}

export interface SavePayload {
    title: string;
    canvas_json: string;
    image_base64?: string;
    width?: number;
    height?: number;
}

export class ApiClient {
    private readonly base: string;
    private static readonly RETRIES = 2;

    constructor(base = '/api') {
        this.base = base.replace(/\/$/, '');
    }

    async list(): Promise<DrawingListItem[]> {
        const r = await this.req<{ drawings: DrawingListItem[] }>('GET', '/drawings');
        return r.drawings;
    }

    async get(id: number): Promise<DrawingFull | null> {
        try {
            const r = await this.req<{ drawing: DrawingFull }>('GET', `/drawings/${id}`);
            return r.drawing;
        } catch {
            return null;
        }
    }

    async save(p: SavePayload): Promise<number> {
        const r = await this.req<{ id: number }>('POST', '/drawings', p);
        return r.id;
    }

    async update(id: number, p: Partial<SavePayload>): Promise<void> {
        await this.req('PUT', `/drawings/${id}`, p);
    }

    async del(id: number): Promise<void> {
        await this.req('DELETE', `/drawings/${id}`);
    }

    autosave(json: string, title: string): void {
        try {
            localStorage.setItem(
                'paint_autosave',
                JSON.stringify({
                    json,
                    title,
                    ts: new Date().toISOString(),
                }),
            );
        } catch {}
    }

    loadAutosave(): { json: string; title: string; ts: string } | null {
        try {
            return JSON.parse(localStorage.getItem('paint_autosave') ?? 'null');
        } catch {
            return null;
        }
    }

    clearAutosave(): void {
        localStorage.removeItem('paint_autosave');
    }

    // helpers

    private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
        const opts: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            credentials: 'include',
        };
        if (body && method !== 'GET') opts.body = JSON.stringify(body);

        let err: Error = new Error('Network error');
        for (let i = 0; i <= ApiClient.RETRIES; i++) {
            try {
                const res = await fetch(this.base + path, opts);
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error ?? `HTTP ${res.status}`);
                return data.data as T;
            } catch (e) {
                err = e as Error;
                if (i < ApiClient.RETRIES) await new Promise(r => setTimeout(r, 400 * (i + 1)));
            }
        }
        throw err;
    }
}
