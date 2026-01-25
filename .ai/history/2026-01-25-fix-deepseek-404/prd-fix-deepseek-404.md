# PRD: 修复 DeepSeek API 404 错误

## 问题概述
在使用 DeepSeek 模型（`deepseek-chat`）进行交互时，控制台报错 404 Not Found。
报错信息显示请求被发送至 `https://api.deepseek.com/v1/responses`。
这是因为 `@ai-sdk/openai` Provider 的新版本默认尝试使用 "OpenAI Responses API"，而 DeepSeek 仅支持标准的 "Chat Completions API"。

## 目标
- 强制 `@ai-sdk/openai` 使用标准 Chat Completions API。
- 确保 DeepSeek 模型能正常对话并使用工具。
- 验证所有集成测试通过。

## 用户故事

### US-FIX-001: 强制使用 Chat Completions API
**描述:** 作为开发者，我需要强制 LLM Provider 使用 Chat 完成接口，以兼容 DeepSeek。

**验收标准:**
- [ ] 修改 `OpenAIProvider`，在初始化模型时显式禁用 `responses` 实验性功能（如果存在）。
- [ ] 使用 `openai('deepseek-chat')` 的标准用法，或通过配置强制路径。
- [ ] Typecheck 通过。

### US-FIX-002: 端到端生存测试 (DeepSeek)
**描述:** 作为用户，我希望运行 `npm start` 后能获得 DeepSeek 的回复。

**验收标准:**
- [ ] 运行 `npm start`。
- [ ] 输入 "你好"。
- [ ] 获得正常的中文字符响应。
- [ ] 不再出现 404 错误。

## 功能需求
- FR-1: 修正 `src/core/llm-provider.ts` 中的模型初始化逻辑。
- FR-2: 确保 `baseURL` 配置依然有效。

## 非目标
- 不引入新的 LLM 依赖。
- 不修改 `agent` 核心逻辑。

## 技术思考
在 `@ai-sdk/openai` 中，由于 DeepSeek 宣称 100% 兼容 OpenAI，但实际上只支持旧版的 Chat API。如果 SDK 自动探测到需要用 `responses` 终点，我们需要通过设置强制降级。
通常可以通过 `openai('model', { structuredOutputs: false })` 或不使用特定的 SDK 方法来规避。
更直接的方法是检查 `https://api.deepseek.com/v1` 的路径拼接逻辑。

## 成功指标
- 错误率降为 0。
- 响应延迟符合 DeepSeek 正常范围。
