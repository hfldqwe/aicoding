import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClientFactory } from '../src/mcp/MCPClientFactory.js';
import { McpServerConfig } from '../src/types/config.js';


// Mock the SDK Client to avoid actual connections AND to spy on calls
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => {
    return {
        Client: class {
            constructor() { }
            connect = vi.fn().mockResolvedValue(undefined);
            close = vi.fn().mockResolvedValue(undefined);
            listTools = vi.fn().mockResolvedValue({ tools: [] });
            callTool = vi.fn().mockResolvedValue({ content: [] });
        }
    };
});

// Mock Transports
vi.mock('../src/mcp/transports/StdioClientTransport.js', () => {
    return {
        StdioClientTransport: class {
            constructor() { }
            start = vi.fn();
            close = vi.fn();
        }
    };
});

vi.mock('../src/mcp/transports/SSEClientTransport.js', () => {
    return {
        SSEClientTransport: class {
            constructor() { }
            start = vi.fn();
            close = vi.fn();
        }
    };
});

describe('MCP Client Integration', () => {
    let factory: MCPClientFactory;

    beforeEach(() => {
        factory = new MCPClientFactory();
        vi.clearAllMocks();
    });

    describe('Factory Logic', () => {
        it('should create StdioClientTransport for stdio config', () => {
            const config: McpServerConfig = {
                type: 'stdio',
                command: 'git',
                args: ['status']
            };
            const client = factory.createClient('test-stdio', config);
            expect(client).toBeDefined();
            expect(client.name).toBe('test-stdio');
        });

        it('should create SSEClientTransport for sse config', () => {
            const config: McpServerConfig = {
                type: 'sse',
                url: 'http://localhost:8080'
            };
            const client = factory.createClient('test-sse', config);
            expect(client).toBeDefined();
        });

        it('should throw error for unknown transport', () => {
            const config: any = { type: 'unknown' };
            expect(() => factory.createClient('test', config)).toThrow('Unknown transport type');
        });
    });

    describe('Resilience', () => {
        it('should return valid clients and skip failed ones in createClientsFromConfig', () => {
            const configs: Record<string, McpServerConfig> = {
                'valid': { type: 'stdio', command: 'echo', args: [] },
                'invalid': { type: 'unknown' } as any
            };

            // Spy on console.error
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const clients = factory.createClientsFromConfig(configs);

            expect(clients.length).toBe(1);
            expect(clients[0].name).toBe('valid');
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });
});
