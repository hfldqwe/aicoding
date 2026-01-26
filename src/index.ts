#!/usr/bin/env node
import { Command } from 'commander';
import { ConfigProvider } from './infrastructure/config/ConfigProvider.js';
import { OpenAIProvider } from './core/llm-provider.js';
import { ToolRegistry } from './core/tool-registry.js';
import { ReActAgent } from './core/agent.js';
import { TerminalRenderer } from './infrastructure/ui/TerminalRenderer.js';
import { EventBus } from './infrastructure/events/EventBus.js';
import { JsonlContextManager } from './infrastructure/context/JsonlContextManager.js';
import { randomUUID } from 'crypto';
import { FileSystemTool } from './tools/FileSystemTool.js';
import { LocalWorkspace } from './infrastructure/workspace/LocalWorkspace.js';
import { TerminalTool } from './tools/TerminalTool.js';
import { WorkspaceTool } from './tools/WorkspaceTool.js';
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
        .command('list')
        .description('List recent sessions')
        .action(async () => {
            const wsRoot = configProvider.get('workspaceRoot');
            if (!wsRoot) {
                console.error('Workspace root not configured.');
                return;
            }
            const sessions = await JsonlContextManager.listSessions(wsRoot);
            if (sessions.length === 0) {
                console.log('No sessions found.');
                return;
            }
            console.log('Available Sessions:');
            sessions.forEach((s, i) => {
                const date = new Date(s.lastModified).toISOString().replace('T', ' ').substring(0, 19);
                console.log(`${i + 1}. [${date}] ${s.id}`);
                console.log(`   Preview: ${s.preview}`);
                console.log('');
            });
        });

    program
        .command('start', { isDefault: true })
        .description('Start the AI Agent interactive session')
        .option('-s, --session-id <id>', 'Session ID for restoring context')
        .option('-p, --pick', 'Interactively select a session to resume')
        .action(async (options) => {
            if (!llmConfig.apiKey) {
                console.error('Error: AICODING_API_KEY is missing.');
                process.exit(1);
            }

            // 1. Initialize Infrastructure
            const events = new EventBus();

            const wsRoot = configProvider.get('workspaceRoot'); // Redundant get but explicit
            if (!wsRoot) throw new Error("Workspace root is required");

            // Session Management
            let sessionId = options.sessionId;

            if (options.pick) {
                const sessions = await JsonlContextManager.listSessions(wsRoot);
                if (sessions.length === 0) {
                    console.log('No sessions found to pick from.');
                } else {
                    const readline = require('readline').createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });

                    console.log('Select a session to resume:');
                    sessions.slice(0, 10).forEach((s, i) => {
                        const date = new Date(s.lastModified).toISOString().replace('T', ' ').substring(0, 19);
                        console.log(`${i + 1}) [${date}] ${s.preview.substring(0, 60)}...`);
                    });
                    console.log('0) Start New Session');

                    await new Promise<void>(resolve => {
                        readline.question('Choice: ', (answer: string) => {
                            const index = parseInt(answer);
                            if (!isNaN(index) && index > 0 && index <= sessions.length) {
                                sessionId = sessions[index - 1].id;
                            }
                            readline.close();
                            resolve();
                        });
                    });
                }
            }

            if (!sessionId) sessionId = randomUUID();

            const context = new JsonlContextManager(sessionId, wsRoot);

            // Notify user of Session ID
            const renderer = new TerminalRenderer();
            renderer.renderMessage('system', `Session ID: ${sessionId}`);

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
            tools.register(new WorkspaceTool());

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
