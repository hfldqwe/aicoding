/**
 * 工具调用（Tool Calling）类型定义
 * 支持多种 LLM 提供商的工具调用格式
 */

import { IChatMessage } from './context.js';

/**
 * 工具定义
 */
export interface IToolDefinition {
    /** 工具名称 */
    name: string;
    /** 工具描述 */
    description: string;
    /** 工具参数 JSON Schema */
    parameters: Record<string, unknown>;
}

/**
 * 工具调用请求（LLM 返回的）
 */
export interface IToolCall {
    /** 工具调用 ID */
    id: string;
    /** 工具名称 */
    name: string;
    /** 工具参数 */
    arguments: Record<string, unknown>;
}

/**
 * 工具执行结果
 */
export interface IToolResult {
    /** 工具调用 ID */
    toolCallId: string;
    /** 执行结果内容 */
    content: string;
    /** 是否出错 */
    isError?: boolean;
}

/**
 * 支持工具调用的 LLM Provider 接口
 */
export interface IToolCallingLLMProvider {
    /**
     * 发送聊天请求（支持工具调用）
     * @param messages 聊天消息历史
     * @param tools 可用工具定义
     * @returns 模型响应，可能包含工具调用请求
     */
    chatWithTools(
        messages: IChatMessage[],
        tools: IToolDefinition[]
    ): Promise<{
        /** 文本响应内容 */
        content?: string;
        /** 工具调用请求列表 */
        toolCalls?: IToolCall[];
    }>;

    /**
     * 流式响应（支持工具调用）
     */
    chatWithToolsStream(
        messages: IChatMessage[],
        tools: IToolDefinition[]
    ): AsyncIterable<{
        /** 增量文本内容 */
        contentDelta?: string;
        /** 工具调用增量 */
        toolCallDelta?: Partial<IToolCall>;
        /** 是否完成 */
        isComplete?: boolean;
    }>;
}

/**
 * 提供商特定的工具调用格式转换
 */
export interface IToolCallFormatter {
    /** 转换为 OpenAI 格式 */
    toOpenAIFormat(tools: IToolDefinition[]): unknown[];
    /** 转换为 Anthropic 格式 */
    toAnthropicFormat(tools: IToolDefinition[]): unknown[];
    /** 转换为 Google 格式 */
    toGoogleFormat(tools: IToolDefinition[]): unknown[];

    /** 从提供商格式解析工具调用 */
    parseToolCall(providerResponse: unknown): IToolCall[];
}
