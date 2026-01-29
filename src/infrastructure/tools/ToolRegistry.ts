
import { IToolRegistry, ITool } from '../../types/tool.js';

import { FileSystemTool } from './FileSystemTool.js';
import { WorkspaceTool } from './WorkspaceTool.js';
import { RunCommandTool } from './RunCommandTool.js';
import { LoadSkillTool } from './LoadSkillTool.js';

export class ToolRegistry implements IToolRegistry {
    private tools: Map<string, ITool> = new Map();

    register(tool: ITool): void {
        if (this.tools.has(tool.name)) {
            console.warn(`Tool ${tool.name} is already registered. Overwriting.`);
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
