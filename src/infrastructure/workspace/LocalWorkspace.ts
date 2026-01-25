
import { IWorkspace } from '../../types/workspace.js';
import fs from 'fs/promises';
import path from 'path';

export class LocalWorkspace implements IWorkspace {
    constructor(private root: string) { }

    get rootPath(): string {
        return this.root;
    }

    async readFile(relativePath: string): Promise<string> {
        const fullPath = path.resolve(this.root, relativePath);
        this.validatePath(fullPath);
        return await fs.readFile(fullPath, 'utf8');
    }

    async writeFile(relativePath: string, content: string): Promise<void> {
        const fullPath = path.resolve(this.root, relativePath);
        this.validatePath(fullPath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');
    }

    async listFiles(pattern?: string): Promise<string[]> {
        // Ignoring pattern for now, just listing root
        const fullPath = path.resolve(this.root, pattern || '.');
        this.validatePath(fullPath);
        const dirents = await fs.readdir(fullPath, { withFileTypes: true });
        return dirents.map(d => d.name);
    }

    async exists(relativePath: string): Promise<boolean> {
        const fullPath = path.resolve(this.root, relativePath);
        this.validatePath(fullPath);
        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    async mkdir(relativePath: string): Promise<void> {
        const fullPath = path.resolve(this.root, relativePath);
        this.validatePath(fullPath);
        await fs.mkdir(fullPath, { recursive: true });
    }

    private validatePath(fullPath: string) {
        if (!fullPath.startsWith(path.resolve(this.root))) {
            throw new Error('Access denied: Path is outside workspace root.');
        }
    }
}
