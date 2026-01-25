# aicoding: Vibe Coding 实验场

欢迎来到 `aicoding`，这是一个致力于探索和掌握 **Vibe Coding** 技术以及高级 AI Agent 协作模式的实验性项目。

## 什么是 Vibe Coding?

Vibe Coding 是一种开发哲学，强调开发者与自主 AI Agent 深度协作，以思维的速度构建软件。它核心关注：
- **接口优先 (Interface-First)**: 定义契约，让 AI 负责具体实现。
- **Agent 工作流**: 使用结构化循环（如 Ralph Loop）处理复杂任务。
- **验证机制**: 严格通过测试产物来验证 AI 的工作成果。

## 架构核心: Ralph Loop

本项目采用 **Ralph Loop** 开发工作流 (严格模式):

1.  **输入 (Input)**: 用户提出需求。
2.  **设计 (Design)**: AI 生成详细的产品需求文档 (PRD)。
3.  **转换 (Conversion)**: 将 PRD 转换为 Agent 可读的 `prd.json` 格式。
4.  **执行 (Execution)**: Agent 逐条执行用户故事 (User Stories) 并验证。
5.  **归档与合并 (Archive & Merge)**: 归档已完成任务并合并代码。

## 主要功能

- **终端工具 (Terminal Tool)**: 安全的、基于确认机制的终端执行环境。
- **Agent 核心**: 遵循接口隔离原则 (ISP) 的 TypeScript Agent 逻辑。
- **技能系统 (Skill System)**: 模块化的技能扩展 (如 PRD 生成, Ralph 转换)。

## 快速开始

1.  克隆仓库。
2.  安装依赖: `npm install`.
3.  启动 Agent 环境: `npm start`.

## 许可证

ISC
