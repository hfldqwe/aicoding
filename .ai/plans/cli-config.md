# Implementation Plan - US-005: CLI & Config

## Goal
Implement the CLI entry point using `commander` and a robust configuration loader `ConfigProvider` using `dotenv`.

## User Review Required
> [!NOTE]
> This sets up the foundation for the application. No breaking changes as it's a new entry point.

## Proposed Changes

### Dependencies
-   [NEW] `commander`
-   [NEW] `dotenv`
-   [NEW] `@types/node` (ensure it's there)

### src/infrastructure/config
#### [NEW] [ConfigProvider.ts](file:///C:/Users/19410/Documents/Project/aicoding/src/infrastructure/config/ConfigProvider.ts)
-   Implements `IConfigProvider`.
-   Loads `.env` file using `dotenv.config()`.
-   Parses env vars:
    -   `AICODING_API_KEY` -> `config.llm.apiKey`
    -   `AICODING_MODEL` -> `config.llm.model`
    -   `AICODING_PROVIDER` -> `config.llm.provider`

### src
#### [NEW] [index.ts](file:///C:/Users/19410/Documents/Project/aicoding/src/index.ts)
-   CLI Entry point.
-   Uses `commander` to define version and description.
-   Commands:
    -   `start` (default): Initialize Agent loop (placeholder for now).
-   Loads config on startup.

### root
#### [MODIFY] [package.json](file:///C:/Users/19410/Documents/Project/aicoding/package.json)
-   Add `"start": "tsx src/index.ts"` (or `ts-node` depending on what's available).
-   *Note*: User has `typescript`, `vitest`. Need to ensure we can run TS files. I'll check if `tsx` or `ts-node` is available or if I should add it.

## Verification Plan

### Automated Tests
-   **Config Loading**: detailed unit test for `ConfigProvider` mocking `process.env`.
-   **CLI**: Smoke test by running `npm start -- --help`.

### Manual Verification
1.  Create `.env` with dummy key.
2.  Run `npm start`.
3.  Verify output logs showing config loaded.
