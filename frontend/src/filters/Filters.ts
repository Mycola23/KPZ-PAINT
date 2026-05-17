import type { IFilter } from './IFilter';

function clone(d: ImageData): ImageData {
    return new ImageData(new Uint8ClampedArray(d.data), d.width, d.height);
}
const Grayscale = {
    R: 0.299,
    G: 0.587,
    B: 0.114,
} as const;

export class GrayscaleFilter implements IFilter {
    readonly name = 'Grayscale';

    private static readonly R = Grayscale.R;
    private static readonly G = Grayscale.G;
    private static readonly B = Grayscale.B;

    apply(imageData: ImageData): ImageData {
        const out = clone(imageData);
        for (let i = 0; i < out.data.length; i += 4) {
            const g = GrayscaleFilter.R * out.data[i] + GrayscaleFilter.G * out.data[i + 1] + GrayscaleFilter.B * out.data[i + 2];
            out.data[i] = out.data[i + 1] = out.data[i + 2] = g;
        }
        return out;
    }
}

export class InvertFilter implements IFilter {
    readonly name = 'Invert';
    private static readonly MAX = 255;

    apply(data: ImageData): ImageData {
        const out = clone(data);
        for (let i = 0; i < out.data.length; i += 4) {
            out.data[i] = InvertFilter.MAX - out.data[i];
            out.data[i + 1] = InvertFilter.MAX - out.data[i + 1];
            out.data[i + 2] = InvertFilter.MAX - out.data[i + 2];
        }
        return out;
    }
}

export class SepiaFilter implements IFilter {
    readonly name = 'Sepia';

    // Стандартні коефіцієнти сепії 
    private static readonly COEFF = {
        rR: 0.393, rG: 0.769, rB: 0.189,
        gR: 0.349, gG: 0.686, gB: 0.168,
        bR: 0.272, bG: 0.534, bB: 0.131,
    } as const;

    apply(imageData: ImageData): ImageData {
        const out = clone(imageData);
        const c = SepiaFilter.COEFF;
        for (let i = 0; i < out.data.length; i += 4) {
            const r = out.data[i], g = out.data[i + 1], b = out.data[i + 2];
            out.data[i]     = Math.min(255, r * c.rR + g * c.rG + b * c.rB);
            out.data[i + 1] = Math.min(255, r * c.gR + g * c.gG + b * c.gB);
            out.data[i + 2] = Math.min(255, r * c.bR + g * c.bG + b * c.bB);
        }
        return out;
    }
}

export class BrightnessFilter implements IFilter {
    readonly name: string;
    private readonly delta: number;

    constructor(delta: number) {
        this.delta = Math.max(-255, Math.min(255, delta));
        this.name = `Brightness ${delta > 0 ? '+' : ''}${delta}`;
    }

    apply(data: ImageData): ImageData {
        const out = clone(data);
        for (let i = 0; i < out.data.length; i += 4) {
            out.data[i] = Math.max(0, Math.min(255, out.data[i] + this.delta));
            out.data[i + 1] = Math.max(0, Math.min(255, out.data[i + 1] + this.delta));
            out.data[i + 2] = Math.max(0, Math.min(255, out.data[i + 2] + this.delta));
        }
        return out;
    }
}
