export interface IFilter {
    readonly name: string;
    apply(imageData: ImageData): ImageData;
}
