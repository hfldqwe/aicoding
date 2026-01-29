
import { ISecurityService, SecurityDecision } from '../../types/security.js';
import { IConfigProvider } from '../../types/config.js';
import { IRenderer, ConfirmResult } from '../../types/ui.js';

export class SecurityService implements ISecurityService {
    private sessionAllowedPatterns: Set<string> = new Set();

    constructor(
        private config: IConfigProvider,
        private renderer: IRenderer
    ) { }

    async validateCommand(command: string): Promise<void> {
        const securityConfig = this.config.get('security');

        // If dangerous check is disabled, skip
        if (!securityConfig?.confirmDangerousTools) {
            return;
        }

        const patterns = securityConfig.dangerousCommands || [];

        for (const pattern of patterns) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(command)) {
                // Check if this specific command or pattern is already allowed in this session
                if (this.isAlwaysAllowed(command)) {
                    continue;
                }

                // Intercept and ask user
                const result = await this.renderer.confirmAction(
                    `⚠️ AI 尝试执行危险命令: \`${command}\`。\n该命令匹配安全规则: \`${pattern}\`。\n是否允许执行？`
                );

                if (result === ConfirmResult.ALLOW) {
                    return; // Proceed once
                } else if (result === ConfirmResult.ALWAYS_ALLOW) {
                    this.sessionAllowedPatterns.add(pattern);
                    return; // Proceed and whitelist for session
                } else {
                    // Deny
                    const reason = await this.renderer.askUser('请输入拒绝的原因 (回复 LLM): ');
                    throw new Error(`User denied the execution for security reasons. ${reason ? `Reason: ${reason}` : ''}`);
                }
            }
        }
    }

    private isAlwaysAllowed(command: string): boolean {
        for (const pattern of this.sessionAllowedPatterns) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(command)) {
                return true;
            }
        }
        return false;
    }
}
