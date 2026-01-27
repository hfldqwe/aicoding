import { IMCPClientFactory, IMCPClient } from '../types/mcp.js';
import { McpServerConfig } from '../types/config.js';
import { MCPClient } from './MCPClient.js';
import { StdioClientTransport } from './transports/StdioClientTransport.js';
import { SSEClientTransport } from './transports/SSEClientTransport.js';

export class MCPClientFactory implements IMCPClientFactory {

    createClient(name: string, config: McpServerConfig): IMCPClient {
        let transport: any;

        try {
            if (config.type === 'stdio') {
                transport = new StdioClientTransport({
                    command: config.command,
                    args: config.args,
                    env: config.env
                });
            } else if (config.type === 'sse') {
                transport = new SSEClientTransport(new URL(config.url));
            } else {
                throw new Error(`Unknown transport type: ${(config as any).type}`);
            }

            return new MCPClient(name, transport);
        } catch (error) {
            console.error(`[MCP] Failed to create client for ${name}:`, error);
            // Return a dummy client or rethrow? 
            // Constraint: "Must not crash main program".
            // But factory is supposed to return IMCPClient.
            // If we return a broken client, usage might crash.
            // We should probably throw here and catch in the consumer (index.ts) 
            // OR return a NullObject pattern.
            // Given "Strict Self-Review", throwing here is correct for FACTORY, 
            // but consumer must handle it. 
            // However, plan said "Handle fallback logic (log error and continue)".
            throw error;
        }
    }

    /**
     * Creates clients from a config map, gracefully skipping failures.
     */
    createClientsFromConfig(configs: Record<string, McpServerConfig>): IMCPClient[] {
        const clients: IMCPClient[] = [];
        for (const [name, config] of Object.entries(configs)) {
            try {
                const client = this.createClient(name, config);
                clients.push(client);
            } catch (error) {
                console.error(`[MCP] Skipping server '${name}' due to initialization error:`, error);
            }
        }
        return clients;
    }
}
