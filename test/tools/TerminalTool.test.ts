
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerminalTool } from '../../src/tools/TerminalTool.js';
import { IConfigProvider } from '../../src/types/config.js';
import { IRenderer, ConfirmResult } from '../../src/types/ui.js';

vi.mock('child_process', () => ({
    exec: vi.fn(),
}));

import { exec } from 'child_process';

describe('TerminalTool Security', () => {
    let tool: TerminalTool;
    let mockConfig: IConfigProvider;
    let mockRenderer: IRenderer;
    let mockExec: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockExec = exec as unknown as ReturnType<typeof vi.fn>;

        mockExec.mockImplementation((cmd: string, cb: any) => cb(null, { stdout: 'done', stderr: '' }));

        mockConfig = {
            get: vi.fn((key) => {
                if (key === 'security') {
                    return {
                        confirmDangerousTools: true,
                        dangerousCommands: ['^rm ', '^git push'],
                    };
                }
                return {};
            }),
            load: vi.fn(),
        } as unknown as IConfigProvider;

        mockRenderer = {
            confirmAction: vi.fn(),
            askUser: vi.fn(),
        } as unknown as IRenderer;

        tool = new TerminalTool(mockConfig, mockRenderer);
    });

    it('should execute allowed commands without confirmation', async () => {
        await tool.execute({ command: 'ls -la' });
        expect(mockRenderer.confirmAction).not.toHaveBeenCalled();
        expect(mockExec).toHaveBeenCalledWith('ls -la', expect.any(Function));
    });

    it('should ask for confirmation when executing dangerous command', async () => {
        (mockRenderer.confirmAction as any).mockResolvedValue(ConfirmResult.ALLOW);

        await tool.execute({ command: 'rm -rf ./node_modules' });

        expect(mockRenderer.confirmAction).toHaveBeenCalled();
        expect(mockExec).toHaveBeenCalledWith('rm -rf ./node_modules', expect.any(Function));
    });

    it('should block command when user denies', async () => {
        (mockRenderer.confirmAction as any).mockResolvedValue(ConfirmResult.DENY);
        (mockRenderer.askUser as any).mockResolvedValue('No way');

        await expect(tool.execute({ command: 'rm -rf /' }))
            .rejects.toThrow('User denied the execution');

        expect(mockExec).not.toHaveBeenCalled();
    });

    it('should respect "Always Allow" content for the session', async () => {
        // First try: Always Allow
        (mockRenderer.confirmAction as any).mockResolvedValue(ConfirmResult.ALWAYS_ALLOW);
        await tool.execute({ command: 'rm file1.txt' });
        expect(mockRenderer.confirmAction).toHaveBeenCalledTimes(1);

        // Second try: different command but same pattern
        await tool.execute({ command: 'rm file2.txt' });
        expect(mockRenderer.confirmAction).toHaveBeenCalledTimes(1); // No second call
    });

    it('should skip security check if disabled in config', async () => {
        (mockConfig.get as any).mockReturnValue({ confirmDangerousTools: false });

        await tool.execute({ command: 'rm -rf /' });

        expect(mockRenderer.confirmAction).not.toHaveBeenCalled();
        expect(mockExec).toHaveBeenCalled();
    });
});
