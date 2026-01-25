
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileSystemTool } from '../../src/tools/FileSystemTool.js';
import { IWorkspace } from '../../src/types/workspace.js';
import * as path from 'path';

describe('FileSystemTool', () => {
    let tool: FileSystemTool;
    let mockWorkspace: IWorkspace;

    beforeEach(() => {
        // Mock workspace
        mockWorkspace = {
            rootPath: '/mock/root',
            readFile: vi.fn(),
            writeFile: vi.fn(),
            listFiles: vi.fn(),
            exists: vi.fn(),
            mkdir: vi.fn(),
        };

        tool = new FileSystemTool(mockWorkspace);
    });

    it('should be defined', () => {
        expect(tool).toBeDefined();
        expect(tool.name).toBe('filesystem_tool');
    });

    it('should read file successfully', async () => {
        (mockWorkspace.readFile as any).mockResolvedValue('file content');
        const result = await tool.execute({ operation: 'read_file', path: 'test.txt' });
        expect(result).toBe('file content');
        expect(mockWorkspace.readFile).toHaveBeenCalledWith('test.txt');
    });

    it('should write file successfully', async () => {
        const result = await tool.execute({ operation: 'write_file', path: 'test.txt', content: 'hello' });
        expect(result).toMatch(/Successfully/i);
        expect(mockWorkspace.writeFile).toHaveBeenCalledWith('test.txt', 'hello');
    });

    it('should validate arguments', async () => {
        await expect(tool.execute({})).rejects.toThrow();
    });
});
