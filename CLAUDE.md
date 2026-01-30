# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**aicoding** is an experimental AI Agent CLI for coding that explores "Vibe Coding" - a philosophy where developers collaborate with autonomous AI agents to build software. It features a terminal-based interface for interacting with AI agents that can execute tools, manage files, and run commands.

## Common Commands

```bash
# Run the CLI application
npm start

# Run all tests (uses Vitest)
npm test

# Run a specific test file
npx vitest run test/core/agent.test.ts

# Run tests in watch mode
npx vitest

# TypeScript type checking (no emit)
npm run type-check

# Build the project (compile TypeScript)
npm run build

# Archive completed plans
npm run archive
```

### Note on Deprecation Warnings

If you encounter `[DEP0190]` deprecation warnings from `@modelcontextprotocol/sdk`, you can suppress them:

```bash
# Linux/macOS
export NODE_OPTIONS="--no-deprecation"

# Windows PowerShell
$env:NODE_OPTIONS="--no-deprecation"

# Windows CMD
set NODE_OPTIONS=--no-deprecation
```

## Architecture Overview

### Three-Layer Architecture

The codebase follows a strict three-layer architecture with interface-driven design:

1. **Client (UI Layer)** - `src/ui/`: Rendering and input handling. Contains no business logic. Subscribes to events via `EventBus`.

2. **Server (Core Layer)** - `src/core/`: Business logic and orchestration. The `ReActAgent` implements the thought loop (reasoning + acting).

3. **Infrastructure Layer** - `src/infrastructure/`: Concrete implementations including:
   - `llm/`: LLM providers (OpenAI via `OpenAIProvider`)
   - `tools/`: Tool implementations (FileSystem, RunCommand, Workspace, LoadSkill)
   - `ui/`: Terminal UI renderer using Ink (React-based)
   - `context/`: Session management via `JsonlContextManager`
   - `events/`: Event bus implementation
   - `config/`: Configuration management
   - `security/`: Security service for operation validation

### Interface-First Design

All contracts are defined in `src/types/*.ts`. Key interfaces:
- `IAgent`: Main orchestrator with `run()` and `stop()` methods
- `ILLMProvider`: Abstracts LLM operations (`generateText`, `streamText`)
- `ITool`: Defines tool structure with `name`, `description`, `parameters`, `execute()`
- `IContextManager`: Manages conversation history
- `IRenderer`: UI abstraction for rendering messages and getting user input
- `IEventBus`: Event-driven communication between components

### Ralph Loop Workflow

Development follows the "Ralph Loop" workflow:
1. **Plan**: Create design documents in `.ai/plans/`
2. **Propose**: Define interfaces and tests
3. **Apply**: Implement and verify

### Data Flow

```
User Input -> UI (IRenderer) -> Agent (IAgent)
                                    |
                                    v
                            [Thought Loop]
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
            Context (IContextManager)       LLM (ILLMProvider)
                    ^                               |
                    |                               v
                    +----------------------- Tool (ITool)
                                                    |
                    EventBus (IEventBus) <----------+
                            |
                            v
                    UI (IRenderer) -> User
```

## Key Development Rules

From `.ai/VIBE_CODING_GUIDE.md` and `.agent/rules/aicoding.md`:

1. **Interface-Driven**: Always check `src/types/*.ts` before implementation
2. **No State Leaks**: Never expose private state via public getters unless defined in interface
3. **Event-Driven**: Cross-component communication must use `IEventBus`
4. **Dependency Injection**: Classes receive dependencies via constructor, not `new Class()`
5. **Strict TypeScript**: `strict: true`, no `any` types (except in `ITool.execute` with immediate Zod validation)
6. **Tests**: Write tests before or with implementation

## Project Structure

```
src/
  types/           # Interface definitions (contracts)
  core/            # Business logic (Agent, prompts)
  infrastructure/  # Implementations
    config/        # Configuration management
    context/       # Session/context management
    events/        # Event bus implementation
    llm/           # LLM providers (OpenAI)
    security/      # Security service
    skill/         # Skill registry
    tools/         # Tool implementations
    ui/            # Terminal UI renderer
    workspace/     # File system workspace
  mcp/             # Model Context Protocol
    transports/    # SSE and Stdio transports

test/              # All test files (mirror src/ structure)
  core/            # Agent tests
  infrastructure/  # Component tests
  integration/     # Integration tests

.ai/               # AI workflow documentation
  plans/           # Design documents (Ralph Loop)
  VIBE_CODING_GUIDE.md

.agent/rules/      # AI behavior rules
```

## Technology Stack

- **Runtime**: Node.js with TypeScript (ES2022, strict mode)
- **CLI Framework**: Commander.js
- **LLM Integration**: ai-sdk (Vercel AI SDK) with OpenAI provider
- **Testing**: Vitest
- **UI**: Ink (React-based CLI UI)
- **MCP**: Official Model Context Protocol SDK

## Configuration

Environment variables (from `.env`):
- `AICODING_API_KEY`: OpenAI API key
- `AICODING_MODEL`: Model name (default: gpt-4o)
- `AICODING_PROVIDER`: Provider name (openai or anthropic)
- `AICODING_ALLOW_SHELL`: Allow shell command execution
- `AICODING_CONFIRM_DANGEROUS`: Confirm dangerous operations

## Testing

- **17+ test files** in `test/`
- **111+ test cases** using Vitest
- Tests organized by component (mirror `src/` structure)
- Integration tests for end-to-end workflows
- Run single test: `npx vitest run test/path/to/test.ts`
- Run in watch mode: `npx vitest`

## Language Requirements

Per `.agent/rules/language.md` and `.agent/rules/aicoding.md`:
- **Plans and Reviews**: Must use **Chinese (中文)** when writing plans or requesting user review
- **Code Comments**: New code comments should be in Chinese
- **Implementation Plans**: Titles and step descriptions must be in Chinese
- **Thought Process**: The thinking/internal reasoning process should use Chinese grammar with English code terms

## Archive Completed Plans

Use `npm run archive` to move completed plans from `.ai/plans/` to `.ai/history/`.
