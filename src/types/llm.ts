import { IChatMessage } from './context';

export interface ILLMConfig {
    apiKey: string;
    modelName: string;
    temperature?: number;
    maxTokens?: number;
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
