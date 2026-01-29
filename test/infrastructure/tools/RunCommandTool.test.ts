import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RunCommandTool } from '../../../src/infrastructure/tools/RunCommandTool.js';
import { IConfigProvider } from '../../../src/types/config.js';
import { ISecurityService } from '../../../src/types/security.js';

vi.mock('child_process', () => ({
    exec: vi.fn((cmd, opts, cb) => {
        if (typeof opts === 'function') {
            cb = opts;
            opts = {};
        }
        if (cmd.includes('fail')) {
            cb(new Error('Command failed'), '', 'Error output');
        } else {
            // Hack: util.promisify(mock) resolves to the second argument (value).
            // We pass an object so that destructuring { stdout, stderr } works.
            cb(null, { stdout: 'Success output', stderr: '' });
        }
    })
}));

describe('RunCommandTool', () => {
    let tool: RunCommandTool;
    let mockConfig: IConfigProvider;
    let mockSecurity: ISecurityService;

    beforeEach(() => {
        mockConfig = {
            get: vi.fn(),
            load: vi.fn(),
        };
        mockSecurity = {
            validateCommand: vi.fn().mockResolvedValue(undefined)
        };

        tool = new RunCommandTool(mockConfig, mockSecurity);
    });

    it('should have correct name and description', () => {
        expect(tool.name).toBe('run_command');
        expect(tool.description).toContain('Executes shell commands');
    });

    it('should execute valid command', async () => {
        const result = await tool.execute({ command: 'echo hello' });
        expect(result).toBe('Success output');
        expect(mockSecurity.validateCommand).toHaveBeenCalledWith('echo hello');
    });

    it('should fail if command is missing', async () => {
        await expect(tool.execute({})).rejects.toThrow('Command is required');
    });

    it('should fail if command fails', async () => {
        await expect(tool.execute({ command: 'fail' })).rejects.toThrow('Command failed');
    });

    it('should fail if security check fails', async () => {
        mockSecurity.validateCommand = vi.fn().mockRejectedValue(new Error('Security denied'));
        await expect(tool.execute({ command: 'rm -rf' })).rejects.toThrow('Security denied');
    });
});
