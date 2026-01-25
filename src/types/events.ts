import { IDisposable } from './common.js';

/**
 * Type-safe event definitions.
 * Key: Event Name
 * Value: Event Payload
 */
export type SystemEvents = {
    'agent:start': { taskId: string };
    'agent:thought': { content: string };
    'tool:call': { toolName: string; args: unknown };
    'tool:result': { toolName: string; result: unknown; error?: string };
    'llm:request': { model: string; tokenCount: number };
    'llm:response': { content: string; tokenCount: number };
    'ui:input': { content: string };
};

/**
 * A strongly-typed event bus to decouple components.
 * UI listens to this, Agent emits to this.
 */
export interface IEventBus {
    emit<K extends keyof SystemEvents>(event: K, payload: SystemEvents[K]): void;
    on<K extends keyof SystemEvents>(event: K, listener: (payload: SystemEvents[K]) => void): IDisposable;
}
