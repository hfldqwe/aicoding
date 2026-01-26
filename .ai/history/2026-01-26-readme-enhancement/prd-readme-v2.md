# PRD: README Enhancement V2

## Introduction
Enhance the project README to provide a richer introduction for developers. This includes clear architecture visualization, deep links to design documents, and support for English/Chinese language switching.

## Goals
- Add language switcher (EN/CN) for better accessibility.
- Add an "Architecture" section with visual diagrams (Mermaid).
- Provide links to deep-dive documentation instead of in-line text dumps.
- Keep the README clean and navigable.

## User Stories

### US-001: Language Navigation
As a user, I want to quickly switch between English and Chinese versions.
**Acceptance Criteria:**
- Top of `README.md`: Link to `README_zh-CN.md`.
- Top of `README_zh-CN.md`: Link to `README.md`.
- Uses a clean badge or link style (e.g., `[English] | [中文]`).

### US-002: Architecture & Diagrams
As a developer, I want to see the system architecture at a glance.
**Acceptance Criteria:**
- Add "Architecture" section.
- Embed a Mermaid Sequence Diagram showing the Ralph Loop flow.
- Embed a Class Diagram showing the Core Agent structure (Agent -> LLM -> Tools).
- Link to `docs/ARCHITECTURE.md` for full details.
- [Verify] Diagrams render correctly in GitHub Markdown.

## Functional Requirements
- FR-1: Update `README.md` and `README_zh-CN.md` concurrently.
- FR-2: Ensure Mermaid syntax is valid.
