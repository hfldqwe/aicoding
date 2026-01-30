import { generateText, streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { ILLMConfig, ILLMProvider, IStreamChunk } from '../../types/llm.js';
import { IRetryPolicy } from '../../types/common.js';
import { IChatMessage } from '../../types/context.js';
import {
    IToolDefinition,
    IToolCall,
    IToolResult,
    IToolCallingLLMProvider
} from '../../types/toolCalling.js';

/**
 * 支持工具调用的 OpenAI Provider
 * 使用 Vercel AI SDK 的 generateText/streamText 工具调用功能
 */
export class OpenAIProviderWithTools implements ILLMProvider, IToolCallingLLMProvider {
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

    /**
     * 标准聊天（不带工具）- ILLMProvider 接口
     */
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
                });
                return text;
            } catch (error) {
                console.error(`Error in OpenAIProviderWithTools.chat (Attempt ${attempt + 1}/${maxRetries}):`, error);
                lastError = error;
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, backoff * (attempt + 1)));
                }
            }
        }
        throw lastError;
    }

    /**
     * 带工具调用的聊天 - IToolCallingLLMProvider 接口
     */
    async chatWithTools(
        messages: IChatMessage[],
        tools: IToolDefinition[]
    ): Promise<{ content?: string; toolCalls?: IToolCall[] }> {
        // 转换工具定义为 Vercel AI SDK 格式
        const vercelTools: Record<string, any> = {};
        for (const t of tools) {
            vercelTools[t.name] = tool({
                description: t.description,
                parameters: t.parameters as any,
            });
        }

        const result = await generateText({
            model: this.openai.chat(this.modelName),
            messages: this.convertMessages(messages),
            tools: vercelTools,
            temperature: this.config.temperature,
        });

        // 转换 Vercel AI SDK 的工具调用结果为统一格式
        const toolCalls: IToolCall[] = result.toolCalls?.map(tc => ({
            id: tc.toolCallId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: tc.toolName,
            arguments: tc.args as Record<string, unknown>,
        })) || [];

        return {
            content: result.text,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        };
    }

    /**
     * 流式响应（不带工具）- ILLMProvider 接口
     */
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
            console.error('Error in OpenAIProviderWithTools.chatStream:', error);
            throw error;
        }
    }

    /**
     * 带工具调用的流式响应 - IToolCallingLLMProvider 接口
     */
    async *chatWithToolsStream(
        messages: IChatMessage[],
        tools: IToolDefinition[]
    ): AsyncIterable<{
        contentDelta?: string;
        toolCallDelta?: Partial<IToolCall>;
        isComplete?: boolean;
    }> {
        // 转换工具定义
        const vercelTools: Record<string, any> = {};
        for (const t of tools) {
            vercelTools[t.name] = tool({
                description: t.description,
                parameters: t.parameters as any,
            });
        }

        const result = streamText({
            model: this.openai.chat(this.modelName),
            messages: this.convertMessages(messages),
            tools: vercelTools,
            temperature: this.config.temperature,
        });

        // 注意：Vercel AI SDK 的 streamText 对工具调用的流式支持
        // 可能需要根据具体 SDK 版本调整实现
        for await (const chunk of result.fullStream) {
            if (chunk.type === 'text-delta') {
                yield { contentDelta: chunk.textDelta };
            } else if (chunk.type === 'tool-call') {
                yield {
                    toolCallDelta: {
                        id: chunk.toolCallId,
                        name: chunk.toolName,
                        arguments: chunk.args,
                    }
                };
            }
        }

        yield { isComplete: true };
    }

    /**
     * 健康检查 - ILLMProvider 接口
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.chat([{ role: 'user', content: 'ping' }]);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 转换消息格式
     */
    private convertMessages(messages: IChatMessage[]): any[] {
        return messages.map(m => ({
            role: m.role,
            content: m.content
        }));
    }
}
