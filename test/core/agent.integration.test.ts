
import { ReActAgent } from '../../src/core/agent.js';
import { ILLMProvider, IStreamChunk } from '../../src/types/llm.js';
import { IChatMessage, IContextManager } from '../../src/types/context.js';
import { IToolRegistry, ITool } from '../../src/types/tool.js';
import { IEventBus } from '../../src/types/events.js';
import { EventEmitter } from 'events';
import assert from 'assert';
import { describe, it, beforeEach } from 'vitest';

class MockEventBus extends EventEmitter implements IEventBus {
    emit(event: string, payload?: any): boolean {
        return super.emit(event, payload);
    }

    // Override 'on' to return IDisposable
    on<K>(event: string | symbol, listener: (...args: any[]) => void): any {
        super.on(event, listener);
        return { dispose: () => this.off(event, listener) };
    }
}

class MockContextManager implements IContextManager {
    private messages: IChatMessage[] = [];

    async getHistory(): Promise<IChatMessage[]> {
        return [...this.messages];
    }

    addMessage(message: IChatMessage): void {
        this.messages.push(message);
    }

    async clear(): Promise<void> {
        this.messages = [];
    }

    async getTokenCount(): Promise<number> {
        return 0;
    }
}

class MockToolRegistry implements IToolRegistry {
    private tools = new Map<string, ITool>();

    register(tool: ITool): void {
        this.tools.set(tool.name, tool);
    }

    get(name: string): ITool | undefined {
        return this.tools.get(name);
    }

    getAll(): ITool[] {
        return Array.from(this.tools.values());
    }

    getDefinitions(): any[] {
        return this.getAll().map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
        }));
    }
}

class ScriptedMockLLM implements ILLMProvider {
    private responses: string[] = [];
    private callCount = 0;

    constructor(responses: string[]) {
        this.responses = responses;
    }

    async chat(messages: IChatMessage[]): Promise<string> {
        if (this.callCount >= this.responses.length) {
            throw new Error('ScriptedMockLLM ran out of responses');
        }
        return this.responses[this.callCount++];
    }

    async *chatStream(messages: IChatMessage[]): AsyncIterable<IStreamChunk> {
        const response = await this.chat(messages);
        yield { content: response, isCompleted: true };
    }

    async healthCheck(): Promise<boolean> { return true; }
}

class MockSkillRegistry {
    async init() { }
    getSkills() { return []; }
    getSkill(name: string) { return undefined; }
    async getSkillContent(name: string) { return undefined; }
}

describe('ReActAgent Integration', () => {
    let context: IContextManager;
    let tools: IToolRegistry;
    let events: IEventBus;
    let skills: any; // MockSkillRegistry

    beforeEach(() => {
        context = new MockContextManager();
        tools = new MockToolRegistry();
        events = new MockEventBus();
        skills = new MockSkillRegistry();
    });

    it('should run a simple conversation loop', async () => {
        const llm = new ScriptedMockLLM([
            'Final Answer: Hello there!'
        ]);

        const agent = new ReActAgent(context, tools, llm, events, skills);

        let thoughtEmitted = false;
        events.on('agent:thought', (payload: any) => {
            if (payload.content.includes('Hello there!')) {
                thoughtEmitted = true;
            }
        });

        await agent.run('Hi');

        assert.ok(thoughtEmitted, 'Agent should emit thought with final answer');
    });

    it('should execute a tool calling loop', async () => {
        // Setup a mock tool
        const mockTool: ITool = {
            name: 'read_secret',
            description: 'Reads a secret',
            parameters: { type: 'object', properties: {} },
            execute: async () => 'THE_SECRET_CODE'
        };
        tools.register(mockTool);

        // Script the interaction
        // 1. Agent sees instruction -> LLM calls tool
        // 2. Agent executes tool -> LLM sees observation -> LLM gives final answer
        const llm = new ScriptedMockLLM([
            'Thought: I need to read the secret.\nAction: read_secret\nAction Input: {}',
            'Thought: I have the secret.\nFinal Answer: The secret is THE_SECRET_CODE'
        ]);

        const agent = new ReActAgent(context, tools, llm, events, skills);

        const toolCalls: string[] = [];
        events.on('tool:call', (payload: any) => {
            toolCalls.push(payload.toolName);
        });

        await agent.run('What is the secret?');

        assert.strictEqual(toolCalls.length, 1);
        assert.strictEqual(toolCalls[0], 'read_secret');

        const history = await context.getHistory();
        const lastMsg = history[history.length - 1];
        assert.ok(lastMsg.content.includes('THE_SECRET_CODE'));
    });
});
