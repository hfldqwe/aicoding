# 自动化任务编号规则

> **Auto-Load**: This rule acts as a system instruction triggered when creating new tasks.

## 核心逻辑：自动 ID 生成
当用户提出一个新的功能需求或 Bug 修复，且没有显式指定 ID 时，你必须执行以下步骤：

1. **扫描目录**
   使用文件系统工具 `list_dir` 或 `find_by_name` 读取 `.ai/plans/`和`.ai/history/` 目录下的所有文件。

2. **解析最大值**
   - 提取所有文件名中的 ID 部分（正则匹配 `US-(\d+)` 或 `FIX-(\d+)`）。
   - 找到当前最大的编号（Max ID）。
   - 如果不存在任何 ID，则默认从 `000` 开始。

3. **自动递增**
   将 `Max ID + 1`，生成新的 ID（例如 `US-017`）。
   - 功能需求：使用 `US-xxx` 前缀。
   - Bug 修复：使用 `FIX-xxx` 前缀。

4. **汇报与执行**
   - 在回复用户之前，明确告知：“已自动分配任务编号：US-xxx”。
   - 使用新 ID 创建规划文件（如 `.ai/plans/US-017-mcp-integration.md`）。
