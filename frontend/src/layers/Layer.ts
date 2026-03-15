import { type ILayerComponent } from './ILayerComponent';
import { Observable } from '../patterns/Observable';

export interface LayerChangedEvent {
    layerId: string;
    type: 'visibility' | 'opacity' | 'blendMode' | 'lock' | 'rename';
}

export class Layer extends Observable<LayerChangedEvent> implements ILayerComponent {
    private readonly id: string;
    private name: string;
    private opacity: number;
    private blendMode: string;
    private visible: boolean;
    private locked: boolean;

    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;

    constructor(width: number, height: number, name: string = 'Layer') {
        super();

        this.id = Layer.generateId();
        this.name = name;
        this.opacity = 100;
        this.blendMode = 'source-over';
        this.visible = true;
        this.locked = false;

        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;

        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Cannot get 2D context for layer canvas.');
        this.ctx = context;
    }

    getId(): string {
        return this.id;
    }
    getName(): string {
        return this.name;
    }
    getOpacity(): number {
        return this.opacity;
    }
    getBlendMode(): string {
        return this.blendMode;
    }
    isVisible(): boolean {
        return this.visible;
    }
    isLocked(): boolean {
        return this.locked;
    }

    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }

    setName(name: string): void {
        this.name = name;
        this.notify({ layerId: this.id, type: 'rename' });
    }

    setOpacity(opacity: number): void {
        this.opacity = Math.max(0, Math.min(100, opacity));
        this.notify({ layerId: this.id, type: 'opacity' });
    }

    setBlendMode(mode: string): void {
        this.blendMode = mode;
        this.notify({ layerId: this.id, type: 'blendMode' });
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        this.notify({ layerId: this.id, type: 'visibility' });
    }

    setLocked(locked: boolean): void {
        this.locked = locked;
        this.notify({ layerId: this.id, type: 'lock' });
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderTo(targetCtx: CanvasRenderingContext2D): void {
        if (!this.visible) return;

        targetCtx.save();
        targetCtx.globalAlpha = this.opacity / 100;
        targetCtx.globalCompositeOperation = this.blendMode as GlobalCompositeOperation;
        targetCtx.drawImage(this.canvas, 0, 0);
        targetCtx.restore();
    }

    serialize(): object {
        return {
            type: 'layer',
            id: this.id,
            name: this.name,
            opacity: this.opacity,
            blendMode: this.blendMode,
            visible: this.visible,
            locked: this.locked,
            imageData: this.canvas.toDataURL('image/png'),
        };
    }

    private static generateId(): string {
        return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
}
