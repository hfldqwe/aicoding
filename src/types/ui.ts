/**
 * Abstraction for the Terminal UI.
 * Allows switching between raw console, TUI, or Web UI.
 */
export interface IRenderer {
    /**
     * Renders a markdown-formatted message to the user.
     */
    renderMessage(role: string, content: string): void;

    /**
     * Renders a dedicated block for tool execution status.
     */
    renderToolUse(toolName: string, status: 'running' | 'completed' | 'failed', output?: string): void;

    /**
     * Requests input from the user.
     */
    askUser(prompt: string): Promise<string>;

    /**
     * Shows a spinner or loading indicator.
     */
    startSpinner(text: string): void;
    stopSpinner(): void;

    /**
     * Confirms a dangerous action with the user.
     */
    confirmAction(prompt: string): Promise<ConfirmResult>;
}

export enum ConfirmResult {
    ALLOW = 'allow',
    ALWAYS_ALLOW = 'always_allow',
    DENY = 'deny'
}
