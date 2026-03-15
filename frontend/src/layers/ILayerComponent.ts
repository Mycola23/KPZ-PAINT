export interface ILayerComponent {
    getId(): string;
    getName(): string;
    setName(name: string): void;
    getOpacity(): number;
    setOpacity(opacity: number): void;
    getBlendMode(): string;
    setBlendMode(mode: string): void;
    isVisible(): boolean;
    setVisible(visible: boolean): void;
    isLocked(): boolean;
    setLocked(locked: boolean): void;
    getCanvas(): HTMLCanvasElement | null;
    renderTo(targetCtx: CanvasRenderingContext2D): void;
    serialize(): object;
}
