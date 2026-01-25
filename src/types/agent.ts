import { IContextManager } from './context';
import { IEventBus } from './events';
import { IToolRegistry } from './tool';
import { ILLMProvider } from './llm';

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
