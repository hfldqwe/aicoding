import { ITool } from '../types/tool.js';

export class UniversalMCPAdapter {
    /**
     * Converts an MCP tool definition to our internal ITool interface.
     * @param serverName The namespace for the tool (e.g., "git", "memory")
     * @param mcpTool The raw tool definition from the MCP server
     */
    static adapt(serverName: string, mcpTool: any, executeFn: (args: Record<string, any>) => Promise<any>): ITool {
        // MCP Tool structure: { name, description, inputSchema }
        // Our ITool structure: { name, description, parameters, execute }

        // Ensure name is namespaced to prevent collisions
        const name = `${serverName}__${mcpTool.name}`;

        return {
            name: name,
            description: mcpTool.description || '',
            parameters: mcpTool.inputSchema as any, // Cast to IToolSchema
            execute: async (args: Record<string, any>) => {
                const result = await executeFn(args);
                // Ensure result is string as expected by ITool (or handle JSON)
                // MCP callTool returns CallToolResult { content: ... }
                // We need to serialize it to string for ITool compatibility if needed,
                // or ITool.execute return type might need check.
                // src/types/tool.ts: execute(args): Promise<string>;
                return JSON.stringify(result);
            }
        };
    }
}
