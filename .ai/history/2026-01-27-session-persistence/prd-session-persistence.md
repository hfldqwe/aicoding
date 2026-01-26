# PRD: Agent Context Persistence & Session Restoration (US-010)

## Introduction
Currently, `aicoding` effectively "forgets" everything once the process terminates. This feature introduces a robust, filesystem-based persistence layer using **JSONL (JSON Lines)**. This format is chosen for its efficient append-only characteristics and suitability for streaming capability, avoiding memory issues related to loading large JSON arrays.

## Goals
- **Persistence**: Automatically save every message interaction to a local file (`.aicoding/sessions/session_<id>.jsonl`) without blocking the main Agent loop.
- **Resumption**: Allow users to resume a previous conversation by providing a Session ID.
- **Efficiency**: Use streaming/append-only I/O to handle long conversations (prevent OOM).
- **Context Management**: Implement "Sliding Window" logic to ensure the context stays within limits while preserving the critical System Prompt.

## User Stories

### US-010.1: JSONL Storage Foundation
**Description:** As a system, I want to asynchronously append messages to a JSONL file so that history is preserved.
**Acceptance Criteria:**
- [x] Create `src/infrastructure/context/JsonlContextManager.ts` implementing `IContextManager`.
- [x] Ensure `.aicoding/sessions/` directory is created if it doesn't exist.
- [x] `addMessage` adds the message to an **internal queue** immediately (non-blocking).
- [x] A background processor consumes the queue and uses `fs.appendFile` to write JSON strings.
- [x] Verify concurrency handling: Rapid `addMessage` calls result in correctly ordered lines in the file.
- [x] Typecheck passes.
- [x] Tests pass (Unit test for Queue ordering).

### US-010.2: Session Hydration (Restore)
**Description:** As a user, I want to load past messages when I start with a Session ID.
**Acceptance Criteria:**
- [x] `JsonlContextManager` constructor accepts a `sessionId`.
- [x] `getHistory()` reads the corresponding `.jsonl` file line-by-line.
- [x] Reconstructs `IChatMessage[]` array from file content.
- [x] Handles missing files gracefully (starts empty).
- [x] Typecheck passes.
- [x] Tests pass.

### US-010.3: Sliding Window & Truncation
**Description:** As an agent, I want to keep my context usage efficient by discarding old messages when the limit is reached.
**Acceptance Criteria:**
- [ ] Implement a limit (e.g., 50 messages or estimated characters).
- [ ] When loading (`getHistory`) or adding (`addMessage`), checks the size.
- [ ] If Limit Exceeded:
    - **Keep** the System Prompt (first message usually).
    - **Drop** oldest messages after System Prompt until within limit.
    - Ensure logical consistency (e.g., don't break a Tool Call / Tool Result pair if possible, usually keep "User" as the first message after System Prompt if truncation happens).
- [ ] Typecheck passes.
- [ ] Tests pass (Unit test: Verify System Prompt stays, old user messages go).

### US-010.4: CLI Integration
**Description:** As a user, I want to specify a session ID via command line arguments.
**Acceptance Criteria:**
- [ ] Update `src/index.ts` to accept `-s, --session-id <id>`.
- [ ] If provided: Use that ID for `JsonlContextManager`.
- [ ] If NOT provided: Generate a new random UUID (or timestamp-based ID) and print it to the user ("Session ID: XXXXX").
- [ ] Replace `InMemoryContextManager` with `JsonlContextManager`.
- [ ] Typecheck passes.
- [ ] Manual verification: Run `npm start -- --session-id test-1`, talk, exit, run again, verify memory.

## Functional Requirements
- **FR-1**: Messages must be written to `.aicoding/sessions/session_<id>.jsonl`.
- **FR-2**: Writing must be non-blocking (async queue).
- **FR-3**: System Prompt is immutable and never truncated.
- **FR-4**: Session ID determines the filename.

## Non-Goals
- Database integration (SQLite, Postgres).
- Full Tokenization (e.g., `tiktoken`) - Use line/message count or character estimation for simplicity.
- Editing past messages.

## Technical Considerations
- **Concurrency**: Use a mutex or a simple array queue with a `processing` flag for file writes to ensure order.
- **Path**: Use `path.join` for cross-platform compatibility.

## Success Metrics
- Performance: File write latency does not affect Agent response time.
- Reliability: 100% of messages are saved.
- Usability: User can resume session successfully.
