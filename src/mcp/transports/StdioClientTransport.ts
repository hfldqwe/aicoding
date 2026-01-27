// Re-export the SDK's StdioClientTransport
// The SDK implementation handles process spawning.
// We will rely on the Factory to call .close() on the client/transport to ensure processes are killed.
export { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
