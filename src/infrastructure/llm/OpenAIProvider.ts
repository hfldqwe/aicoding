
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { ILLMConfig, ILLMProvider, IStreamChunk } from '../../types/llm.js';
import { IRetryPolicy } from '../../types/common.js';
import { IChatMessage } from '../../types/context.js';

export class OpenAIProvider implements ILLMProvider {
    private openai;
    private modelName: string;

    constructor(private config: ILLMConfig) {
        if (!config.apiKey) {
            throw new Error('OpenAI API Key is required');
        }
        this.openai = createOpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
        });
        this.modelName = config.modelName || 'gpt-4o';
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
                console.error(`Error in OpenAIProvider.chat (Attempt ${attempt + 1}/${maxRetries}):`, error);
                lastError = error;
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, backoff * (attempt + 1))); // Simple exponential backoff
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
                // maxTokens: this.config.maxTokens,
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
            console.error('Error in OpenAIProvider.chatStream:', error);
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
