# Implementation Plan - US-007: Ultimate Integration

## Goal
Integrate `ConfigProvider`, `OpenAIProvider`, `TerminalRenderer`, `ReActAgent`, and `SmartToolRegistry` in `src/index.ts` to create the full interactive loop.

## User Review Required
> [!NOTE]
> This completes the loop.

## Proposed Changes

### src
#### [MODIFY] [index.ts](file:///C:/Users/19410/Documents/Project/aicoding/src/index.ts)
-   Initialize `ConfigProvider`.
-   Initialize `OpenAIProvider` with config.
-   Initialize `SmartToolRegistry` (load basic tools).
-   Initialize `TerminalRenderer`.
-   Initialize `ReActAgent`.
-   **Loop**:
    1.  `renderer.askUser("You: ")`
    2.  `agent.run(input)`
    3.  Loop.

### Fixes
-   Ensure all imports have `.js` extension.
-   Fix `OpenAIProvider` constructor to match new `ILLMConfig` (which we might need to check).
-   Ensure `SmartToolRegistry` loads tools correctly in this env.

## Verification Plan

### Manual Verification
-   Run `npm start`.
-   Interact with the agent:
    -   "Hello" -> Agent answers.
    -   "Calculate 2 + 2" -> Agent uses tool (if available) or math capability.
