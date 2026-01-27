# US-002: MCP Client Core Integration

## Goal Description
Fully implement the **Model Context Protocol (MCP)** client core to enable `aicoding` to connect with local and remote tools. This involves a "Polyglot Client" architecture supporting both `stdio` and `sse` transports, complying with the official `@modelcontextprotocol/sdk`.

## User Review Required
> [!IMPORTANT]
> **Polymorphic Configuration**: `mcpServers` in `config.ts` will now support a union type for `stdio` and `sse` configurations.
> **Process Management**: The system will spawn child processes for `stdio`. We must ensure these are killed on exit (Graceful Shutdown).
> **Dependencies**: Adding `@modelcontextprotocol/sdk` and `eventsource`.

## Proposed Changes

### Configuration & Types
#### [MODIFY] [config.ts](file:///c:/Users/19410/Documents/Project/aicoding/src/types/config.ts)
- Add `mcpServers` to `IConfig` interface.
- Define `McpServerConfig` union type (`StdioServerConfig | SseServerConfig`).

#### [NEW] [mcp.ts](file:///c:/Users/19410/Documents/Project/aicoding/src/types/mcp.ts)
- Define `IMCPClient` interface.
- Define `IMCPClientFactory` interface.

### Core Implementation
#### [NEW] [MCPClientFactory.ts](file:///c:/Users/19410/Documents/Project/aicoding/src/mcp/MCPClientFactory.ts)
- Implement factory to create clients based on config type.
- Handle fallback logic (log error and continue if one server fails).

#### [NEW] [StdioClientTransport.ts](file:///c:/Users/19410/Documents/Project/aicoding/src/mcp/transports/StdioClientTransport.ts)
- Wrap `@modelcontextprotocol/sdk/client/stdio.js` properties.
- Manage `spawn` and PID tracking.

#### [NEW] [SSEClientTransport.ts](file:///c:/Users/19410/Documents/Project/aicoding/src/mcp/transports/SSEClientTransport.ts)
- Implement SSE transport using `eventsource` polyfill.
- Handle connection establishment.

#### [NEW] [UniversalMCPAdapter.ts](file:///c:/Users/19410/Documents/Project/aicoding/src/mcp/UniversalMCPAdapter.ts)
- Adapter to convert MCP `ListToolsResult` to `ITool`.
- Handle namespace prefixing (e.g., `serverName__toolName`).

#### [MODIFY] [index.ts](file:///c:/Users/19410/Documents/Project/aicoding/src/index.ts)
- Initialize `MCPClientFactory` on startup.
- Register `dispose` hooks to kill processes/close connections on exit.

## Verification Plan

### Automated Tests
- **Config Validation**: unit test to ensure `mcpServers` parses correctly.
- **Factory Logic**: unit test to verify correct transport is chosen based on config.
- **Resilience**: unit test to simulate a failed connection and ensure `MCPClientFactory` does not throw (returns null or empty/logs error).
- **Graceful Shutdown**: Integration test spawning a dummy process and verifying it receives a kill signal (mocked).

### Manual Verification
1.  **Stdio Test**: Configure `aicoding` to use `git` MCP server (if available via `uvx`) or a simple echo script.
2.  **SSE Test**: Run a local mock SSE server and configure `aicoding` to connect to it.
3.  **Tool Listing**: Verify that tools appear in the system with correct prefixes.
