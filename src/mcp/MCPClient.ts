import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { IMCPClient } from '../types/mcp.js';
import { UniversalMCPAdapter } from './UniversalMCPAdapter.js';
import { ITool } from '../types/tool.js';

export class MCPClient implements IMCPClient {
    private client: Client;

    constructor(
        public name: string,
        transport: any
    ) {
        this.client = new Client(
            {
                name: "aicoding-client",
                version: "1.0.0",
            },
            {
                capabilities: {},
            }
        );
        // We defer connection to connect() method, but we need to store transport?
        // Actually Client.connect(transport) is how it works.
        // So we store transport in a private property.
        this._transport = transport;
    }

    private _transport: any;

    async connect(): Promise<void> {
        await this.client.connect(this._transport);
    }

    async disconnect(): Promise<void> {
        await this.client.close();
    }

    async getTools(): Promise<ITool[]> {
        const result = await this.client.listTools();
        return result.tools.map(tool =>
            UniversalMCPAdapter.adapt(this.name, tool, async (args) => {
                return this.client.callTool({
                    name: tool.name,
                    arguments: args
                });
            })
        );
    }

    async getServerVersion(): Promise<string | undefined> {
        // SDK might not expose server version directly in easy property, 
        // but we can assume it's connected.
        return this.client.getServerVersion?.()?.version;
    }

    async dispose(): Promise<void> {
        await this.disconnect();
    }
}
