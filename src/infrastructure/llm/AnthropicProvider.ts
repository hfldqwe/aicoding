import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { ILLMConfig, ILLMProvider, IStreamChunk } from '../../types/llm.js';
import { IRetryPolicy } from '../../types/common.js';
import { IChatMessage } from '../../types/context.js';

/**
 * Anthropic Claude Provider 实现
 * 使用 Vercel AI SDK 的 @ai-sdk/anthropic 包
 */
export class AnthropicProvider implements ILLMProvider {
    private anthropic;
    private modelName: string;

    constructor(private config: ILLMConfig) {
        if (!config.apiKey) {
            throw new Error('Anthropic API Key is required');
        }
        this.anthropic = createAnthropic({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
        });
        // 默认使用 Claude 3.5 Sonnet
        this.modelName = config.modelName || 'claude-3-5-sonnet-20241022';
    }

    async chat(messages: IChatMessage[], retryPolicy?: IRetryPolicy): Promise<string> {
        const maxRetries = retryPolicy?.maxRetries || 3;
        const backoff = retryPolicy?.backoffMs || 1000;
        let lastError: any;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const { text } = await generateText({
                    model: this.anthropic.chat(this.modelName),
                    messages: this.convertMessages(messages),
                    temperature: this.config.temperature,
                    stopSequences: ['Observation:'],
                });
                return text;
            } catch (error) {
                console.error(`Error in AnthropicProvider.chat (Attempt ${attempt + 1}/${maxRetries}):`, error);
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
                model: this.anthropic.chat(this.modelName),
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
            console.error('Error in AnthropicProvider.chatStream:', error);
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
