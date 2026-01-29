export enum SecurityDecision {
    ALLOW = 'allow',
    DENY = 'deny',
    ALWAYS_ALLOW = 'always_allow' // For whitelisting in session
}

export interface ISecurityService {
    /**
     * Validates if a command is safe to execute.
     * May involve user interaction if the command matches dangerous patterns.
     * @param command The command to check
     * @returns Promise<void> if safe, throws Error if denied
     */
    validateCommand(command: string): Promise<void>;
}
