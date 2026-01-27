# Ralph Loop 开发流 (Strict Mode)

1. 加载项目规则 (Rules & Constitution)
// turbo
view_file .agent/rules/aicoding.md
// turbo
view_file .agent/rules/auto_id.md

2. 加载架构上下文 (Architecture & Guide)
// turbo
view_file .ai/VIBE_CODING_GUIDE.md

3. 询问用户需求 (Step 0: Input)
// turbo
ask "有什么新功能或 Bug 需要我处理？"

4. 设计阶段 (Step 1: Design PRD)
// turbo
step "加载 `prd` skill (请先阅读 `prd` skill 的 `SKILL.md`，路径见 Available skills)，并根据用户需求生成 `tasks/prd-<feature>.md`。**注意**：任务编号 (US-xxx) 已由规则自动控制，请遵循 `.agent/rules/auto_id.md`。"

5. 转换阶段 (Step 2: Ralph Conversion)
// turbo
step "加载 `ralph` skill (请先阅读 `ralph` skill 的 `SKILL.md`，路径见 Available skills)，将 PRD 转换为 Ralph JSON 格式 (`prd.json`)。"

6. 分支阶段 (Step 3: Git Branch)
// turbo
step "根据 `prd.json` 中的 `branchName` 创建并切换到新分支：`git checkout -b <branchName>`。"

7. 执行阶段 (Step 4: Ralph Loop)
// turbo
step "读取 `prd.json`，按优先级顺序执行 User Stories。对于每一个 Story，必须严格遵循 Dev-Flow 标准：
1. **Plan**: 分析需求，制定计划。
2. **Propose (Contract-First)**: 优先定义接口 (`src/types/`)，编写红灯测试 (Test Red)。
3. **Apply**: 实现逻辑，确保测试通过 (Test Green)。
4. **Update**: 更新 `prd.json` 中该 Story 的状态为 `passes: true`。
循环直到所有 Story 完成。"

8. 交付与归档 (Step 5: Delivery & Archive)
// turbo
step "所有 Story 通过后：
1. **Documentation**: 编写或更新中文技术文档/变更日志。
2. **Archive**: 创建归档目录 `.ai/history/<date>-<feature>/`，将 `prd.json` 和 `tasks/prd-*.md` 移动到该目录。
3. **Merge**: 提议合并回主分支 (Review & Merge Request)。"
notify_user "Ralph Loop 完成。文档已更新，PRD 已归档，分支已准备好合并。"
