import { type ITool } from './ITool';
// ====== helper ========
function createOffscreen(source: HTMLCanvasElement): HTMLCanvasElement {
    const off = document.createElement('canvas');
    off.width = source.width;
    off.height = source.height;
    return off;
}

// ======= basic class  =======
abstract class OffscreenTool implements ITool {
    abstract readonly name: string;
    abstract readonly cursor: string;

    protected isDrawing = false;
    protected opacity = 1;
    protected off: HTMLCanvasElement | null = null;
    protected offCtx: CanvasRenderingContext2D | null = null;

    abstract onStart(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number, opacity: number): void;

    abstract onMove(ctx: CanvasRenderingContext2D, x: number, y: number): void;

    onEnd(ctx: CanvasRenderingContext2D): void {
        if (!this.isDrawing || !this.off) return;
        this.isDrawing = false;
        this.commitOffscreen(ctx);
        this.off = null;
        this.offCtx = null;
    }

    protected commitOffscreen(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(this.off!, 0, 0);
        ctx.restore();
    }

    getPreview(): { canvas: HTMLCanvasElement; opacity: number } | null {
        if (!this.isDrawing || !this.off) return null;
        return { canvas: this.off, opacity: this.opacity };
    }
    protected initOffscreen(source: HTMLCanvasElement): void {
        this.off = createOffscreen(source);
        this.offCtx = this.off.getContext('2d')!;
    }
}

export class BrushTool extends OffscreenTool {
    public readonly name = 'Brush';
    public readonly cursor = 'crosshair';

    private lastX = 0;
    private lastY = 0;

    onStart(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number, opacity: number): void {
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
        this.opacity = opacity;
        this.initOffscreen(ctx.canvas);

        this.offCtx!.strokeStyle = color;
        this.offCtx!.fillStyle = color;
        this.offCtx!.lineWidth = size;
        this.offCtx!.lineCap = 'round';
        this.offCtx!.lineJoin = 'round';

        // first point
        this.offCtx!.beginPath();
        this.offCtx!.arc(x, y, size / 2, 0, Math.PI * 2);
        this.offCtx!.fill();
    }

    onMove(_ctx: CanvasRenderingContext2D, x: number, y: number): void {
        if (!this.isDrawing || !this.offCtx) return;
        this.offCtx.beginPath();
        this.offCtx.moveTo(this.lastX, this.lastY);
        this.offCtx.lineTo(x, y);
        this.offCtx.stroke();
        this.lastX = x;
        this.lastY = y;
    }
}

export class EraserTool extends OffscreenTool {
    public readonly name = 'Eraser';
    public readonly cursor = 'cell';

    private lastX = 0;
    private lastY = 0;
    private brushSize = 10;

    onStart(ctx: CanvasRenderingContext2D, x: number, y: number, _color: string, size: number, opacity: number): void {
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
        this.opacity = opacity;
        this.brushSize = size * 2;

        this.initOffscreen(ctx.canvas);
        this.offCtx!.strokeStyle = '#000000';
        this.offCtx!.fillStyle = '#000000';
        this.offCtx!.lineWidth = this.brushSize;
        this.offCtx!.lineCap = 'round';

        this.offCtx!.beginPath();
        this.offCtx!.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
        this.offCtx!.fill();
    }

    onMove(_ctx: CanvasRenderingContext2D, x: number, y: number): void {
        if (!this.isDrawing || !this.offCtx) return;
        this.offCtx.beginPath();
        this.offCtx.moveTo(this.lastX, this.lastY);
        this.offCtx.lineTo(x, y);
        this.offCtx.stroke();
        this.lastX = x;
        this.lastY = y;
    }

    protected commitOffscreen(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(this.off!, 0, 0);
        ctx.restore();
    }
}

export class LineTool implements ITool {
    public readonly name = 'Line';
    public readonly cursor = 'crosshair';

    private startX = 0;
    private startY = 0;
    private isDrawing = false;
    private snapshot: ImageData | null = null;
    private color = '#000000';
    private size = 2;
    private opacity = 1;

    onStart(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number, opacity: number): void {
        this.isDrawing = true;
        this.startX = x;
        this.startY = y;
        this.color = color;
        this.size = size;
        this.opacity = opacity;
        this.snapshot = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    onMove(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        if (!this.isDrawing || !this.snapshot) return;
        ctx.putImageData(this.snapshot, 0, 0);
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
    }

    onEnd(_ctx: CanvasRenderingContext2D): void {
        this.isDrawing = false;
        this.snapshot = null;
    }

    getPreview(): null {
        return null;
    }
}

export class RectangleTool implements ITool {
    public readonly name = 'Rectangle';
    public readonly cursor = 'crosshair';

    private startX = 0;
    private startY = 0;
    private isDrawing = false;
    private snapshot: ImageData | null = null;
    private color = '#000000';
    private size = 2;
    private opacity = 1;

    onStart(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number, opacity: number): void {
        this.isDrawing = true;
        this.startX = x;
        this.startY = y;
        this.color = color;
        this.size = size;
        this.opacity = opacity;
        this.snapshot = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    onMove(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        if (!this.isDrawing || !this.snapshot) return;
        ctx.putImageData(this.snapshot, 0, 0);
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size;
        ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
        ctx.restore();
    }

    onEnd(_ctx: CanvasRenderingContext2D): void {
        this.isDrawing = false;
        this.snapshot = null;
    }

    getPreview(): null {
        return null;
    }
}

export class CircleTool implements ITool {
    public readonly name = 'Circle';
    public readonly cursor = 'crosshair';

    private startX = 0;
    private startY = 0;
    private isDrawing = false;
    private snapshot: ImageData | null = null;
    private color = '#000000';
    private size = 2;
    private opacity = 1;

    onStart(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number, opacity: number): void {
        this.isDrawing = true;
        this.startX = x;
        this.startY = y;
        this.color = color;
        this.size = size;
        this.opacity = opacity;
        this.snapshot = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    onMove(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        if (!this.isDrawing || !this.snapshot) return;
        ctx.putImageData(this.snapshot, 0, 0);
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size;
        const radiusX = Math.abs(x - this.startX) / 2;
        const radiusY = Math.abs(y - this.startY) / 2;
        const centerX = this.startX + (x - this.startX) / 2;
        const centerY = this.startY + (y - this.startY) / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    onEnd(_ctx: CanvasRenderingContext2D): void {
        this.isDrawing = false;
        this.snapshot = null;
    }

    getPreview(): null {
        return null;
    }
}

export class FillTool implements ITool {
    public readonly name = 'Fill';
    public readonly cursor = 'copy';
    private static readonly COLOR_TOLERANCE = 30;

    onStart(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, _size: number, opacity: number): void {
        this.floodFill(ctx, Math.round(x), Math.round(y), color, opacity);
    }

    onMove(): void {}
    onEnd(): void {}
    getPreview(): null {
        return null;
    }

    private floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string, opacity: number): void {
        const { width, height } = ctx.canvas;
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        const startIndex = (startY * width + startX) * 4;
        const targetColor: number[] = [pixels[startIndex], pixels[startIndex + 1], pixels[startIndex + 2], pixels[startIndex + 3]];

        const fillRgba = FillTool.hexToRgba(fillColor, opacity);
        if (FillTool.colorsMatch(targetColor, fillRgba)) return;

        const visited = new Uint8Array(width * height);
        const queue: [number, number][] = [[startX, startY]];

        while (queue.length > 0) {
            const [cx, cy] = queue.shift()!;
            if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

            const li = cy * width + cx;
            if (visited[li]) continue;

            const pi = li * 4;
            const currentColor = [pixels[pi], pixels[pi + 1], pixels[pi + 2], pixels[pi + 3]];
            if (!FillTool.colorsMatch(currentColor, targetColor)) continue;

            visited[li] = 1;
            pixels[pi] = fillRgba[0];
            pixels[pi + 1] = fillRgba[1];
            pixels[pi + 2] = fillRgba[2];
            pixels[pi + 3] = fillRgba[3];

            queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
    }

    private static hexToRgba(hex: string, opacity: number): [number, number, number, number] {
        const c = hex.replace('#', '');
        return [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16), Math.round(opacity * 255)];
    }

    private static colorsMatch(a: number[], b: number[]): boolean {
        return (
            Math.abs(a[0] - b[0]) <= FillTool.COLOR_TOLERANCE &&
            Math.abs(a[1] - b[1]) <= FillTool.COLOR_TOLERANCE &&
            Math.abs(a[2] - b[2]) <= FillTool.COLOR_TOLERANCE &&
            Math.abs(a[3] - b[3]) <= FillTool.COLOR_TOLERANCE
        );
    }
}
