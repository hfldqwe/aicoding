# FIX-003: 修复 AI 角色错乱问题 (Fix AI Persona Issue)

## 1. Goal Description
**背景**: 当前 AI 在连接特定 MCP 工具（如 12306）后，会被工具描述中的 Prompt 污染，导致身份认知发生偏差（例如自称“火车票查询助手”），偏离了“AI 编程助手”的核心定位。
**目标**: 强制明确 AI 的系统级身份，确保无论加载何种工具，AI 始终保持“AI Coding Assistant”的自我认知。

## 2. User Review Required
> [!IMPORTANT]
> 本次修改仅通过强化 System Prompt 实现，不涉及 TypeScript 接口变更。
> 这是一个纯行为修正。

## 3. Proposed Changes

### Core
#### [MODIFY] [prompts.ts](file:///c:/Users/19410/Documents/Project/aicoding/src/core/prompts.ts)
- **Identity Enforcement**: 在 `getSystemPrompt` 中，将身份定义移至最前，并添加“最高指令”块，明确要求忽略工具描述中的身份设定。
- **Tool Context Separation**: 明确区分“核心身份”与“可用工具”，将工具描述作为附属信息处理。

## 4. Verification Plan

### Manual Verification
- **Scenario**: 重新模拟导致问题的“你好”对话。
- **Expectation**: AI 应回复“你好！我是 AI 编程助手...”而不是“我是火车票助手...”。
- **Check**: 检查生成的 System Prompt 是否包含新的身份锁定指令。
