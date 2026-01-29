
import { ITool, IToolSchema } from '../../types/tool.js';
import { exec } from 'child_process';
const execAsync = (command: string, options: any = {}): Promise<{ stdout: string, stderr: string }> => {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve({ stdout: stdout as unknown as string, stderr: stderr as unknown as string });
            }
        });
    });
};

export class WorkspaceTool implements ITool {
    name = 'workspace_tool';
    description = 'Provides awareness of the project structure and Git status. Use this to find files and check version control state.';

    parameters: IToolSchema = {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                enum: ['getRoot', 'listFiles', 'getGitStatus'],
                description: 'The operation to perform.'
            },
            recursive: {
                type: 'boolean',
                description: 'For listFiles: whether to list recursively (default: true).'
            }
        },
        required: ['command']
    };

    async execute(args: Record<string, any>): Promise<string> {
        const { command } = args;

        switch (command) {
            case 'getRoot':
                return this.getRoot();
            case 'listFiles':
                return this.listFiles(args.recursive !== false);
            case 'getGitStatus':
                return this.getGitStatus();
            default:
                throw new Error(`Unknown command: ${command}`);
        }
    }

    private async getRoot(): Promise<string> {
        return JSON.stringify({ root: process.cwd() });
    }

    private async listFiles(recursive: boolean): Promise<string> {
        // Use git ls-files to respect .gitignore automatically
        // --cached: tracked files
        // --others: untracked files
        // --exclude-standard: apply standard git ignore rules
        try {
            const { stdout } = await execAsync('git ls-files --cached --others --exclude-standard', { cwd: process.cwd() });
            const files = stdout.split('\n').filter(line => line.trim() !== '');
            return JSON.stringify(files);
        } catch (error: any) {
            // Fallback or error if not a git repo?
            // For now, assuming git is available as per requirements
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    private async getGitStatus(): Promise<string> {
        try {
            const branchPromise = execAsync('git rev-parse --abbrev-ref HEAD', { cwd: process.cwd() });
            const statusPromise = execAsync('git status -s', { cwd: process.cwd() });

            const [branchRes, statusRes] = await Promise.all([branchPromise, statusPromise]);

            const branch = branchRes.stdout.trim();
            const statusLines = statusRes.stdout.split('\n').filter(line => line.trim() !== '');

            const modified: string[] = [];
            const staged: string[] = [];
            const untracked: string[] = [];

            for (const line of statusLines) {
                // git status -s format: XY PATH
                // X = staging status, Y = working tree status
                const code = line.substring(0, 2);
                const file = line.substring(3);

                if (code === '??') {
                    untracked.push(file);
                } else {
                    if (code[0] !== ' ' && code[0] !== '?') staged.push(file);
                    if (code[1] !== ' ' && code[1] !== '?') modified.push(file);
                }
            }

            return JSON.stringify({
                branch,
                modified,
                staged,
                untracked
            });

        } catch (error: any) {
            throw new Error(`Failed to get git status: ${error.message}`);
        }
    }
}
