import { type ITool } from './ITool';
import { BrushTool, EraserTool, LineTool, RectangleTool, CircleTool, FillTool } from './Tools';

export type ToolType = 'brush' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'fill';

export class ToolFactory {
    private static readonly registry = new Map<ToolType, () => ITool>([
        ['brush', () => new BrushTool()],
        ['eraser', () => new EraserTool()],
        ['line', () => new LineTool()],
        ['rectangle', () => new RectangleTool()],
        ['circle', () => new CircleTool()],
        ['fill', () => new FillTool()],
    ]);

    public static create(toolType: ToolType): ITool {
        const creator = ToolFactory.registry.get(toolType);
        if (!creator) {
            throw new Error(`[ToolFactory] Unknown tool: "${toolType}". Register it first.`);
        }
        return creator();
    }

    public static register(type: ToolType, creator: () => ITool): void {
        ToolFactory.registry.set(type, creator);
    }

    public static getAvailableTools(): ToolType[] {
        return Array.from(ToolFactory.registry.keys());
    }
}
