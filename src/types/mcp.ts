import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { IDisposable } from './common.js';
import { McpServerConfig } from './config.js';

export interface IMCPClient extends IDisposable {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getTools(): Promise<any[]>; // Will refine return type based on SDK
    getServerVersion(): Promise<string | undefined>;
    name: string;
}

export interface IMCPClientFactory {
    createClient(name: string, config: McpServerConfig): IMCPClient;
}
