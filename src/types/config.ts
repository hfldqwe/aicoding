export interface IConfig {
    workspaceRoot: string;
    llm: {
        provider: 'openai' | 'anthropic' | 'local';
        model: string;
        apiKey?: string;
        baseUrl?: string;
    };
    security: {
        allowShellCommands: boolean;
        confirmDangerousTools: boolean;
        dangerousCommands: string[];
    };
    mcpServers: Record<string, McpServerConfig>;
}

export type McpServerConfig = StdioServerConfig | SseServerConfig;

export interface StdioServerConfig {
    type: 'stdio';
    command: string;
    args: string[];
    env?: Record<string, string>;
}

export interface SseServerConfig {
    type: 'sse';
    url: string;
}

export interface IConfigProvider {
    /**
     * Loads config from disk or environment.
     */
    load(): Promise<IConfig>;

    /**
     * Gets a specific config value.
     */
    get<K extends keyof IConfig>(key: K): IConfig[K];
}
