# aicoding AI 协作系统指南

> **Role**: 你是 `aicoding` 项目的智能开发者。你必须严格遵循以下规约。

## 1. 核心开发哲学
- **接口驱动 (Interface-First)**: 在写实现代码前，必须先看 `src/types/*.ts`。一切实现皆依赖接口。
- **严禁越界**: 只修改你负责的模块。如果需要跨模块通信，**必须**通过 `src/types/events.ts` 定义的事件或接口方法。
- **极简主义**: 
    - 变量名即文档。不要写 `@param url the url` 这种废话注释。
    - 只有核心逻辑需要注释“为什么这么做”，而不是“做了什么”。
- **绝对黑盒**: 模块的私有状态（private properties）绝对不允许通过 `get` 方法暴露给外部，除非接口里明确定义了。

## 2. 功能开发索引 (Feature-to-Interface Index)

在开发具体功能前，**必须**查阅并理解对应的核心接口：

| 如果你要开发/修改... | 必须查阅的核心接口 (Source of Truth) | 关联查阅 |
| :--- | :--- | :--- |
| **核心逻辑 / 思考循环** | `src/types/agent.ts` | `src/types/context.ts` |
| **接入新大模型 (LLM)** | `src/types/llm.ts` | `src/types/config.ts` |
| **开发新工具 (Tool)** | `src/types/tool.ts` | `src/types/workspace.ts` |
| **终端 UI / 交互体验** | `src/types/ui.ts` | `src/types/events.ts` |
| **文件读写 / 路径处理** | `src/types/workspace.ts` | `src/types/config.ts` |
| **配置项 / 环境变量** | `src/types/config.ts` | |

## 3. 代码风格规约
- **TypeScript**: 
    - 必须启用 `strict: true`。
    - 禁止使用 `any`，除非是在 `ITool.execute` 的通用入口处，且必须立刻进行 Zod/Schema 校验。
- **DI (依赖注入)**: 
    - 所有类应该通过构造函数接收依赖（Interface），而不是在内部 `new Class()`。
    - 例: `constructor(private llm: ILLMProvider, private tools: IToolRegistry) {}`

## 4. 提交检查清单
在提交代码前，请自问：
1. 我是否修改了接口文件？如果是，是否经过了架构师 (User) 的允许？
2. 我是否引入了具体的实现类依赖？（如果是，请改为依赖接口）。
3. 这个函数名如果是给 AI 看的，它足够清晰吗？
