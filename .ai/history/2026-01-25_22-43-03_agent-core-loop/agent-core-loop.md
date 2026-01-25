# PRD: Agent Core Implementation (US-002, US-003, US-004)

## 1. 目标 (Goals)
构建 Agent 的核心基础设施，使其具备思考、调用工具和执行任务的能力。

## 2. 范围 (Scope)

### US-002: 大模型服务层 (LLMProvider)
- **目标**: 统一 LLM 调用接口，支持流式输出。
- **实现**:
    - 基于 Vercel AI SDK。
    - 实现 `OpenAIProvider`。
    - 接口: `ILLMProvider` (chat, chatStream, healthCheck)。

### US-003: 工具注册表 (ToolRegistry)
- **目标**: 管理 Agent 可用的工具。
- **实现**:
    - 维护工具 Map。
    - 支持工具注册、查找。
    - 自动生成 OpenAI Function Definition JSON。
    - 接口: `IToolRegistry`.

### US-004: Agent 核心思考循环 (AgentLoop)
- **目标**: 实现 ReAct (Reasoning + Acting) 循环。
- **实现**:
    - `ReActAgent` 类。
    - 循环逻辑: Context -> LLM -> Thought -> Action -> Obs -> Context。
    - 最大迭代限制 (10次)。
    - 事件驱动: 思考、工具调用等通过 `IEventBus` 广播。

## 3. 技术方案 (Technical Design)
- **依赖**: `ai`, `@ai-sdk/openai`, `zod`.
- **目录结构**:
    - `src/core/`: 核心实现 (llm-provider.ts, tool-registry.ts, agent.ts).
    - `src/types/`: 接口定义.
- **验证**:
    - 单元测试 (Vitest).
    - 集成测试 (Mock LLM + Real Tools).

## 4. 交付物 (Deliverables)
- 源代码: `src/core/*`
- 测试代码: `test/core/*`
- 能够运行 ReAct 循环的 Agent 实例。
