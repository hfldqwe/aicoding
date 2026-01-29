#!/usr/bin/env node
import { Command } from 'commander';
import { ConfigProvider } from './infrastructure/config/ConfigProvider.js';
import { OpenAIProvider } from './infrastructure/llm/OpenAIProvider.js';
import { ToolRegistry } from './infrastructure/tools/ToolRegistry.js';
import { ReActAgent } from './core/agent.js';
import { TerminalRenderer } from './infrastructure/ui/TerminalRenderer.js';
import { EventBus } from './infrastructure/events/EventBus.js';
import { JsonlContextManager } from './infrastructure/context/JsonlContextManager.js';
import { randomUUID } from 'crypto';
import { FileSystemTool } from './infrastructure/tools/FileSystemTool.js';
import { LocalWorkspace } from './infrastructure/workspace/LocalWorkspace.js';
import { RunCommandTool } from './infrastructure/tools/RunCommandTool.js';
import { WorkspaceTool } from './infrastructure/tools/WorkspaceTool.js';
import { FileSystemSkillRegistry } from './infrastructure/skill/FileSystemSkillRegistry.js';
import { LoadSkillTool } from './infrastructure/tools/LoadSkillTool.js';
import { MCPClientFactory } from './mcp/MCPClientFactory.js';
import { SecurityService } from './infrastructure/security/SecurityService.js';
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

            renderer.renderMessage('system', `Session ID: ${sessionId}`);

            // 2. Initialize Infrastructure (Skills)
            const skillRegistry = new FileSystemSkillRegistry(wsRoot);
            await skillRegistry.init();

            // 3. Initialize Core
            const llm = new OpenAIProvider({
                apiKey: llmConfig.apiKey,
                modelName: llmConfig.model,
                baseURL: llmConfig.baseUrl,
            });

            const securityService = new SecurityService(configProvider, renderer);

            const tools = new ToolRegistry();
            if (!wsRoot) {
                throw new Error("Workspace root not found in config");
            }
            tools.register(new FileSystemTool(new LocalWorkspace(wsRoot)));
            tools.register(new RunCommandTool(configProvider, securityService));
            tools.register(new WorkspaceTool());
            tools.register(new LoadSkillTool(skillRegistry));

            // MCP Integration
            const mcpFactory = new MCPClientFactory();
            const mcpConfigs = configProvider.get('mcpServers') || {};
            const mcpClients = mcpFactory.createClientsFromConfig(mcpConfigs);

            if (Object.keys(mcpConfigs).length > 0) {
                renderer.renderMessage('system', `[MCP] Initializing ${mcpClients.length} servers...`);
            }

            for (const client of mcpClients) {
                try {
                    await client.connect();
                    const mcpTools = await client.getTools();
                    mcpTools.forEach(t => tools.register(t));
                } catch (error: any) {
                    console.error(`[MCP] Failed to connect/register ${client.name}:`, error.message);
                }
            }

            // Graceful Shutdown Helper
            const performCleanup = async () => {
                if (mcpClients.length > 0) {
                    renderer.renderMessage('system', '[MCP] Shutting down clients...');
                    await Promise.all(mcpClients.map(async c => {
                        try {
                            await c.dispose();
                        } catch (e) {
                            console.error(e);
                        }
                    }));
                }
                await renderer.stop();
            };

            // Handle Signals
            process.on('SIGINT', async () => {
                await performCleanup();
                process.exit(0);
            });
            process.on('SIGTERM', async () => {
                await performCleanup();
                process.exit(0);
            });

            const agent = new ReActAgent(context, tools, llm, events, skillRegistry);

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
                        await performCleanup();
                        process.exit(0);
                    }

                    if (input.toLowerCase() === '/history') {
                        const sessions = await JsonlContextManager.listSessions(wsRoot);
                        if (sessions.length === 0) {
                            renderer.renderMessage('system', 'No history sessions found.');
                            continue;
                        }

                        const items = sessions.slice(0, 10).map(s => {
                            const date = new Date(s.lastModified).toISOString().replace('T', ' ').substring(0, 19);
                            // Clean preview for single line display
                            const cleanPreview = s.preview.replace(/\n/g, ' ').substring(0, 50);
                            return {
                                label: `[${date}] ${cleanPreview}...`,
                                value: s.id
                            };
                        });

                        const selectedId = await renderer.selectSession(items);
                        if (selectedId) {
                            context.switchSession(selectedId);
                            renderer.renderMessage('system', `Switched to session: ${selectedId}`);

                            // Re-load history to UI? 
                            // Ideally we should clear UI and load new history.
                            // For MVP, just switching context for next prompts. 
                            // But better UX is to show some history.
                            const history = await context.getHistory();
                            // renderMessage appends, so this might duplicate if we don't clear.
                            // But UIStore keeps all messages. 
                            // We don't have a 'clearMessages' in Renderer/UIStore yet. 
                            // Let's just notify switch for now.
                        } else {
                            renderer.renderMessage('system', 'Selection cancelled.');
                        }
                        continue;
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
