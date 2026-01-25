
import { IContextManager, IChatMessage } from '../../types/context.js';

export class InMemoryContextManager implements IContextManager {
    private history: IChatMessage[] = [];

    async getHistory(): Promise<IChatMessage[]> {
        return [...this.history];
    }

    async addMessage(message: IChatMessage): Promise<void> {
        this.history.push(message);
    }

    async clear(): Promise<void> {
        this.history = [];
    }

    async getTokenCount(): Promise<number> {
        // Placeholder: rough estimate (char count / 4)
        return this.history.reduce((acc, msg) => acc + msg.content.length, 0) / 4;
    }
}
