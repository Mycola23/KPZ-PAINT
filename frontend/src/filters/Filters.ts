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
