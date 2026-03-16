import { type ICommand } from './ICommand';

type Snapshot = ImageData;

function snap(ctx: CanvasRenderingContext2D): Snapshot {
    return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
}
function restore(ctx: CanvasRenderingContext2D, s: Snapshot): void {
    ctx.putImageData(s, 0, 0);
}

export class DrawCommand implements ICommand {
    readonly label: string;
    private readonly before: Snapshot;
    private after: Snapshot | null = null;
    private readonly ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D, label: string) {
        this.ctx = ctx;
        this.label = label;
        this.before = snap(ctx);
    }
    commit(): void {
        this.after = snap(this.ctx);
    }

    isCommitted(): boolean {
        return this.after !== null;
    }

    execute(): void {
        if (this.after !== null) {
            restore(this.ctx, this.after);
        }
    }

    undo(): void {
        restore(this.ctx, this.before);
    }

    canMergeWith(_other: ICommand): boolean {
        return false;
    }
}

export class ClearCommand implements ICommand {
    readonly label = 'Clear';
    private readonly before: Snapshot;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly bg: string;

    constructor(ctx: CanvasRenderingContext2D, bg = '#ffffff') {
        this.ctx = ctx;
        this.bg = bg;
        this.before = snap(ctx);
    }

    execute(): void {
        this.ctx.fillStyle = this.bg;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    undo(): void {
        restore(this.ctx, this.before);
    }
}
export class FilterCommand implements ICommand {
    readonly label: string;
    private readonly before: Snapshot;
    private after: Snapshot | null = null;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly applyFn: (d: ImageData) => ImageData;

    constructor(ctx: CanvasRenderingContext2D, applyFn: (d: ImageData) => ImageData, name: string) {
        this.ctx = ctx;
        this.applyFn = applyFn;
        this.label = `Filter: ${name}`;
        this.before = snap(ctx);
    }

    execute(): void {
        if (this.after !== null) {
            restore(this.ctx, this.after);
        } else {
            const current = snap(this.ctx);
            this.after = this.applyFn(current);
            restore(this.ctx, this.after);
        }
    }

    undo(): void {
        restore(this.ctx, this.before);
    }
}
