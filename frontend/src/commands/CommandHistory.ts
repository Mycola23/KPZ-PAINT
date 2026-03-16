import { type ICommand } from './ICommand';
import { Observable } from '../patterns/Observable';
export interface HistoryState {
    canUndo: boolean;
    canRedo: boolean;
    undoLabel: string | null;
    redoLabel: string | null;
}
export class CommandHistory extends Observable<HistoryState> {
    private readonly undoStack: ICommand[] = [];
    private readonly redoStack: ICommand[] = [];
    private static readonly MAX_SIZE = 50;

    execute(cmd: ICommand): void {
        cmd.execute();
        this.pushToUndo(cmd);
        this.redoStack.length = 0;
        this.emit();
    }

    push(cmd: ICommand): void {
        this.pushToUndo(cmd);
        this.redoStack.length = 0;
        this.emit();
    }

    undo(): boolean {
        const cmd = this.undoStack.pop();
        if (!cmd) return false;
        cmd.undo();
        this.redoStack.push(cmd);
        this.emit();
        return true;
    }

    redo(): boolean {
        const cmd = this.redoStack.pop();
        if (!cmd) return false;
        cmd.execute();
        this.undoStack.push(cmd);
        this.emit();
        return true;
    }

    canUndo(): boolean {
        return this.undoStack.length > 0;
    }
    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    clear(): void {
        this.undoStack.length = 0;
        this.redoStack.length = 0;
        this.emit();
    }

    private pushToUndo(cmd: ICommand): void {
        if (this.undoStack.length >= CommandHistory.MAX_SIZE) {
            this.undoStack.shift();
        }
        this.undoStack.push(cmd);
    }

    private emit(): void {
        this.notify({
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            undoLabel: this.undoStack.at(-1)?.label ?? null,
            redoLabel: this.redoStack.at(-1)?.label ?? null,
        });
    }
}
