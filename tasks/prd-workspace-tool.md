# PRD: US-009 工作区工具 (Workspace Tool)

## 简介
实现一个 `WorkspaceTool`，为 Agent 提供对本地项目结构和 Git 状态的感知能力。该工具将作为 Agent 的“眼睛”，防止其盲目读取文件，并使其能够理解当前的版本控制状态。

## 目标
- 准确识别项目根目录。
- 列出文件时严格遵守 `.gitignore` 规则（确保性能和安全）。
- 提供当前 Git 状态的结构化视图（分支、更改）。
- 确保跨平台兼容性 (Windows/Linux/Mac)。

## 用户故事 (User Stories)

### US-009.1: 项目根目录检测
**描述:** 作为 Agent，我想知道项目的根目录在哪里，以便我能以此为锚点进行操作。
**验收标准:**
- [ ] `WorkspaceTool` 能正确识别项目根路径。
- [ ] 返回跨平台格式的绝对路径。

### US-009.2: Git 感知的文件列表
**描述:** 作为 Agent，我想查看项目文件结构，但要过滤掉噪音（如 node_modules、忽略的文件），以便我能高效地找到相关代码。
**验收标准:**
- [ ] 支持从根目录或指定子目录递归列出文件。
- [ ] **严格**遵守 `.gitignore` 规则。
- [ ] 默认排除 `node_modules`, `.git`, `dist`, `build` 等。

### US-009.3: Git 状态报告
**描述:** 作为 Agent，我想知道当前的 Git 状态，这样我就不会覆盖重要的未提交工作，或者在错误的分支上工作。
**验收标准:**
- [ ] 返回当前分支名称。
- [ ] 返回已修改（未暂存）的文件列表。
- [ ] 返回已暂存的文件列表。
- [ ] 返回未跟踪的文件列表。
- [ ] 输出为结构化的 JSON，而非原始 git 文本输出。

## 功能需求 (Functional Requirements)
- FR-1: 该工具必须实现 `src/types/tool.ts` 中定义的 `ITool` 接口。
- FR-2: 底层逻辑应理想地实现或使用 `src/types/workspace.ts` 中的 `IWorkspace`。
- FR-3: 必须正确处理路径中的 Windows 反斜杠。

## 技术约束 (Tech Lead Constraints)
- 遵循 `src/types/tool.ts` 和 `src/types/workspace.ts`。
- 状态检测使用等效于 `git status -s` 的逻辑。
- 文件列表使用 `git ls-files` 或健壮的 gitignore 解析器。

## 成功指标
- Agent 可以成功列出项目文件而不会获取到垃圾文件（如 node_modules）。
- Agent 可以在提交前检查“我是否在正确的分支上？”。
