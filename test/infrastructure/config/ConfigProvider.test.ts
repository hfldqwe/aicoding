import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigProvider } from '../../../src/infrastructure/config/ConfigProvider.js';
import { IConfig } from '../../../src/types/config.js';

// Mock dotenv to prevent loading .env file
vi.mock('dotenv', () => ({
    default: {
        config: vi.fn(),
    },
}));

describe('ConfigProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should load configuration from environment variables', async () => {
        process.env.AICODING_API_KEY = 'test-api-key';
        process.env.AICODING_MODEL = 'gpt-4-test';
        process.env.AICODING_PROVIDER = 'openai';

        const provider = new ConfigProvider();
        const config = await provider.load();

        expect(config.llm.apiKey).toBe('test-api-key');
        expect(config.llm.model).toBe('gpt-4-test');
        expect(config.llm.provider).toBe('openai');
    });

    it('should use default values when environment variables are missing', async () => {
        delete process.env.AICODING_API_KEY;
        delete process.env.AICODING_MODEL;
        delete process.env.AICODING_PROVIDER;

        const provider = new ConfigProvider();
        const config = await provider.load();

        expect(config.llm.provider).toBe('openai'); // Default
        expect(config.llm.model).toBe('gpt-4o'); // Default
        expect(config.workspaceRoot).toBeDefined();
    });

    it('should allow retrieving specific config values via get()', async () => {
        process.env.AICODING_MODEL = 'claude-3-opus';
        const provider = new ConfigProvider();
        await provider.load();

        const llmConfig = provider.get('llm');
        expect(llmConfig.model).toBe('claude-3-opus');
    });
});
