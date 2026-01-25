export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface IChatMessage {
    role: Role;
    content: string;
    name?: string; // For tool responses or specific participant names
    toolCallId?: string;
}

export interface IContextManager {
    /**
     * Adds a message to the history and handles internal pruning/sliding window logic.
     */
    addMessage(message: IChatMessage): void;

    /**
     * Retrieves the current context window optimized for the specific model's context limit.
     */
    getHistory(): Promise<IChatMessage[]>;

    /**
     * Returns the estimated token usage of the current context.
     */
    getTokenCount(): Promise<number>;

    /**
     * Clears the current conversation context.
     */
    clear(): void;
}
