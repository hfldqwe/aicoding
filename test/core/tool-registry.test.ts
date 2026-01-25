
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolRegistry } from '../../src/core/tool-registry.js';
import { ITool } from '../../src/types/tool.js';

describe('ToolRegistry', () => {
    let registry: ToolRegistry;

    const mockTool: ITool = {
        name: 'test_tool',
        description: 'A test tool',
        parameters: {
            type: 'object',
            properties: {
                arg: { type: 'string' }
            }
        },
        execute: vi.fn().mockResolvedValue('result')
    };

    beforeEach(() => {
        registry = new ToolRegistry();
    });

    it('should register a tool', () => {
        registry.register(mockTool);
        expect(registry.get('test_tool')).toBe(mockTool);
    });

    it('should return undefined for unknown tool', () => {
        expect(registry.get('unknown')).toBeUndefined();
    });

    it('should overwrite existing tool with same name', () => {
        registry.register(mockTool);
        const newTool = { ...mockTool, description: 'new description' };
        registry.register(newTool);
        expect(registry.get('test_tool')).toBe(newTool);
        expect(registry.get('test_tool')?.description).toBe('new description');
    });

    it('should return all tools', () => {
        registry.register(mockTool);
        registry.register({ ...mockTool, name: 'other_tool' });
        const tools = registry.getAll();
        expect(tools).toHaveLength(2);
    });

    it('should return correct definitions', () => {
        registry.register(mockTool);
        const definitions = registry.getDefinitions();
        expect(definitions).toHaveLength(1);
        expect(definitions[0]).toEqual({
            type: 'function',
            function: {
                name: 'test_tool',
                description: 'A test tool',
                parameters: mockTool.parameters
            }
        });
    });
});
