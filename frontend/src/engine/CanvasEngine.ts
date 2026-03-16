import { Observable } from '../patterns/Observable';
import { type ILayerComponent } from '../layers/ILayerComponent';
import { Layer } from '../layers/Layer';
import { LayerGroup } from '../layers/LayerGroup';
import type { ITool } from '../tools/ITool';
import { CanvasAdapter } from '../patterns/CanvasAdapter';
import { ToolFactory, type ToolType } from '../tools/ToolFactory';

export interface EngineState {
    tool: string;
    color: string;
    size: number;
    layerId: string | null;
    layerCount: number;
}

export class CanvasEngine extends Observable<EngineState> {
    private static inst: CanvasEngine | null = null;

    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private tool: ITool;
    private color: string = '#1a1a2e';
    private size: number = 5;
    private opacity: number = 1;
    private down: boolean = false;

    private pendingCommand: null = null;

    private readonly root: LayerGroup;
    private active: Layer | null = null;

    private constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No 2D context');
        this.ctx = ctx;
        this.root = new LayerGroup('Root');
        this.tool = ToolFactory.create('brush');
        this.addLayer('Background');
        this.bindEvents();
    }

    static init(canvas: HTMLCanvasElement): CanvasEngine {
        if (!CanvasEngine.inst) CanvasEngine.inst = new CanvasEngine(canvas);
        return CanvasEngine.inst;
    }

    static getInstance(): CanvasEngine {
        if (!CanvasEngine.inst) throw new Error('Call init() first');
        return CanvasEngine.inst;
    }

    static reset(): void {
        CanvasEngine.inst = null;
    }

    setTool(type: ToolType): void {
        this.tool = ToolFactory.create(type);
        this.canvas.style.cursor = this.tool.cursor;
        this.emit();
    }

    setColor(c: string): void {
        this.color = c;
        this.emit();
    }
    setOpacity(o: number): void {
        this.opacity = Math.max(0.01, Math.min(1, o));
        this.emit();
    }
    setSize(s: number): void {
        this.size = Math.max(1, Math.min(100, s));
        this.emit();
    }

    addLayer(name = 'Layer'): Layer {
        const layer = new Layer(this.canvas.width, this.canvas.height, name);
        this.root.add(layer);
        if (!this.active) this.active = layer;

        if (name === 'Background') {
            layer.getContext().fillStyle = '#ffffff';
            layer.getContext().fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.render();
        this.emit();
        return layer;
    }

    setActiveLayer(id: string): void {
        const found = this.root.getChildren().find((c): c is Layer => c instanceof Layer && c.getId() === id);
        if (found) {
            this.active = found;
            this.emit();
        }
    }

    getLayers(): ILayerComponent[] {
        return this.root.getChildren();
    }

    async exportAs(name: string, fmt: 'png' | 'jpg' | 'json'): Promise<void> {
        await CanvasAdapter.downloadAs(this.canvas, name, fmt, this.getLayers());
    }

    getBase64(): string {
        return CanvasAdapter.toBase64Png(this.canvas);
    }

    getJson(): string {
        return JSON.stringify(CanvasAdapter.toJson(this.canvas, this.getLayers()));
    }

    getCanvasEl(): HTMLCanvasElement {
        return this.canvas;
    }

    private render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.root.renderTo(this.ctx);

        const preview = this.tool.getPreview();
        if (preview !== null) {
            this.ctx.save();
            this.ctx.globalAlpha = preview.opacity;
            this.ctx.drawImage(preview.canvas, 0, 0);
            this.ctx.restore();
        }
    }

    private bindEvents(): void {
        const el = this.canvas;
        el.addEventListener('mousedown', e => this.start(e));
        el.addEventListener('mousemove', e => this.move(e));
        el.addEventListener('mouseup', () => this.end());
        el.addEventListener('mouseleave', () => this.end());
        el.addEventListener(
            'touchstart',
            e => {
                e.preventDefault();
                this.start(e.touches[0] as unknown as MouseEvent);
            },
            { passive: false },
        );
        el.addEventListener(
            'touchmove',
            e => {
                e.preventDefault();
                this.move(e.touches[0] as unknown as MouseEvent);
            },
            { passive: false },
        );
        el.addEventListener('touchend', () => this.end());
    }

    private coords(e: MouseEvent): { x: number; y: number } {
        const r = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) * (this.canvas.width / r.width),
            y: (e.clientY - r.top) * (this.canvas.height / r.height),
        };
    }

    private start(e: MouseEvent): void {
        if (!this.active || this.active.isLocked()) return;
        this.down = true;

        const { x, y } = this.coords(e);
        const layerCtx = this.active.getContext();

        this.pendingCommand = null; // in future change on command

        this.tool.onStart(layerCtx, x, y, this.color, this.size, this.opacity);
        this.render();
    }

    private move(e: MouseEvent): void {
        if (!this.down || !this.active || this.active.isLocked()) return;
        const { x, y } = this.coords(e);
        this.tool.onMove(this.active.getContext(), x, y);
        this.render();
    }

    private end(): void {
        if (!this.down || !this.active) return;
        this.down = false;

        const layerCtx = this.active.getContext();
        this.tool.onEnd(layerCtx);
        this.render();
    }

    private emit(): void {
        this.notify({
            tool: this.tool.name,
            color: this.color,
            size: this.size,
            layerId: this.active?.getId() ?? null,
            layerCount: this.root.getChildren().length,
        });
    }
}
