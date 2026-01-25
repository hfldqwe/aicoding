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
    };
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
