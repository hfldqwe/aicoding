# [US-013] 技能系统 (Skills System)

## 用户审查 (User Review Required)
> [!IMPORTANT]
> 本次变更引入了全新的技能加载机制，涉及 `src/types/skill.ts` 核心接口定义及 `gray-matter` 依赖。

## 拟议变更 (Proposed Changes)

### 依赖管理 (Dependencies)
- [NEW] `gray-matter`: 用于解析 Frontmatter。

### 核心接口 (Core Interfaces)
#### [NEW] [skill.ts](file:///src/types/skill.ts)
- 定义 `ISkill` 接口 (Name, Description, Path)。
- 定义 `ISkillRegistry` 接口 (init, getSkills, getSkill, getSkillContent)。

### 基础设施 (Infrastructure)
#### [NEW] [FileSystemSkillRegistry.ts](file:///src/infrastructure/skill/FileSystemSkillRegistry.ts)
- 实现 `ISkillRegistry` 接口。
- `init()`: 
    - 扫描 `.aicoding/skills` (Workspace)
    - 扫描 `~/.aicoding/skills` (Global/Home)
    - 策略: **Global 优先** (User Request: "prioritize from ~/.aicoding/skills"). Global skills 覆盖 Local skills.
- `getSkillContent()`: 读取完整内容。

### 工具层 (Tools)
#### [NEW] [LoadSkillTool.ts](file:///src/tools/skill/LoadSkillTool.ts)
- 实现 `load_skill` 工具。
- 参数: `skill_name`。
- 输出: Markdown 正文。

### 核心层 (Core)
#### [MODIFY] [SystemPrompt](file:///src/core/prompts.ts)
- 更新 System Prompt 以支持 "Discovery" 阶段 (注入技能列表)。

## 验证计划 (Verification Plan)

### 自动化测试
- [NEW] `test/infrastructure/skill/FileSystemSkillRegistry.test.ts`: 
    - 验证 `init` 是否正确解析元数据。
    - 验证 `getSkillContent` 是否正确剥离 Frontmatter。
- [NEW] `test/tools/LoadSkillTool.test.ts`: 验证工具调用契约。
- [NEW] `test/integration/skill-bootstrap.test.ts`: 自举测试 (Bootstrap Test) —— 模拟 Agent 使用 `load_skill` 读取 `skill-creator` 并创建一个 `hello-world` 技能。

### 手动验证
- 运行 `npm test` 确保所有测试通过。
