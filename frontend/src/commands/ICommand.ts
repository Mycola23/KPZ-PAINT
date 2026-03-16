export interface ICommand {
    readonly label: string;
    execute(): void;
    undo(): void;
    canMergeWith?(other: ICommand): boolean;
    mergeWith?(other: ICommand): void;
}
