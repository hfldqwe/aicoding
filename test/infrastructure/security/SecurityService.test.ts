
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityService } from '../../../src/infrastructure/security/SecurityService.js';
import { IConfigProvider } from '../../../src/types/config.js';
import { IRenderer, ConfirmResult } from '../../../src/types/ui.js';
import { ISecurityService } from '../../../src/types/security.js';

describe('SecurityService', () => {
    let securityService: ISecurityService;
    let mockConfig: IConfigProvider;
    let mockRenderer: IRenderer;

    beforeEach(() => {
        mockConfig = {
            get: vi.fn(),
            load: vi.fn(),
        };
        mockRenderer = {
            renderMessage: vi.fn(),
            renderToolUse: vi.fn(),
            askUser: vi.fn(),
            confirmAction: vi.fn(),
            startSpinner: vi.fn(),
            stopSpinner: vi.fn(),
            selectSession: vi.fn(),
            stop: vi.fn(),
        } as unknown as IRenderer;

        securityService = new SecurityService(mockConfig, mockRenderer);
    });

    it('should allow safe commands without confirmation', async () => {
        (mockConfig.get as any).mockReturnValue({
            confirmDangerousTools: true,
            dangerousCommands: ['rm -rf']
        });

        await expect(securityService.validateCommand('ls -la')).resolves.not.toThrow();
        expect(mockRenderer.confirmAction).not.toHaveBeenCalled();
    });

    it('should prompt for dangerous commands', async () => {
        (mockConfig.get as any).mockReturnValue({
            confirmDangerousTools: true,
            dangerousCommands: ['rm -rf']
        });
        (mockRenderer.confirmAction as any).mockResolvedValue(ConfirmResult.ALLOW);

        await expect(securityService.validateCommand('rm -rf /')).resolves.not.toThrow();
        expect(mockRenderer.confirmAction).toHaveBeenCalled();
    });

    it('should throw error if user denies dangerous command', async () => {
        (mockConfig.get as any).mockReturnValue({
            confirmDangerousTools: true,
            dangerousCommands: ['rm -rf']
        });
        (mockRenderer.confirmAction as any).mockResolvedValue(ConfirmResult.DENY);
        (mockRenderer.askUser as any).mockResolvedValue('Too dangerous');

        await expect(securityService.validateCommand('rm -rf /')).rejects.toThrow('User denied');
    });

    it('should respect whitelist for session', async () => {
        (mockConfig.get as any).mockReturnValue({
            confirmDangerousTools: true,
            dangerousCommands: ['rm -rf']
        });

        // First time: ALways Allow
        (mockRenderer.confirmAction as any).mockResolvedValue(ConfirmResult.ALWAYS_ALLOW);
        await securityService.validateCommand('rm -rf /');

        // Second time: Should not prompt
        (mockRenderer.confirmAction as any).mockClear();
        await securityService.validateCommand('rm -rf /etc');
        expect(mockRenderer.confirmAction).not.toHaveBeenCalled();
    });
});
