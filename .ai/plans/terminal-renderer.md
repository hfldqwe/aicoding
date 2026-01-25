# Implementation Plan - US-006: Terminal Renderer (Ink)

## Goal
Implement `TerminalRenderer` using `ink` and `react` to provide a rich terminal UI, fulfilling the `IRenderer` interface.

## User Review Required
> [!NOTE]
> This introduces a React runtime in the CLI.

## Proposed Changes

### Dependencies
-   [NEW] `ink`, `react`, `ink-spinner`
-   [NEW] `@types/react`
-   [NEW] `boxen` (optional, for basic formatting if needed, but Ink has Box) -> Not adding extra deps if not strict.

### src/infrastructure/ui
#### [NEW] [TerminalRenderer.ts](file:///C:/Users/19410/Documents/Project/aicoding/src/infrastructure/ui/TerminalRenderer.ts)
-   Implements `IRenderer`.
-   **Structure**:
    -   Since `Ink` is declarative and `IRenderer` is imperative (`renderMessage(...)`), we need a bridge.
    -   **Approach**: `TerminalRenderer` will maintain a state object (list of messages, current status).
    -   It will mount the Ink app (`render(<App />)`) once on instantiation (or first call).
    -   It will use an `EventEmitter` or a simple state store to push updates to the React component.

#### [NEW] [App.tsx](file:///C:/Users/19410/Documents/Project/aicoding/src/infrastructure/ui/components/App.tsx)
-   Root Ink component.
-   Subscribes to the state store.
-   Renders:
    -   `<MessageList messages={messages} />`
    -   `<StatusLine status={status} />`
    -   `<InputArea onSubmit={...} visible={isInputVisible} />`

### src/index.ts
-   (In US-007 but good to keep in mind) -> Will replace `console.log` with `TerminalRenderer`.

## Verification Plan

### Automated Tests
-   **Ink Testing**: Use `ink-testing-library` to verify that `TerminalRenderer` methods update the rendered output string.
-   **Mock**: Verify `IRenderer` methods called correctly.

### Manual Verification
-   Run a script that calls `renderer.renderMessage()`, `startSpinner()`, `askUser()`.
-   Verify visual output:
    -   Colors for roles.
    -   Spinner animating.
    -   Input works.
