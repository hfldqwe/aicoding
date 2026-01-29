import { ReActAgent } from '../../src/core/agent.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
const mockContext = {
    getHistory: vi.fn(),
    addMessage: vi.fn(),
    switchSession: vi.fn(),
};

const mockTools = {
    get: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    register: vi.fn(),
};

const mockLlm = {
    chat: vi.fn(),
};

const mockEvents = {
    emit: vi.fn(),
    on: vi.fn(),
};

const mockSkillRegistry = {
    getSkills: vi.fn().mockReturnValue([]),
};

describe('ReActAgent Parsing Logic', () => {
    let agent: ReActAgent;

    beforeEach(() => {
        agent = new ReActAgent(
            mockContext as any,
            mockTools as any,
            mockLlm as any,
            mockEvents as any,
            mockSkillRegistry as any
        );
    });

    // Helper to access private method if we were testing it directly,
    // but here we might need to test via run or just expose the parsing logic if we refactor it.
    // Since the plan involves extracting `parseAction`, let's assume we can test it specifically 
    // OR we test the behavior via `run` loop but that's harder without mocking the loop.
    // Ideally, we should export the parsing logic or make it public/internal for testing.
    // For now, let's verify the Regex logic by copying it here or (better) 
    // implementing the test AFTER the refactor involves extracting the method.
    //
    // WAIT: The plan says "Refactor `src/core/Agent.ts` to improve parsing logic".
    // So I will implement the test targeting the *new intended* `parseAction` method.
    // But since the method doesn't exist yet, I cannot import it.
    // 
    // Alternatively, I can test the `run` method with mocked LLM responses that trigger the bug.

    it('should parse Action Input correctly when cleaner stop tokens are missing but content is valid JSON', async () => {
        // Setup
        mockContext.getHistory.mockResolvedValue([]);
        mockLlm.chat.mockResolvedValueOnce(`Thought: Use workspace tool
Action: workspace_tool
Action Input: { "command": "getRoot" }`);

        // We mock the tool execution to break the loop or throw specific error if parsing fails
        mockTools.get.mockReturnValue({
            execute: vi.fn().mockResolvedValue('success')
        });

        // We only want to run one iteration
        // agent.maxIterations = 1; // private, can't set easily. 
        // But the loop breaks if "Final Answer" or if no action found.
        // If action found, it executes.

        // We can spy on events to see if tool:call was emitted with correct args
        await agent.run('test instruction');

        expect(mockEvents.emit).toHaveBeenCalledWith('tool:call', {
            toolName: 'workspace_tool',
            args: { command: 'getRoot' }
        });
    });

    it('should parse Action Input via regex with trailing tokens (Reproduction)', async () => {
        // This is the bug: <|tool_call_end|> breaks JSON.parse
        mockContext.getHistory.mockResolvedValue([]);
        mockLlm.chat.mockResolvedValueOnce(`Thought: I will list files.
Action: workspace_tool
Action Input: { "command": "listFiles" }
<|tool_call_end|>`);

        mockTools.get.mockReturnValue({
            execute: vi.fn().mockResolvedValue('success')
        });

        // Without the fix, this might throw "Invalid JSON" and then chat again (loop)
        // or just fail. 
        // We want to verify it SUCCEEDS now (after fix).
        // Before fix, this test is expected to FAIL (or emit an error event).

        try {
            await agent.run('test instruction');
        } catch (e) {
            // caught
        }

        // We expect correct parsing
        expect(mockEvents.emit).toHaveBeenCalledWith('tool:call', {
            toolName: 'workspace_tool',
            args: { command: 'listFiles' }
        });
    });
});
