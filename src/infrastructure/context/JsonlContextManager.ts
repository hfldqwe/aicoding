
import fs from 'fs';
import path from 'path';
import { IContextManager, IChatMessage } from '../../types/context.js';

export interface SessionInfo {
    id: string;
    path: string;
    lastModified: number;
    preview: string;
}

export class JsonlContextManager implements IContextManager {
    private readonly sessionDir: string;
    private sessionFile: string;
    private writeQueue: string[] = [];
    private isWriting = false;
    private messagesCache: IChatMessage[] | null = null; // Memory cache

    constructor(
        private sessionId: string,
        private readonly workspaceRoot: string
    ) {
        this.sessionDir = path.join(this.workspaceRoot, '.aicoding', 'sessions');
        this.sessionFile = path.join(this.sessionDir, `session_${this.sessionId}.jsonl`);
        this.ensureSessionDir();
    }

    private ensureSessionDir(): void {
        if (!fs.existsSync(this.sessionDir)) {
            fs.mkdirSync(this.sessionDir, { recursive: true });
        }
    }

    switchSession(newSessionId: string): void {
        this.sessionId = newSessionId;
        this.sessionFile = path.join(this.sessionDir, `session_${this.sessionId}.jsonl`);
        this.writeQueue = []; // Clear queue (risk of data loss if busy, but acceptable for MVP switch)
        this.isWriting = false;
        this.messagesCache = null; // Reset cache
        // ensureSessionDir is already safe
    }

    addMessage(message: IChatMessage): void {
        const line = JSON.stringify(message);
        this.writeQueue.push(line);
        this.processQueue();

        // Update cache synchronously if it's already loaded
        if (this.messagesCache) {
            this.messagesCache.push(message);
        }
    }

    private async processQueue(): Promise<void> {
        if (this.isWriting || this.writeQueue.length === 0) {
            return;
        }

        this.isWriting = true;

        try {
            while (this.writeQueue.length > 0) {
                const line = this.writeQueue.shift();
                if (line) {
                    await new Promise<void>((resolve, reject) => {
                        fs.appendFile(this.sessionFile, line + '\n', 'utf8', (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Failed to write to session file:', error);
            // Put it back? Or drop it? For now log error.
        } finally {
            this.isWriting = false;
            // Check if more items arrived while writing
            if (this.writeQueue.length > 0) {
                this.processQueue();
            }
        }
    }

    async getHistory(): Promise<IChatMessage[]> {
        // Return memory cache if available
        if (this.messagesCache) {
            return this.messagesCache;
        }

        if (!fs.existsSync(this.sessionFile)) {
            this.messagesCache = [];
            return [];
        }

        try {
            const content = await fs.promises.readFile(this.sessionFile, 'utf8');
            const allMessages = content
                .trim()
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line) as IChatMessage;
                    } catch {
                        return null; // Skip invalid lines
                    }
                })
                .filter((msg): msg is IChatMessage => msg !== null);

            this.messagesCache = allMessages; // Initialize cache

            if (allMessages.length === 0) {
                return [];
            }

            // US-010.3: Sliding Window Strategy
            const MAX_CONTEXT_MESSAGES = 50;

            if (allMessages.length <= MAX_CONTEXT_MESSAGES) {
                return allMessages;
            }

            // Assume index 0 is System Prompt (if it has role 'system', but strict safety says just keep it)
            // Even if it's not system, we usually want to keep the "Initial Instruction" if possible.
            // Requirement says: "Keep the System Prompt (first message usually)."

            const systemPrompt = allMessages[0];
            const slidingWindowSize = MAX_CONTEXT_MESSAGES - 1; // Reserve 1 slot for System Prompt
            const recentMessages = allMessages.slice(-slidingWindowSize);

            // If the system prompt is already in recentMessages (e.g. very short history but logically shouldn't happen if > MAX), 
            // or if we just naively combine them. 
            // Warning: If recentMessages includes index 0, we duplicate. 
            // But since allMessages.length > MAX (50), and slice(-49) takes last 49, index 0 won't be in there.

            // Note: We cache ALL messages or just the window?
            // If we return window, but cache ALL, next addMessage appends to All.
            // But getHistory returns Window.
            // So `messagesCache` should store ALL messages to enable correct windowing later?
            // YES.
            // `allMessages` is the full history.
            // `getHistory` logic applies windowing on return.

            return [systemPrompt, ...recentMessages];

        } catch (error) {
            console.error('Failed to read session file:', error);
            return [];
        }
    }

    async getTokenCount(): Promise<number> {
        // TODO: Implement estimation
        return 0;
    }

    clear(): void {
        this.messagesCache = []; // Clear cache
        if (fs.existsSync(this.sessionFile)) {
            try {
                fs.unlinkSync(this.sessionFile);
            } catch (e) {
                console.error('Failed to clear session file', e);
            }
        }
    }

    static async listSessions(workspaceRoot: string): Promise<SessionInfo[]> {
        const sessionDir = path.join(workspaceRoot, '.aicoding', 'sessions');
        if (!fs.existsSync(sessionDir)) {
            return [];
        }

        const files = await fs.promises.readdir(sessionDir);
        const sessions: SessionInfo[] = [];

        for (const file of files) {
            if (!file.endsWith('.jsonl') || !file.startsWith('session_')) continue;

            const filePath = path.join(sessionDir, file);
            try {
                const stats = await fs.promises.stat(filePath);
                const id = file.replace('session_', '').replace('.jsonl', '');

                // Read up to 2KB to find a user message
                const fd = await fs.promises.open(filePath, 'r');
                const buffer = Buffer.alloc(2048);
                const { bytesRead } = await fd.read(buffer, 0, 2048, 0);
                await fd.close();

                const content = buffer.toString('utf8', 0, bytesRead);
                const lines = content.split('\n').filter(line => line.trim());

                let preview = "No preview available";

                // Prioritize finding the first USER message
                const userMsg = lines.map(l => {
                    try { return JSON.parse(l) as IChatMessage; } catch { return null; }
                }).find(m => m?.role === 'user');

                if (userMsg) {
                    preview = userMsg.content;
                } else if (lines.length > 0) {
                    // Fallback to first message (likely system)
                    try {
                        const first = JSON.parse(lines[0]) as IChatMessage;
                        preview = `[${first.role}] ${first.content}`;
                    } catch {
                        // ignore
                    }
                }

                sessions.push({
                    id,
                    path: filePath,
                    lastModified: stats.mtimeMs,
                    preview: preview.replace(/\n/g, ' ').substring(0, 80) + (preview.length > 80 ? '...' : '')
                });

            } catch (err) {
                // Ignore broken files
            }
        }

        return sessions.sort((a, b) => b.lastModified - a.lastModified);
    }
}
