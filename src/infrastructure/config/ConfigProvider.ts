
import { IConfig, IConfigProvider } from '../../types/config.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const CONFIG_FILE_NAME = 'aicoding.json';
const CONFIG_DIR_NAME = '.aicoding';

export class ConfigProvider implements IConfigProvider {
    private config: IConfig | null = null;

    async load(): Promise<IConfig> {
        // Load .env file
        dotenv.config();

        // Load config from file if exists (in ~/aicoding/aicoding.json)
        let fileConfig: Partial<IConfig> = {};
        const configPath = path.join(os.homedir(), CONFIG_DIR_NAME, CONFIG_FILE_NAME);

        try {
            const content = await fs.readFile(configPath, 'utf-8');
            fileConfig = JSON.parse(content);
        } catch (error: any) {
            // Ignore if file not found, but log syntax errors?
            if (error.code !== 'ENOENT') {
                console.warn(`Warning: Failed to parse ${CONFIG_FILE_NAME}:`, error.message);
            }
        }

        this.config = {
            workspaceRoot: process.cwd(),
            llm: {
                provider: (process.env.AICODING_PROVIDER as any) || fileConfig.llm?.provider || 'openai',
                model: process.env.AICODING_MODEL || fileConfig.llm?.model || 'gpt-4o',
                apiKey: process.env.AICODING_API_KEY || fileConfig.llm?.apiKey,
                baseUrl: process.env.AICODING_BASE_URL || fileConfig.llm?.baseUrl,
                options: fileConfig.llm?.options,
            },
            security: {
                allowShellCommands: process.env.AICODING_ALLOW_SHELL === 'true' || fileConfig.security?.allowShellCommands || false,
                confirmDangerousTools: process.env.AICODING_CONFIRM_DANGEROUS !== 'false', // Default to true, env takes precedence for safety? 
                // Actually let's assume env overrides file for safety toggles
                dangerousCommands: process.env.AICODING_DANGEROUS_COMMANDS
                    ? process.env.AICODING_DANGEROUS_COMMANDS.split(',')
                    : (fileConfig.security?.dangerousCommands || [
                        '^rm ', '^mv ', '^git push', '^npm publish', '^pnpm publish', '^yarn publish',
                        '>', '>>', '\\|', ';', '&', // 包含重定向和多命令符的可能是风险
                    ]),
            },
            mcpServers: fileConfig.mcpServers || {}
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
