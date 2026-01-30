import { IChatMessage } from './context.js';
import { LLMProviderType } from './config.js';

export interface ILLMConfig {
    apiKey: string;
    modelName: string;
    temperature?: number;
    maxTokens?: number;
    baseURL?: string;
    // Provider 类型
    provider?: LLMProviderType;
    // 额外的选项
    options?: Record<string, unknown>;
}

/**
 * Stream payload chunk.
 */
export interface IStreamChunk {
    content: string;
    isCompleted: boolean;
}

/**
 * Abstraction layer for different LLM providers (OpenAI, Anthropic, etc.).
 */
export interface ILLMProvider {
    /**
     * Sends a unified chat request to the underlying model.
     */
    chat(messages: IChatMessage[]): Promise<string>;

    /**
     * Streams the response for real-time UI feedback.
     */
    chatStream(messages: IChatMessage[]): AsyncIterable<IStreamChunk>;

    /**
     * Checks if the provider configuration is valid and reachable.
     */
    healthCheck(): Promise<boolean>;
}
