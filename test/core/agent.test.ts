
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReActAgent } from '../../src/core/agent.js';
import { IContextManager, IChatMessage } from '../../src/types/context.js';
import { ILLMProvider } from '../../src/types/llm.js';
import { IToolRegistry, ITool } from '../../src/types/tool.js';
import { IEventBus } from '../../src/types/events.js';

describe('ReActAgent', () => {
    let agent: ReActAgent;
    let mockContext: IContextManager;
    let mockTools: IToolRegistry;
    let mockLLM: ILLMProvider;
    let mockEvents: IEventBus;

    beforeEach(() => {
        mockContext = {
            addMessage: vi.fn(),
            getHistory: vi.fn().mockResolvedValue([]),
            getTokenCount: vi.fn().mockResolvedValue(0),
            clear: vi.fn()
        };

        const mockTool: ITool = {
            name: 'test_tool',
            description: 'A test tool',
            parameters: { type: 'object', properties: {} },
            execute: vi.fn().mockResolvedValue('tool_result')
        };

        mockTools = {
            register: vi.fn(),
            get: vi.fn().mockReturnValue(mockTool),
            getAll: vi.fn().mockReturnValue([mockTool]),
            getDefinitions: vi.fn().mockReturnValue([])
        };

        mockLLM = {
            chat: vi.fn(),
            chatStream: vi.fn(),
            healthCheck: vi.fn()
        };

        mockEvents = {
            emit: vi.fn(),
            on: vi.fn()
        };

        agent = new ReActAgent(mockContext, mockTools, mockLLM, mockEvents);
    });

    it('should initialize with system prompt', async () => {
        vi.mocked(mockLLM.chat).mockResolvedValue('Final Answer: Done');
        await agent.run('Task');
        expect(mockContext.addMessage).toHaveBeenCalledWith(expect.objectContaining({ role: 'system' }));
        expect(mockContext.addMessage).toHaveBeenCalledWith(expect.objectContaining({ role: 'user', content: 'Task' }));
    });

    it('should handle Final Answer', async () => {
        vi.mocked(mockLLM.chat).mockResolvedValue('Thought: I know.\nFinal Answer: Result');
        await agent.run('Task');
        expect(mockLLM.chat).toHaveBeenCalledTimes(1);
        expect(mockContext.addMessage).toHaveBeenCalledWith(expect.objectContaining({ content: 'Thought: I know.\nFinal Answer: Result' }));
    });

    it('should handle Tool Call loop', async () => {
        // First response: Call tool
        vi.mocked(mockLLM.chat).mockResolvedValueOnce('Thought: Need tool.\nAction: test_tool\nAction Input: {}');
        // Second response: Final answer
        vi.mocked(mockLLM.chat).mockResolvedValueOnce('Thought: Got it.\nFinal Answer: Success');

        await agent.run('Task');

        // Verify tool execution
        expect(mockTools.get).toHaveBeenCalledWith('test_tool');
        expect(mockContext.addMessage).toHaveBeenCalledWith(expect.objectContaining({ content: 'Observation: tool_result' }));

        // Verify LLM called twice
        expect(mockLLM.chat).toHaveBeenCalledTimes(2);
    });

    it('should handle undefined tool', async () => {
        // First response: Call unknown tool
        vi.mocked(mockLLM.chat).mockResolvedValueOnce('Action: unknown_tool\nAction Input: {}');
        // Second response: Handle error and finish
        vi.mocked(mockLLM.chat).mockResolvedValueOnce('Final Answer: Error handled');

        vi.mocked(mockTools.get).mockReturnValue(undefined);

        await agent.run('Task');

        expect(mockContext.addMessage).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('Error: Tool unknown_tool not found')
        }));
    });
});
