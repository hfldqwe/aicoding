
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../../src/core/llm-provider.js';
import * as ai from 'ai';

// Mock the 'ai' module
vi.mock('ai', () => ({
    generateText: vi.fn(),
    streamText: vi.fn()
}));

// Mock @ai-sdk/openai
vi.mock('@ai-sdk/openai', () => ({
    createOpenAI: vi.fn(() => (modelName: string) => ({ modelName }))
}));

describe('OpenAIProvider', () => {
    let provider: OpenAIProvider;
    const mockConfig = {
        apiKey: 'test-key',
        modelName: 'gpt-4-test'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        provider = new OpenAIProvider(mockConfig);
    });

    it('should initialize correctly', () => {
        expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should throw error if apiKey is missing', () => {
        expect(() => new OpenAIProvider({ ...mockConfig, apiKey: '' })).toThrow('OpenAI API Key is required');
    });

    it('should call generateText for chat', async () => {
        const mockResponse = { text: 'Hello, world!' };
        vi.mocked(ai.generateText).mockResolvedValue(mockResponse as any);

        const messages = [{ role: 'user', content: 'Hi' } as any];
        const response = await provider.chat(messages);

        expect(response).toBe('Hello, world!');
        expect(ai.generateText).toHaveBeenCalledWith(expect.objectContaining({
            model: expect.anything(),
            messages: messages,
            temperature: undefined
        }));
    });

    it('should stream text correctly', async () => {
        const mockStream = {
            textStream: (async function* () {
                yield 'Hello';
                yield ' ';
                yield 'World';
            })()
        };
        vi.mocked(ai.streamText).mockReturnValue(mockStream as any);

        const messages = [{ role: 'user', content: 'Hi' } as any];
        const chunks = [];

        for await (const chunk of provider.chatStream(messages)) {
            chunks.push(chunk);
        }

        expect(chunks.length).toBe(4); // 3 text chunks + 1 completion chunk
        expect(chunks[0]).toEqual({ content: 'Hello', isCompleted: false });
        expect(chunks[2]).toEqual({ content: 'World', isCompleted: false });
        expect(chunks[3]).toEqual({ content: '', isCompleted: true });
    });

    it('healthCheck should return true on success', async () => {
        vi.mocked(ai.generateText).mockResolvedValue({ text: 'pong' } as any);
        const result = await provider.healthCheck();
        expect(result).toBe(true);
    });

    it('healthCheck should return false on failure', async () => {
        vi.mocked(ai.generateText).mockRejectedValue(new Error('API Error'));
        const result = await provider.healthCheck();
        expect(result).toBe(false);
    });
});
