# 架构与代码质量审计报告

**日期**: 2026-01-28
**审计员**: Antigravity (AI)

## 1. 接口违规与耦合 (Interface Violations & Coupling)
- **[WARN] 全局单例**: `src/infrastructure/ui/UIStore.ts` 导出了一个具体的 `uiStore` 单例。
  - *影响*: 低。目前仅限于 `src/infrastructure/ui` 层（TerminalRenderer 和 App 组件）内部使用。
  - *状态*: **可接受**。它作为 UI 层的内部状态存储，未泄漏到 Core 层。
  - *建议*: 确保未来的 Core 代码不要引入此文件。

## 2. 幽灵代码 (Ghost Code / Unused Definitions)
- **[FAIL] 未使用的接口**: `src/types/common.ts` 中的 `IRetryPolicy`。
  - *证据*: 定义了但从未被导入或实现。

## 3. 硬编码字符串 (Hardcoded Strings)
- **[FAIL] 嵌入的 System Prompt**: `src/core/agent.ts` 包含了完整的 System Prompt (第 32-56 行)。
  - *违规*: 配置/内容应与逻辑分离。
  - *修复*: 移动到 `src/core/prompts.ts` 或 `src/config`。

## 4. 测试覆盖率 (Test Coverage)
- **[FAIL] 缺少集成测试**: Core Agent Loop (`ReActAgent`) 没有集成测试。
  - *证据*: `test/` 下只有 `WorkspaceTool.test.ts`。
  - *风险*: 高。如果 Agent 的消息循环或事件系统发生变更，可能导致功能破坏且无法检测。

## 5. 实施计划 (FIX-001)
已创建修复计划 `FIX-001` 以解决上述问题。

### 修复摘要
1.  **重构**: 将 System Prompt 从 `src/core/agent.ts` 提取到 `src/core/prompts.ts`。
2.  **清理**: 删除 `src/types/common.ts` 中未使用的 `IRetryPolicy`。
3.  **测试**: 创建 `test/core/agent.integration.test.ts`，使用 Mock LLM 验证 Agent 循环。
