
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceTool } from '../src/tools/WorkspaceTool.js';
import { exec } from 'child_process';
import path from 'path';

vi.mock('child_process');

describe('WorkspaceTool', () => {
    let tool: WorkspaceTool;
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.resetAllMocks();
        tool = new WorkspaceTool();
    });

    describe('getRoot', () => {
        it('should return the workspace root path', async () => {
            const mockRoot = process.cwd();
            const result = await tool.execute({ command: 'getRoot' });
            expect(result).toBe(JSON.stringify({ root: mockRoot }));
        });
    });

    describe('listFiles', () => {
        it('should list files respecting .gitignore using git ls-files', async () => {
            mockExec.mockImplementation((cmd: string, opt: any, callback: any) => {
                const cb = callback;
                if (cmd.startsWith('git ls-files')) {
                    cb(null, 'src/index.ts\npackage.json', '');
                }
            });

            const result = await tool.execute({ command: 'listFiles' });
            expect(JSON.parse(result)).toEqual(['src/index.ts', 'package.json']);
            expect(mockExec).toHaveBeenCalledWith(
                expect.stringContaining('git ls-files'),
                expect.anything(), // options
                expect.any(Function)
            );
        });

        it('should handle git errors gracefully', async () => {
            mockExec.mockImplementation((cmd: string, opt: any, callback: any) => {
                const cb = callback;
                cb(new Error('Git not found'), '', '');
            });

            await expect(tool.execute({ command: 'listFiles' })).rejects.toThrow('Git not found');
        });
    });

    describe('getGitStatus', () => {
        it('should return structured git status', async () => {
            // Mock git branch output
            mockExec.mockImplementation((cmd: string, opt: any, callback: any) => {
                // Handle 2-arg signature (cmd, callback) vs 3-arg (cmd, options, callback)
                const cb = callback || opt;
                if (cmd.includes('rev-parse')) {
                    cb(null, 'main\n', '');
                } else if (cmd.includes('status -s')) {
                    cb(null, ' M src/index.ts\n?? new-file.ts\nA  staged.ts', '');
                } else {
                    cb(new Error(`Unexpected command: ${cmd}`), '', '');
                }
            });

            const result = await tool.execute({ command: 'getGitStatus' });
            const status = JSON.parse(result);

            expect(status.branch).toBe('main');
        });
    });
});
