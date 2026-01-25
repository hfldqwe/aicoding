
import { ITool, IToolRegistry } from '../types/tool';

export class ToolRegistry implements IToolRegistry {
    private tools: Map<string, ITool> = new Map();

    register(tool: ITool): void {
        if (this.tools.has(tool.name)) {
            console.warn(`Tool with name ${tool.name} is already registered. Overwriting.`);
        }
        this.tools.set(tool.name, tool);
    }

    get(name: string): ITool | undefined {
        return this.tools.get(name);
    }

    getAll(): ITool[] {
        return Array.from(this.tools.values());
    }

    getDefinitions(): any[] {
        return this.getAll().map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        }));
    }
}
