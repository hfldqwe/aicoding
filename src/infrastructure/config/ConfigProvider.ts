
import { IConfig, IConfigProvider } from '../../types/config.js';
import dotenv from 'dotenv';
import path from 'path';

export class ConfigProvider implements IConfigProvider {
    private config: IConfig | null = null;

    async load(): Promise<IConfig> {
        // Load .env file
        dotenv.config();

        this.config = {
            workspaceRoot: process.cwd(),
            llm: {
                provider: (process.env.AICODING_PROVIDER as 'openai' | 'anthropic' | 'local') || 'openai',
                model: process.env.AICODING_MODEL || 'gpt-4o',
                apiKey: process.env.AICODING_API_KEY,
                baseUrl: process.env.AICODING_BASE_URL,
            },
            security: {
                allowShellCommands: process.env.AICODING_ALLOW_SHELL === 'true',
                confirmDangerousTools: process.env.AICODING_CONFIRM_DANGEROUS !== 'false', // Default to true
            }
        };

        return this.config;
    }

    get<K extends keyof IConfig>(key: K): IConfig[K] {
        if (!this.config) {
            throw new Error('Config not loaded. Call load() first.');
        }
        return this.config[key];
    }
}
