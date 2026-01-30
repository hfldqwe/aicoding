# 多厂商 LLM Provider 支持

本项目现在支持多个大模型厂商，通过 Vercel AI SDK 的 Provider 生态系统实现。

## 支持的 Provider

| Provider | 类型 | 说明 | 默认模型 |
|----------|------|------|----------|
| OpenAI | `openai` | GPT-4, GPT-3.5 系列 | `gpt-4o` |
| Anthropic | `anthropic` | Claude 3 系列 | `claude-3-5-sonnet-20241022` |
| Google | `google` | Gemini 系列 | `gemini-1.5-flash-latest` |
| DeepSeek | `deepseek` | DeepSeek Chat | `deepseek-chat` |
| Alibaba | `alibaba` | 通义千问系列 | `qwen-turbo` |
| Local | `local` | 本地模型 (Ollama, LM Studio) | `llama2` |

## 配置方式

### 1. 环境变量

```bash
# 选择 Provider (openai, anthropic, google, deepseek, alibaba, local)
AICODING_PROVIDER=anthropic

# 模型名称
AICODING_MODEL=claude-3-5-sonnet-20241022

# API Key
AICODING_API_KEY=your-api-key

# 自定义 Base URL (可选)
AICODING_BASE_URL=https://api.anthropic.com
```

### 2. 配置文件

在 `~/.aicoding/aicoding.json` 创建配置文件：

```json
{
  "llm": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "apiKey": "your-api-key"
  }
}
```

### 3. 各 Provider 配置示例

#### OpenAI
```bash
AICODING_PROVIDER=openai
AICODING_MODEL=gpt-4o
AICODING_API_KEY=sk-xxx
```

#### Anthropic (Claude)
```bash
AICODING_PROVIDER=anthropic
AICODING_MODEL=claude-3-5-sonnet-20241022
AICODING_API_KEY=sk-ant-xxx
```

#### Google (Gemini)
```bash
AICODING_PROVIDER=google
AICODING_MODEL=gemini-1.5-flash-latest
AICODING_API_KEY=xxx
```

#### DeepSeek
```bash
AICODING_PROVIDER=deepseek
AICODING_MODEL=deepseek-chat
AICODING_API_KEY=sk-xxx
# 可选：自定义 baseURL
AICODING_BASE_URL=https://api.deepseek.com/v1
```

#### Alibaba (通义千问)
```bash
AICODING_PROVIDER=alibaba
AICODING_MODEL=qwen-turbo
AICODING_API_KEY=sk-xxx
# 可选：自定义 baseURL
AICODING_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

#### Local (Ollama)
```bash
AICODING_PROVIDER=local
AICODING_MODEL=llama2
# API Key 可以为空
AICODING_API_KEY=
# 可选：自定义 baseURL (默认为 http://localhost:11434/v1)
AICODING_BASE_URL=http://localhost:11434/v1
```

## 使用 Provider Factory

在代码中，可以使用 `LLMProviderFactory` 动态创建 Provider：

```typescript
import { LLMProviderFactory } from './src/infrastructure/llm/LLMProviderFactory.js';

const config = {
    provider: 'anthropic',
    apiKey: 'your-api-key',
    modelName: 'claude-3-5-sonnet-20241022',
};

const provider = LLMProviderFactory.create(config);
const response = await provider.chat([{ role: 'user', content: 'Hello' }]);
```

## 获取支持的 Provider 列表

```typescript
import { LLMProviderFactory } from './src/infrastructure/llm/LLMProviderFactory.js';

const providers = LLMProviderFactory.getSupportedProviders();
providers.forEach(p => {
    console.log(`${p.name} (${p.type}): ${p.description}`);
});
```

## 架构说明

本项目使用 Vercel AI SDK 作为底层依赖，通过不同的 Provider 包来支持多厂商：

- `@ai-sdk/openai` - OpenAI 支持
- `@ai-sdk/anthropic` - Anthropic Claude 支持
- `@ai-sdk/google` - Google Gemini 支持

对于提供 OpenAI 兼容 API 的厂商（如 DeepSeek、阿里），使用 `@ai-sdk/openai` 配合自定义 baseURL 实现支持。
