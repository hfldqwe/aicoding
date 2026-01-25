
import { ITool, IToolSchema } from '../types/tool';
import { IWorkspace } from '../types/workspace';

export class FileSystemTool implements ITool {
    name = 'filesystem_tool';
    description = 'A tool to read and write files within the workspace. Supports "read_file" and "write_file" operations.';
    parameters: IToolSchema = {
        type: 'object',
        properties: {
            operation: {
                type: 'string',
                enum: ['read_file', 'write_file'],
                description: 'The operation to perform.'
            },
            path: {
                type: 'string',
                description: 'The relative path of the file to operate on.'
            },
            content: {
                type: 'string',
                description: 'The content to write. Required if operation is "write_file".'
            }
        },
        required: ['operation', 'path']
    };

    constructor(private workspace: IWorkspace) { }

    async execute(args: Record<string, any>): Promise<string> {
        const { operation, path, content } = args;

        if (!path) {
            throw new Error('Path is required.');
        }

        switch (operation) {
            case 'read_file':
                return await this.workspace.readFile(path);
            case 'write_file':
                if (content === undefined || content === null) {
                    throw new Error('Content is required for write_file operation.');
                }
                await this.workspace.writeFile(path, content);
                return `Successfully wrote to ${path}`;
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }
    }
}
