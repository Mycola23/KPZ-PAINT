import { type ILayerComponent } from '../layers/ILayerComponent';

export class CanvasAdapter {
    private static readonly EXPORT_BG = '#ffffff';
    private static flattenWithBg(source: HTMLCanvasElement, bg = CanvasAdapter.EXPORT_BG): HTMLCanvasElement {
        const flat = document.createElement('canvas');
        flat.width = source.width;
        flat.height = source.height;

        const ctx = flat.getContext('2d')!;

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, flat.width, flat.height);
        ctx.drawImage(source, 0, 0);

        return flat;
    }

    static toBase64Png(canvas: HTMLCanvasElement): string {
        return CanvasAdapter.flattenWithBg(canvas).toDataURL('image/png');
    }

    static toBase64Jpg(canvas: HTMLCanvasElement): string {
        return CanvasAdapter.flattenWithBg(canvas).toDataURL('image/jpeg', 0.92);
    }

    static toJson(canvas: HTMLCanvasElement, layers: ILayerComponent[], bg = '#ffffff'): object {
        return {
            version: '1.0',
            width: canvas.width,
            height: canvas.height,
            background: bg,
            layers: layers.map(l => ({
                id: l.getId(),
                name: l.getName(),
                opacity: l.getOpacity(),
                visible: l.isVisible(),
                imageData: l.getCanvas()?.toDataURL('image/png') ?? '',
            })),
            savedAt: new Date().toISOString(),
        };
    }

    static async downloadAs(
        canvas: HTMLCanvasElement,
        filename: string,
        format: 'png' | 'jpg' | 'json',
        layers: ILayerComponent[] = [],
    ): Promise<void> {
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(CanvasAdapter.toJson(canvas, layers), null, 2)], { type: 'application/json' });
            CanvasAdapter.triggerDownload(blob, `${filename}.json`);
            return;
        }

        const flat = CanvasAdapter.flattenWithBg(canvas);
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';

        const blob = await new Promise<Blob>((res, rej) => {
            flat.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), mime, 0.92);
        });

        CanvasAdapter.triggerDownload(blob, `${filename}.${format}`);
    }

    private static triggerDownload(blob: Blob, name: string): void {
        const url = URL.createObjectURL(blob);
        const link = Object.assign(document.createElement('a'), { href: url, download: name });
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
