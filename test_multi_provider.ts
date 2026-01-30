/**
 * 多厂商 LLM Provider 测试脚本
 * 用于验证各个 Provider 是否能正确创建
 */

import { LLMProviderFactory } from './src/infrastructure/llm/LLMProviderFactory.js';
import { ILLMConfig } from './src/types/llm.js';

console.log('=== 多厂商 LLM Provider 测试 ===\n');

// 显示支持的 Provider 列表
console.log('支持的 Provider 列表:');
const providers = LLMProviderFactory.getSupportedProviders();
providers.forEach(p => {
    console.log(`  - ${p.name} (${p.type}): ${p.description}`);
});

console.log('\n=== 测试 Provider 创建 ===\n');

// 测试配置
const testConfigs: { name: string; config: ILLMConfig }[] = [
    {
        name: 'OpenAI (GPT-4)',
        config: {
            apiKey: 'sk-test',
            modelName: 'gpt-4o',
            provider: 'openai',
        },
    },
    {
        name: 'Anthropic (Claude)',
        config: {
            apiKey: 'sk-test',
            modelName: 'claude-3-5-sonnet',
            provider: 'anthropic',
        },
    },
    {
        name: 'Google (Gemini)',
        config: {
            apiKey: 'test',
            modelName: 'gemini-1.5-flash',
            provider: 'google',
        },
    },
    {
        name: 'DeepSeek',
        config: {
            apiKey: 'sk-test',
            modelName: 'deepseek-chat',
            provider: 'deepseek',
        },
    },
    {
        name: 'Alibaba (Qwen)',
        config: {
            apiKey: 'sk-test',
            modelName: 'qwen-turbo',
            provider: 'alibaba',
        },
    },
    {
        name: 'Local (Ollama)',
        config: {
            apiKey: '', // 本地模型不需要 API Key
            modelName: 'llama2',
            provider: 'local',
        },
    },
];

// 测试每个 Provider 的创建
for (const { name, config } of testConfigs) {
    try {
        const provider = LLMProviderFactory.create(config);
        console.log(`✅ ${name}: Provider 创建成功 (${provider.constructor.name})`);
    } catch (error: any) {
        console.error(`❌ ${name}: Provider 创建失败 - ${error.message}`);
    }
}

console.log('\n=== 测试完成 ===');
