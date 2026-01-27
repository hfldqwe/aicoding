# PRD: In-Session History Selection (FE-012)

## Introduction
Users want to switch sessions dynamically while in the CLI, without restarting. A `/history` command should trigger an interactive popup to select a past session.

## Goals
- Add `/history` slash command.
- Display an interactive selection list (popup) of past sessions.
- Switch the active session context upon selection.

## User Stories

### US-012.1: UI Selection Component
**Description:** As a user, I want a visual menu to select a session.
**Acceptance Criteria:**
- [ ] Install `ink-select-input`.
- [ ] Update `UIStore` to support a "Selection Mode".
- [ ] Update `App.tsx` to render `SelectInput` when in selection mode.
- [ ] Lists sessions with Date and ID/Preview.
- [ ] Supports cancellation (ESC or "Cancel" option).

### US-012.2: Slash Command & Switching Logic
**Description:** As a user, I want to type `/history` to switch sessions.
**Acceptance Criteria:**
- [ ] Intercept `/history` in `index.ts`.
- [ ] Fetch sessions via `JsonlContextManager.listSessions`.
- [ ] Trigger UI selection.
- [ ] On selection:
    - Update `JsonlContextManager` to point to new file.
    - Reload properties (clear cache/re-hydrate).
    - Print visualization of switch (e.g., "Switched to session X").

## Technical Considerations
- **State Management**: The agent loop is `while(true)`. We need to handle the switch gracefully. `context` object might need a `switchSession(id)` method to reset its internal state.
