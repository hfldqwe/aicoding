import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ReActAgent } from '../../src/core/agent.js';
import { ToolRegistry } from '../../src/infrastructure/tools/ToolRegistry.js';
import { FileSystemSkillRegistry } from '../../src/infrastructure/skill/FileSystemSkillRegistry.js';
import { LoadSkillTool } from '../../src/tools/skill/LoadSkillTool.js';
import { JsonlContextManager } from '../../src/infrastructure/context/JsonlContextManager.js';
import { EventBus } from '../../src/infrastructure/events/EventBus.js';
import { FileSystemTool } from '../../src/tools/FileSystemTool.js';
import { LocalWorkspace } from '../../src/infrastructure/workspace/LocalWorkspace.js';
import { ILLMProvider, IStreamChunk } from '../../src/types/llm.js';
import { IChatMessage } from '../../src/types/context.js';

// Mock LLM
class MockLLM implements ILLMProvider {
    name = 'mock-llm';

    constructor(private responses: string[]) { }

    async chat(messages: IChatMessage[]): Promise<string> {
        return this.responses.shift() || 'Final Answer: Done';
    }

    async *chatStream(messages: IChatMessage[]): AsyncIterable<IStreamChunk> {
        const response = await this.chat(messages);
        yield {
            content: response,
            isCompleted: true
        };
    }

    async healthCheck(): Promise<boolean> {
        return true;
    }
}

describe('Skill System Bootstrap Integration', () => {
    let tempDir: string;
    let skillRegistry: FileSystemSkillRegistry;
    let tools: ToolRegistry;
    let agent: ReActAgent;
    let context: JsonlContextManager;
    let events: EventBus;
    let mockLLM: MockLLM;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aicoding-bootstrap-'));
        const skillsDir = path.join(tempDir, '.aicoding', 'skills');
        await fs.mkdir(skillsDir, { recursive: true });

        // Create 'skill-creator' skill
        const creatorPath = path.join(skillsDir, 'skill-creator');
        await fs.mkdir(creatorPath);
        await fs.writeFile(path.join(creatorPath, 'SKILL.md'), `---
name: skill-creator
description: Guide to create skills
---
# Skill Creator Guide
To create a skill, make a new folder in .aicoding/skills with SKILL.md.
`);

        // Setup infrastructure
        skillRegistry = new FileSystemSkillRegistry(tempDir);
        await skillRegistry.init();

        tools = new ToolRegistry();
        tools.register(new LoadSkillTool(skillRegistry));
        tools.register(new FileSystemTool(new LocalWorkspace(tempDir)));

        context = new JsonlContextManager('test-session', tempDir);
        events = new EventBus();

        events.on('tool:call', (d) => console.log('Tool Call:', JSON.stringify(d)));
        events.on('tool:result', (d) => console.log('Tool Result:', JSON.stringify(d)));
        events.on('agent:thought', (d) => console.log('Agent Thought:', d));


        // Check if context file exists, if no create it (normally handled by ContextManager but strictly needed for test?)
        // ContextManager usually creates file on write.
    });

    afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should allow agent to load skill-creator and create a new skill', async () => {
        // Mock LLM Workflow:
        // 1. Agent decides to load skill-creator
        // 2. Agent decides to write new skill

        mockLLM = new MockLLM([
            // Turn 1: Load Skill
            'Thought: I need to check how to create a skill.\nAction: load_skill\nAction Input: { "skill_name": "skill-creator" }',

            // Turn 2: Create new skill based on instructions
            // Note: Content JSON string needs to be valid. 
            // We use simple content to avoid escaping hell in test code.
            'Thought: I have the guide. I will create a new skill called "hello-world".\nAction: filesystem_tool\nAction Input: { "operation": "write_file", "path": ".aicoding/skills/hello-world/SKILL.md", "content": "---\\nname: hello-world\\ndescription: A hello world skill\\n---\\n# Hello World\\nThis is a test skill." }',

            // Turn 3: Done
            'Final Answer: I have created the hello-world skill.'
        ]);

        agent = new ReActAgent(context, tools, mockLLM, events, skillRegistry);

        await agent.run('Create a new skill called hello-world');

        // Verify "hello-world" exists
        const newSkillPath = path.join(tempDir, '.aicoding', 'skills', 'hello-world', 'SKILL.md');
        const exists = await fs.stat(newSkillPath).then(() => true).catch(() => false);

        expect(exists).toBe(true);

        const content = await fs.readFile(newSkillPath, 'utf-8');
        expect(content).toContain('name: hello-world');
    });
});
