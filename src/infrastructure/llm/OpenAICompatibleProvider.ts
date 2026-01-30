import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { ILLMConfig, ILLMProvider, IStreamChunk } from '../../types/llm.js';
import { IRetryPolicy } from '../../types/common.js';
import { IChatMessage } from '../../types/context.js';

/**
 * OpenAI 兼容模式 Provider
 * 用于支持所有提供 OpenAI 兼容 API 的厂商，如：
 * - DeepSeek
 * - 阿里通义千问
 * - 百度文心一言
 * - 本地模型 (Ollama, LM Studio)
 * - 其他 OpenAI 兼容服务
 */
export class OpenAICompatibleProvider implements ILLMProvider {
    private openai;
    private modelName: string;

    constructor(
        private config: ILLMConfig,
        private options?: {
            baseURL?: string;
            defaultModel?: string;
        }
    ) {
        if (!config.apiKey && !options?.baseURL?.includes('localhost')) {
            throw new Error('API Key is required for non-local providers');
        }

        const baseURL = options?.baseURL || config.baseURL;

        this.openai = createOpenAI({
            apiKey: config.apiKey || 'sk-no-key-required',
            baseURL: baseURL,
        });

        this.modelName = config.modelName || options?.defaultModel || 'gpt-4o';
    }

    async chat(messages: IChatMessage[], retryPolicy?: IRetryPolicy): Promise<string> {
        const maxRetries = retryPolicy?.maxRetries || 3;
        const backoff = retryPolicy?.backoffMs || 1000;
        let lastError: any;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const { text } = await generateText({
                    model: this.openai.chat(this.modelName),
                    messages: this.convertMessages(messages),
                    temperature: this.config.temperature,
                    stopSequences: ['Observation:'],
                });
                return text;
            } catch (error) {
                console.error(`Error in OpenAICompatibleProvider.chat (Attempt ${attempt + 1}/${maxRetries}):`, error);
                lastError = error;
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, backoff * (attempt + 1)));
                }
            }
        }
        throw lastError;
    }

    async *chatStream(messages: IChatMessage[]): AsyncIterable<IStreamChunk> {
        try {
            const result = streamText({
                model: this.openai.chat(this.modelName),
                messages: this.convertMessages(messages),
                temperature: this.config.temperature,
            });

            for await (const textPart of result.textStream) {
                yield {
                    content: textPart,
                    isCompleted: false
                };
            }

            yield {
                content: '',
                isCompleted: true
            };

        } catch (error) {
            console.error('Error in OpenAICompatibleProvider.chatStream:', error);
            throw error;
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.chat([{ role: 'user', content: 'ping' }]);
            return true;
        } catch (e) {
            return false;
        }
    }

    private convertMessages(messages: IChatMessage[]): any[] {
        return messages.map(m => ({
            role: m.role,
            content: m.content
        }));
    }
}
