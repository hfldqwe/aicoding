# PRD: FileSystemTool

## Introduction
Implement a tool that allows the Agent to read and write files within the workspace, adhering to security constraints.

## Goals
- Provide `read_file` capability.
- Provide `write_file` capability.
- Ensure operations are scoped to the workspace.

## User Stories

### US-001: Implement FileSystemTool
**Description:** As a developer, I want a `FileSystemTool` so that I can manipulate files programmatically.

**Acceptance Criteria:**
- [x] Implement `FileSystemTool` class with `ITool` interface.
- [x] Support `read_file` operation.
- [x] Support `write_file` operation.
- [x] Typecheck passes.
- [x] Unit tests pass.

## Functional Requirements
- FR-1: Tool name must be `filesystem_tool`.
- FR-2: Must validate `path` argument.

## Non-Goals
- Deleting files (for now).
