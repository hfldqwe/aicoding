# PRD: CLI Entry & Terminal Renderer

## Introduction
Enable `aicoding` to run as a CLI application with a rich terminal user interface (TUI) and configuration loading capabilities. The system will use `commander` for argument parsing and `ink` for rendering a modern, reactive terminal UI.

## Goals
-   **CLI Entry**: Executable via `aicoding` command with arguments.
-   **Config Loading**: Automatically load API keys and preferences from `.env` or config files.
-   **Rich UI**: Provide a streaming "typewriter" effect and loading spinners for better UX.
-   **Integration**: Connect the Agent, Tools, and UI into a cohesive loop.

## User Stories

### US-005: CLI Framework & Config
**Description**: As a user, I want to start the application via command line and have my configuration loaded automatically.

**Acceptance Criteria**:
- [ ] Install `commander` and `dotenv` (or equivalent).
- [ ] Implement `src/index.ts` (or `bin/aicoding.ts`) as entry point.
- [ ] Implement `ConfigProvider` implementing `IConfigProvider`.
- [ ] Support `--verbose` flag for debug logging.
- [ ] Load `AICODING_API_KEY` from environment/file.
- [ ] Typecheck passes.

### US-006: Terminal Renderer (Ink)
**Description**: As a user, I want a visual interface that differentiates between me and the AI, and shows when tools are running.

**Acceptance Criteria**:
- [ ] Install `ink`, `react`, `ink-spinner`, `ink-text-input`.
- [ ] Implement `TerminalRenderer` class implementing `IRenderer`.
- [ ] `renderMessage`: Display User vs AI messages distinctively (colors/labels).
- [ ] `renderToolUse`: Show spinner when tools run, checkmark when done.
- [ ] Streaming support: Visual typewriter effect for AI chunks.
- [ ] Typecheck passes.
- [ ] **Verify in manual run**: Check visual output matches expectations.

### US-007: Ultimate Integration
**Description**: As a developer, I want to verify the entire system works end-to-end.

**Acceptance Criteria**:
- [ ] Wire up `ConfigProvider` -> `LLMProvider` -> `Agent` -> `TerminalRenderer`.
- [ ] Run a real query (e.g., "Calculate 123 * 456").
- [ ] Verify: Input -> Thinking (Spinner) -> Tool Call -> Output (Stream).
- [ ] Verify graceful exit.

## Functional Requirements
-   **FR-1**: `aicoding start` (or default) launches the interactive session.
-   **FR-2**: renderer must handle Markdown content (basic formatting).
-   **FR-3**: Loading state must be interruptible or visually distinct from waiting for user input.

## Non-Goals
-   Web Interface (Scope of `agent-web`).
-   Complex multi-tab TUI (keep it linear for now).

## Technical Considerations
-   **Libraries**: `ink` (React-based TUI), `commander`.
-   **Architecture**: `TerminalRenderer` adapts Ink components to `IRenderer` imperative methods.
    -   *Strategy*: Since Ink is declarative, `TerminalRenderer` will likely own a `render()` call that updates a local state store (e.g. `EventEmitter` or simple state object), which triggers the Ink CLI to re-render. Alternatively, use `ink`'s `Instance` to update props if possible, or simpler: render new lines for messages and use a managed component for the "active" bottom area (spinner/input).
    -   *Simpler Approach*: Append-only logs for history + Dynamic Bottom Bar for current status/input.

## Success Metrics
-   System boots in < 1s.
-   No visual artifacts (broken lines) during streaming.
