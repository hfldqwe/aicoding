#!/usr/bin/env node
import { Command } from 'commander';
import { ConfigProvider } from './infrastructure/config/ConfigProvider.js';
import { OpenAIProvider } from './core/llm-provider.js';
import { ToolRegistry } from './core/tool-registry.js';
import { ReActAgent } from './core/agent.js';
import { TerminalRenderer } from './infrastructure/ui/TerminalRenderer.js';
import { EventBus } from './infrastructure/events/EventBus.js';
import { InMemoryContextManager } from './infrastructure/context/InMemoryContextManager.js';
import { FileSystemTool } from './tools/FileSystemTool.js';
import { LocalWorkspace } from './infrastructure/workspace/LocalWorkspace.js';
import { TerminalTool } from './tools/TerminalTool.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

async function main() {
    const configProvider = new ConfigProvider();
    await configProvider.load();
    const llmConfig = configProvider.get('llm');
    const wsRoot = configProvider.get('workspaceRoot');

    program
        .name('aicoding')
        .description('AI Agent CLI for Coding')
        .version(pkg.version);

    program
        .command('start', { isDefault: true })
        .description('Start the AI Agent interactive session')
        .action(async () => {
            if (!llmConfig.apiKey) {
                console.error('Error: AICODING_API_KEY is missing.');
                process.exit(1);
            }

            // 1. Initialize Infrastructure
            const events = new EventBus();
            const context = new InMemoryContextManager();
            const renderer = new TerminalRenderer();

            // 2. Initialize Core
            const llm = new OpenAIProvider({
                apiKey: llmConfig.apiKey,
                modelName: llmConfig.model,
                baseURL: llmConfig.baseUrl,
            });

            const tools = new ToolRegistry();
            if (!wsRoot) {
                throw new Error("Workspace root not found in config");
            }
            tools.register(new FileSystemTool(new LocalWorkspace(wsRoot)));
            tools.register(new TerminalTool(configProvider, renderer));

            const agent = new ReActAgent(context, tools, llm, events);

            // 3. Wire Events
            events.on('agent:thought', (p) => {
                renderer.renderMessage('assistant', p.content);
            });

            events.on('tool:call', (p) => {
                renderer.renderToolUse(p.toolName, 'running');
            });

            events.on('tool:result', (p) => {
                const status = p.error ? 'failed' : 'completed';
                const output = p.error || (typeof p.result === 'string' ? p.result : JSON.stringify(p.result));
                renderer.renderToolUse(p.toolName, status, output.substring(0, 100));
            });

            // 4. Start Loop
            renderer.renderMessage('system', `Welcome to aicoding v${pkg.version}.`);

            while (true) {
                try {
                    const input = await renderer.askUser('You: ');
                    if (input.toLowerCase() === '/exit') {
                        process.exit(0);
                    }

                    renderer.startSpinner('Thinking...');
                    await agent.run(input);
                    renderer.stopSpinner();

                } catch (error: any) {
                    renderer.stopSpinner();
                    renderer.renderMessage('system', `Error: ${error.message}`);
                }
            }
        });

    program.parse(process.argv);
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
