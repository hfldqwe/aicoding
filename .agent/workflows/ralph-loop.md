---
description: 执行 Ralph 开发循环 (Input -> PRD -> Ralph JSON -> Branch -> Loop -> Merge)
---

# Ralph Loop 开发流 (Strict Mode)

1. 加载项目规则 (Rules & Constitution)
// turbo
view_file .agent/rules/aicoding.md

2. 加载架构上下文 (Architecture & Guide)
// turbo
view_file .ai/VIBE_CODING_GUIDE.md

3. 询问用户需求 (Step 0: Input)
// turbo
ask "有什么新功能或 Bug 需要我处理？"

4. 设计阶段 (Step 1: Design PRD)
// turbo
step "加载 `prd` skill (`view_file C:\Users\19410\.gemini\antigravity\skills\prd\SKILL.md`)，并根据用户需求生成 `tasks/prd-<feature>.md`。**严禁**直接开始编码。"

5. 转换阶段 (Step 2: Ralph Conversion)
// turbo
step "加载 `ralph` skill (`view_file C:\Users\19410\.gemini\antigravity\skills\ralph\SKILL.md`)，将 PRD 转换为 Ralph JSON 格式 (`prd.json`)。"

6. 分支阶段 (Step 3: Git Branch)
// turbo
step "根据 `prd.json` 中的 `branchName` 创建并切换到新分支：`git checkout -b <branchName>`。"

7. 执行阶段 (Step 4: Ralph Loop)
// turbo
step "读取 `prd.json`，按优先级顺序执行 User Stories。对于每一个 Story：(1) Plan (2) Propose (3) Apply (4) Update `prd.json` (passes: true)。循环直到所有 Story 完成。"

8. 归档与合并 (Step 5: Archive & Merge)
// turbo
step "所有 Story 通过后：(1) 将 prd.json (检查 root 和 tasks/ 目录) 以及 tasks/prd-*.md 移动到 .ai/history/<date>-<feature>/ 目录。 (2) 提议合并回主分支 (Review & Merge Request)。"
notify_user "Ralph Loop 完成。PRD 已归档，分支已准备好合并。"
