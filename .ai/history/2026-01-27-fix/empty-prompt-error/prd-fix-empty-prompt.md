# PRD: Fix Empty Prompt Error (JsonlContextManager Race Condition)

## 1. Context
User reported `Error: Invalid prompt: messages must not be empty`.
Investigation revealed a race condition in `JsonlContextManager`:
- `addMessage` is synchronous but relies on asynchronous file writing.
- `getHistory` reads directly from the file.
- If `getHistory` is called immediately after `addMessage` (which `ReActAgent` does), the file may not yet contain the new message, returning an empty array.

## 2. Goals
- Eliminate the race condition in `JsonlContextManager`.
- Ensure `getHistory` always returns the most up-to-date state including recently added messages.
- Maintain persistence to `.jsonl` files.

## 3. User Stories (Ralph Flow)

### BUG-001: JsonlContextManager Race Condition
- **Story**: As a developer, I want `JsonlContextManager` to cache messages in memory so that `getHistory` returns immediate updates without waiting for file I/O.
- **Acceptance Criteria**:
    - A test case employing `addMessage` followed immediately by `getHistory` must return the added message.
    - The file persistence mechanism must still work (eventually consistent).
    - `switchSession` must clear the memory cache to avoid leaking state.

## 4. Technical Design
- Introduce `private messagesCache: IChatMessage[] | null` in `JsonlContextManager`.
- **Initialization**: On first access (`addMessage` or `getHistory`), load file content into `messagesCache`.
- **Read**: `getHistory` returns `messagesCache`.
- **Write**: `addMessage` updates `messagesCache` synchronously AND pushes to `writeQueue`.
- **Switch**: `switchSession` sets `messagesCache = null`.
