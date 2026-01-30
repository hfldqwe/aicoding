import { LLMProviderType } from '../../types/config.js';
import { ILLMConfig, ILLMProvider } from '../../types/llm.js';
import { AnthropicProvider } from './AnthropicProvider.js';
import { GoogleProvider } from './GoogleProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { OpenAICompatibleProvider } from './OpenAICompatibleProvider.js';

/**
 * LLM Provider 工厂类
 * 根据配置自动创建对应的 Provider 实例
 */
export class LLMProviderFactory {
    /**
     * 创建 Provider 实例
     */
    static create(config: ILLMConfig): ILLMProvider {
        const providerType = config.provider || 'openai';

        switch (providerType) {
            case 'openai':
                return new OpenAIProvider(config);

            case 'anthropic':
                return new AnthropicProvider(config);

            case 'google':
                return new GoogleProvider(config);

            case 'deepseek':
                // DeepSeek 使用 OpenAI 兼容模式
                return new OpenAICompatibleProvider(config, {
                    baseURL: config.baseURL || 'https://api.deepseek.com/v1',
                    defaultModel: 'deepseek-chat',
                });

            case 'alibaba':
                // 阿里通义千问使用 OpenAI 兼容模式
                return new OpenAICompatibleProvider(config, {
                    baseURL: config.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                    defaultModel: 'qwen-turbo',
                });

            case 'local':
                // 本地模型（如 Ollama, LM Studio）使用 OpenAI 兼容模式
                return new OpenAICompatibleProvider(config, {
                    baseURL: config.baseURL || 'http://localhost:11434/v1',
                    defaultModel: config.modelName || 'llama2',
                });

            default:
                // 对于未知类型，尝试使用 OpenAI 兼容模式
                console.warn(`Unknown provider type: ${providerType}, falling back to OpenAI compatible mode`);
                return new OpenAICompatibleProvider(config, {
                    baseURL: config.baseURL,
                    defaultModel: config.modelName,
                });
        }
    }

    /**
     * 获取支持的 Provider 类型列表
     */
    static getSupportedProviders(): { type: LLMProviderType; name: string; description: string }[] {
        return [
            { type: 'openai', name: 'OpenAI', description: 'GPT-4, GPT-3.5 系列' },
            { type: 'anthropic', name: 'Anthropic', description: 'Claude 3 系列' },
            { type: 'google', name: 'Google', description: 'Gemini 系列' },
            { type: 'deepseek', name: 'DeepSeek', description: 'DeepSeek Chat' },
            { type: 'alibaba', name: 'Alibaba', description: '通义千问系列' },
            { type: 'local', name: 'Local', description: '本地模型 (Ollama, LM Studio)' },
        ];
    }
}
