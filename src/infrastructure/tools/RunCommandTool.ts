
import { ITool, IToolSchema } from '../../types/tool.js';
import { IConfigProvider } from '../../types/config.js';
import { ISecurityService } from '../../types/security.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RunCommandTool implements ITool {
    name = 'run_command';
    description = 'Executes shell commands in the current workspace. Use this for git operations, build commands, and other terminal tasks.';
    parameters: IToolSchema = {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: 'The shell command to execute.'
            }
        },
        required: ['command']
    };

    constructor(
        private config: IConfigProvider,
        private security: ISecurityService
    ) { }

    async execute(args: Record<string, any>): Promise<string> {
        const { command } = args;

        if (!command) {
            throw new Error('Command is required.');
        }

        // 1. Security Check
        await this.security.validateCommand(command);

        // 2. Execution
        try {
            const { stdout, stderr } = await execAsync(command);
            return stdout || stderr || 'Command executed successfully (no output).';
        } catch (error: any) {
            throw new Error(`Command failed: ${error.message}\n${error.stderr || ''}`);
        }
    }
}
