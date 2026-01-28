import { IAgent } from '../types/agent.js';
import { IContextManager, IChatMessage } from '../types/context.js';
import { IEventBus } from '../types/events.js';
import { ILLMProvider } from '../types/llm.js';
import { IToolRegistry } from '../types/tool.js';
import { ISkillRegistry } from '../types/skill.js';
import { getSystemPrompt } from './prompts.js';

export class ReActAgent implements IAgent {
    private maxIterations = 10;

    constructor(
        readonly context: IContextManager,
        readonly tools: IToolRegistry,
        readonly llm: ILLMProvider,
        readonly events: IEventBus,
        readonly skillRegistry: ISkillRegistry
    ) { }

    async run(instruction: string): Promise<void> {
        this.events.emit('agent:start', { taskId: instruction });

        // 1. Initialize Context with System Prompt
        // We clean context for a fresh run or append? The interface suggests run takes an instruction.
        // Usually, we might want to keep history. Let's assume we append.
        // But we need to ensure System Prompt is present and up-to-date with tools.
        // For simplicity, we'll assume the context manager handles the "shared" history, 
        // but we verify if we need to inject the system prompt.

        const toolsHelp = this.tools.getAll().map(t =>
            `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`
        ).join('\n');

        const skills = this.skillRegistry.getSkills();
        const skillsHelp = skills.length > 0
            ? skills.map(s => `- ${s.name}: ${s.description}`).join('\n')
            : 'No skills available.';

        const systemPrompt = getSystemPrompt(toolsHelp, skillsHelp);

        // Check if system prompt is already the first message? 
        // For now, let's just add the instruction. 
        // Ideally, we should set the system prompt. 
        // Since IContextManager doesn't have setSystemPrompt, we'll assume the LLM Provider or we prepend it.
        // Let's prepend it to the history we send to the LLM, or add it as a transient message.
        // However, context.addMessage is persistent.
        // Let's add the system prompt if the history is empty.

        const history = await this.context.getHistory();
        if (history.length === 0) {
            this.context.addMessage({ role: 'system', content: systemPrompt });
        }

        this.context.addMessage({ role: 'user', content: instruction });
        this.events.emit('ui:input', { content: instruction });

        let iterations = 0;
        while (iterations < this.maxIterations) {
            iterations++;

            const messages = await this.context.getHistory();
            this.events.emit('llm:request', { model: 'unknown', tokenCount: 0 }); // Token count placeholder

            const response = await this.llm.chat(messages);

            this.events.emit('llm:response', { content: response, tokenCount: 0 });
            this.context.addMessage({ role: 'assistant', content: response });
            this.events.emit('agent:thought', { content: response });

            if (response.includes('Final Answer:')) {
                const finalAnswer = response.split('Final Answer:')[1].trim();
                // Optionally emit a specific event for success, but 'agent:thought' covers it.
                break;
            }

            const actionMatch = response.match(/Action:\s*(.+)/);
            const inputMatch = response.match(/Action Input:\s*(.+)/s); // Dot matches newline

            if (actionMatch && inputMatch) {
                const toolName = actionMatch[1].trim();
                const inputStr = inputMatch[1].trim();

                try {
                    const tool = this.tools.get(toolName);
                    if (!tool) {
                        throw new Error(`Tool ${toolName} not found`);
                    }

                    let args;
                    try {
                        args = JSON.parse(inputStr);
                    } catch (e) {
                        // Try to fix common JSON issues or just fail
                        throw new Error(`Invalid JSON in Action Input: ${inputStr}`);
                    }

                    this.events.emit('tool:call', { toolName, args });

                    const result = await tool.execute(args);

                    this.events.emit('tool:result', { toolName, result });

                    const observation = `Observation: ${result}`;
                    this.context.addMessage({ role: 'user', content: observation }); // Using 'user' role for observation in ReAct text pattern

                } catch (error: any) {
                    const errorMsg = `Observation: Error: ${error.message}`;
                    this.context.addMessage({ role: 'user', content: errorMsg });
                    this.events.emit('tool:result', { toolName, result: null, error: error.message });
                }
            } else {
                // No action found, but also no Final Answer?
                // The LLM might be just thinking or asking for more info.
                // In strict ReAct, it should always be Thought -> Action or Final Answer.
                // If it just talks, maybe it's waiting for user? 
                // We break if it looks like it's done or waiting for user input (which we don't handle in this loop currently).
                // Let's assume if no Action, validation fail or it's a question.
                // For now, break to avoid infinite loops if it's just chatting. 
                // Unless we want to support "Ask User".
                break;
            }
        }
    }

    stop(): void {
        // Implement cancellation logic if needed (e.g. AbortController)
    }
}
