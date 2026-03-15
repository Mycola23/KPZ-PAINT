export interface ITool {
    readonly name: string;
    readonly cursor: string;

    onStart(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number, opacity: number): void;
    onMove(ctx: CanvasRenderingContext2D, x: number, y: number): void;
    onEnd(ctx: CanvasRenderingContext2D): void;
    getPreview(): { canvas: HTMLCanvasElement; opacity: number } | null;
}
