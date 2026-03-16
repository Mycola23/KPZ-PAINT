import { Observable } from '../patterns/Observable';
import { type ILayerComponent } from './ILayerComponent';
import { type LayerChangedEvent } from './Layer';

export class LayerGroup extends Observable<LayerChangedEvent> implements ILayerComponent {
    private readonly id: string;
    private name: string;
    private opacity: number;
    private blendMode: string;
    private visible: boolean;
    private locked: boolean;

    private readonly children: ILayerComponent[] = [];

    constructor(name: string = 'Group') {
        super();
        this.id = `group_${Date.now()}`;
        this.name = name;
        this.opacity = 100;
        this.blendMode = 'source-over';
        this.visible = true;
        this.locked = false;
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

    getCanvas(): null {
        return null;
    }

    setName(name: string): void {
        this.name = name;
    }
    setOpacity(opacity: number): void {
        this.opacity = Math.max(0, Math.min(100, opacity));
    }
    setBlendMode(mode: string): void {
        this.blendMode = mode;
    }
    setVisible(visible: boolean): void {
        this.visible = visible;
    }
    setLocked(locked: boolean): void {
        this.locked = locked;
    }

    add(child: ILayerComponent): void {
        this.children.push(child);
        this.notify({ layerId: this.id, type: 'visibility' });
    }

    remove(childId: string): void {
        const index = this.children.findIndex(c => c.getId() === childId);
        if (index !== -1) {
            this.children.splice(index, 1);
            this.notify({ layerId: this.id, type: 'visibility' });
        }
    }

    getChildren(): ILayerComponent[] {
        return [...this.children];
    }

    renderTo(targetCtx: CanvasRenderingContext2D): void {
        if (!this.visible) return;

        targetCtx.save();
        targetCtx.globalAlpha = this.opacity / 100;
        for (const child of this.children) {
            child.renderTo(targetCtx);
        }

        targetCtx.restore();
    }

    serialize(): object {
        return {
            type: 'group',
            id: this.id,
            name: this.name,
            opacity: this.opacity,
            blendMode: this.blendMode,
            visible: this.visible,
            locked: this.locked,
            children: this.children.map(child => child.serialize()),
        };
    }
}
