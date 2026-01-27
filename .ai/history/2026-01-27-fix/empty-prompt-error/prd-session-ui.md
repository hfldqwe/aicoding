# PRD: Interactive Session Selection (FE-011)

## Introduction
Users struggle to remember Session IDs (UUIDs). This feature allows users to interactively view and select previous sessions to resume work, improving usability.

## Goals
- Provide a command to list recent sessions with human-readable timestamps/summaries.
- Allow selecting a session to resume via an interactive UI (CLI list/selector).

## User Stories

### US-011.1: List Sessions Backend
**Description:** As a system, I want to scan the session directory and list available sessions sorted by date.
**Acceptance Criteria:**
- [ ] Implement `JsonlContextManager.listSessions(workspaceRoot)` (static or standalone).
- [ ] Returns `{ id, path, lastModified, preview }[]`.
- [ ] Reads the last modified time of files.
- [ ] Reads the first few lines to get a "preview" (e.g., first user message) if possible (optional but nice).
- [ ] Typecheck passes.
- [ ] Tests pass (Mock fs, verify sorting).

### US-011.2: Interactive Selection UI
**Description:** As a user, I want to see a list of sessions and pick one to resume.
**Acceptance Criteria:**
- [ ] Add `list` command to CLI: `aicoding list`.
- [ ] Add `--pick` (or `-p`) flag to `start`: `aicoding start --pick`.
- [ ] When triggered, display list of last 10 sessions (using `ink` or `inquirer` style selection?).
    - *Note*: We use `ink`. We can render a list where user types number or uses arrow keys?
    - Simplest MVP: Print numbered list, ask user to type number.
- [ ] Upon selection, start the session with that ID.
- [ ] Typecheck passes.
- [ ] Manual verification.

## Functional Requirements
- **FR-1**: Sort sessions by Last Modified (newest first).
- **FR-2**: Display at least ID (shortened?) and Time.
- **FR-3**: Support selecting via index number (1, 2, 3...).

## Technical Considerations
- **Metadata**: We rely on file mtime.
- **Preview**: Reading first line of file might be JSON system prompt. Reading second line (User) is better for context.

## Success Metrics
- User can resume a session without typing a UUID.
