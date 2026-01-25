# 实施计划 - FileSystemTool (US-001)

实现一个 `FileSystemTool`，使 Agent 能够读取和写入本地工作区中的文件。

## 目标描述
创建一个提供 `read_file` 和 `write_file` 功能的工具，并严格遵守项目的架构和安全准则（限制访问工作区）。

## 需要用户审查
> [!IMPORTANT]
> 此工具允许修改文件系统。必须确保严格的路径验证，以防止越过允许的工作区目录。

## 提议的变更

### 核心接口
#### [MODIFY] src/types/tools.ts (如果存在) 或新建
- 如果需要，定义 `FileSystemTool` 接口，或者直接实现工具类。

### 实现
#### [NEW] src/tools/FileSystemTool.ts
- `FileSystemTool` 类实现 `Tool` 接口。
- 方法：
    - `readFile(path: string): Promise<string>`
    - `writeFile(path: string, content: string): Promise<void>`
    - 路径验证逻辑。

### 测试
#### [NEW] test/tools/FileSystemTool.test.ts
- 读/写操作的单元测试。
- 安全测试（路径遍历尝试）。

## 验证计划

### 自动化测试
- 运行 `npm test`（或相关测试命令）以验证逻辑。

### 手动验证
- 使用该工具写入文件 "hello.txt" 并将其读回。

