---
description: 执行 Ralph 开发循环 (计划 -> 提议 -> 应用)
---

# Ralph Loop 开发流

1. 加载项目规则 (Rules & Constitution)
// turbo
view_file .agent/rules/aicoding.md

2. 加载架构上下文 (Architecture & Guide)
// turbo
view_file .ai/VIBE_CODING_GUIDE.md

3. 询问用户需求 (Step 0: Input)
// turbo
ask "有什么新功能或 Bug 需要我处理？(这将启动 Ralph Loop: 计划 -> 提议 -> 应用)"

4. 执行规划 (Step 1: Plan)
// turbo
step "在 .ai/plans/ 目录下创建或更新计划文档"
notify_user "计划已创建，请审查。"

5. 等待用户确认 (User Feedback)
// turbo
wait_for_user

6. 执行提议 (Step 2: Propose)
// turbo
step "提议接口变更 (src/types) 和 测试用例 (test/)"
notify_user "接口与测试已提议，请审查。"

7. 执行应用 (Step 3: Apply)
// turbo
step "实现逻辑并通过测试"

8. 归档 (Step 4: Archive)
// turbo
step "为当前任务创建归档：在 .ai/history/ 下创建一个带时间戳的文件夹，并将相关的计划文档 (.ai/plans/*.md) 移动到该文件夹中。"
notify_user "任务已完成并归档。"
