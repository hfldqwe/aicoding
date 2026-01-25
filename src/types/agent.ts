import { IContextManager } from './context.js';
import { IEventBus } from './events.js';
import { IToolRegistry } from './tool.js';
import { ILLMProvider } from './llm.js';

/**
 * The main Agent orchestrator.
 * Follows the Single Responsibility Principle: It only orchestrates.
 * Logic for tools, context, and LLM communication is delegated.
 */
export interface IAgent {
    readonly context: IContextManager;
    readonly tools: IToolRegistry;
    readonly llm: ILLMProvider;
    readonly events: IEventBus;

    /**
     * Starts the main loop: User Input -> Thought -> Tool/Answer -> UI.
     * @param instruction The user's initial prompt or command.
     */
    run(instruction: string): Promise<void>;

    /**
     * Gracefully shuts down the agent loop.
     */
    stop(): void;
}
