/**
 * Defines the structure of the tool's input parameters (JSON Schema draft).
 */
export interface IToolSchema {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
}

export interface ITool {
    name: string;
    description: string;
    parameters: IToolSchema;

    /**
     * Executes the tool with validated arguments.
     */
    execute(args: Record<string, any>): Promise<string>;
}

export interface IToolRegistry {
    register(tool: ITool): void;
    get(name: string): ITool | undefined;
    getAll(): ITool[];

    /**
     * Returns the OpenAI-compatible tool definitions.
     */
    getDefinitions(): any[];
}
