import { EventSource } from 'eventsource';

// Polyfill EventSource for Node.js environment
// This is required because @modelcontextprotocol/sdk relies on the browser EventSource API
if (!global.EventSource) {
    // @ts-ignore
    global.EventSource = EventSource;
}

// Re-export the SDK's SSEClientTransport
export { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
