
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReActAgent } from '../../src/core/agent.js';
import { ToolRegistry } from '../../src/core/tool-registry.js';
import { IContextManager } from '../../src/types/context.js';
import { ILLMProvider } from '../../src/types/llm.js';
import { IEventBus } from '../../src/types/events.js';
import { ITool } from '../../src/types/tool.js';

describe('Agent Integration', () => {
    let agent: ReActAgent;
    let registry: ToolRegistry;
    let mockContext: IContextManager;
    let mockLLM: ILLMProvider;
    let mockEvents: IEventBus;

    beforeEach(() => {
        // 1. Setup Registry with Real Tools
        registry = new ToolRegistry();

        const reverseTool: ITool = {
            name: 'reverse',
            description: 'Reverses a string',
            parameters: { type: 'object', properties: { input: { type: 'string' } } },
            execute: async (args: any) => args.input.split('').reverse().join('')
        };
        registry.register(reverseTool);

        // 2. Mock Context & Events
        const history: any[] = [];
        mockContext = {
            addMessage: vi.fn((msg) => history.push(msg)),
            getHistory: vi.fn().mockResolvedValue(history),
            getTokenCount: vi.fn().mockResolvedValue(0),
            clear: vi.fn()
        };

        mockEvents = {
            emit: vi.fn(),
            on: vi.fn()
        };

        // 3. Mock LLM to simulate "Thought process"
        mockLLM = {
            chat: vi.fn()
                .mockResolvedValueOnce('Thought: I need to reverse "hello".\nAction: reverse\nAction Input: {"input": "hello"}')
                .mockResolvedValueOnce('Thought: The result is "olleh".\nFinal Answer: olleh'),
            chatStream: vi.fn(),
            healthCheck: vi.fn().mockResolvedValue(true)
        };

        agent = new ReActAgent(mockContext, registry, mockLLM, mockEvents);
    });

    it('should execute a full ReAct loop with real tools', async () => {
        await agent.run('Reverse "hello"');

        // Verify correct flow
        // 1. Tool selection
        expect(mockLLM.chat).toHaveBeenCalledTimes(2);

        // 2. Tool Execution (Registry lookup + Execute)
        // Check if observation was added to context
        expect(mockContext.addMessage).toHaveBeenCalledWith(expect.objectContaining({
            role: 'user',
            content: 'Observation: olleh'
        }));

        // 3. Final Answer
        expect(mockEvents.emit).toHaveBeenCalledWith('agent:thought', expect.objectContaining({
            content: expect.stringContaining('Final Answer: olleh')
        }));
    });
});
