
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JsonlContextManager } from '../../../src/infrastructure/context/JsonlContextManager.js';
import { IChatMessage } from '../../../src/types/context.js';

describe('JsonlContextManager', () => {
    const testSessionId = 'test-session-123';
    const testWorkspaceRoot = path.join(process.cwd(), 'test-workspace');
    const sessionDir = path.join(testWorkspaceRoot, '.aicoding', 'sessions');
    const sessionFile = path.join(sessionDir, `session_${testSessionId}.jsonl`);

    beforeEach(() => {
        if (fs.existsSync(testWorkspaceRoot)) {
            fs.rmSync(testWorkspaceRoot, { recursive: true, force: true });
        }
        // Create session dir for tests that write directly to file
        fs.mkdirSync(sessionDir, { recursive: true });
    });

    afterEach(() => {
        if (fs.existsSync(testWorkspaceRoot)) {
            fs.rmSync(testWorkspaceRoot, { recursive: true, force: true });
        }
    });

    it('should create session directory if it does not exist', () => {
        // Remove it first to test creation logic in constructor
        fs.rmSync(testWorkspaceRoot, { recursive: true, force: true });

        new JsonlContextManager(testSessionId, testWorkspaceRoot);
        expect(fs.existsSync(sessionDir)).toBe(true);
    });

    it('should append messages to file asynchronously', async () => {
        const manager = new JsonlContextManager(testSessionId, testWorkspaceRoot);
        const message: IChatMessage = { role: 'user', content: 'Hello World' };

        manager.addMessage(message);

        // Wait a bit for async write
        await new Promise(resolve => setTimeout(resolve, 100));

        const content = fs.readFileSync(sessionFile, 'utf8');
        const lines = content.trim().split('\n');
        expect(lines.length).toBe(1);
        expect(JSON.parse(lines[0])).toEqual(message);
    });

    it('should handle sequential writes correctly', async () => {
        const manager = new JsonlContextManager(testSessionId, testWorkspaceRoot);
        const msg1: IChatMessage = { role: 'user', content: 'First' };
        const msg2: IChatMessage = { role: 'assistant', content: 'Second' };
        const msg3: IChatMessage = { role: 'user', content: 'Third' };

        manager.addMessage(msg1);
        manager.addMessage(msg2);
        manager.addMessage(msg3);

        // Wait for queue processing
        await new Promise(resolve => setTimeout(resolve, 200));

        const content = fs.readFileSync(sessionFile, 'utf8');
        const lines = content.trim().split('\n');

        expect(lines.length).toBe(3);
        expect(JSON.parse(lines[0])).toEqual(msg1);
        expect(JSON.parse(lines[1])).toEqual(msg2);
        expect(JSON.parse(lines[2])).toEqual(msg3);
    });

    it('should hydrate history from existing file', async () => {
        const msg1: IChatMessage = { role: 'user', content: 'History 1' };
        const msg2: IChatMessage = { role: 'assistant', content: 'History 2' };
        const messages = [msg1, msg2];

        fs.writeFileSync(sessionFile, messages.map(m => JSON.stringify(m)).join('\n') + '\n');

        const manager = new JsonlContextManager(testSessionId, testWorkspaceRoot);
        const history = await manager.getHistory();

        expect(history.length).toBe(2);
        expect(history).toEqual(messages);
    });

    it('should handle corrupted lines gracefully during hydration', async () => {
        const msg1: IChatMessage = { role: 'user', content: 'Valid' };
        const content = `${JSON.stringify(msg1)}\nThis is NOT JSON\n${JSON.stringify(msg1)}`;
        fs.writeFileSync(sessionFile, content);

        const manager = new JsonlContextManager(testSessionId, testWorkspaceRoot);
        const history = await manager.getHistory();

        expect(history.length).toBe(2);
        expect(history[0]).toEqual(msg1);
        expect(history[1]).toEqual(msg1);
    });

    it('should respect sliding window limit and preserve system prompt', async () => {
        // Target limit is 50. We create 60 messages.
        // Index 0: System
        // Index 1..59: User/Assistant
        const systemMsg: IChatMessage = { role: 'system', content: 'SYSTEM' };
        const messages = [systemMsg];

        for (let i = 1; i < 60; i++) {
            messages.push({ role: 'user', content: `Message ${i}` });
        }

        fs.writeFileSync(sessionFile, messages.map(m => JSON.stringify(m)).join('\n') + '\n');

        const manager = new JsonlContextManager(testSessionId, testWorkspaceRoot);
        const history = await manager.getHistory();

        expect(history.length).toBe(50);
        // First message must be preserved System Prompt
        expect(history[0]).toEqual(systemMsg);
        // Last message should be Message 59
        expect(history[49].content).toBe('Message 59');
        // Second message should be Message 11 (Since we kept 1 + 49 = 50, dropped 1..10)
        // Wait: Total 60. Keep 50. 
        // [0] (System) + [11..59] (49 messages).
        // So history[1] is Message 11.
        expect(history[1].content).toBe('Message 11');
    });
    it('should list and sort sessions correctly', async () => {
        // Create 3 sessions with different times and contents
        const session1 = path.join(sessionDir, 'session_1.jsonl');
        const session2 = path.join(sessionDir, 'session_2.jsonl');
        const session3 = path.join(sessionDir, 'session_3.jsonl');

        const sysMsg = JSON.stringify({ role: 'system', content: 'SYS' });
        const userMsg1 = JSON.stringify({ role: 'user', content: 'User1' });
        const userMsg2 = JSON.stringify({ role: 'user', content: 'User2' });

        fs.writeFileSync(session1, `${sysMsg}\n${userMsg1}\n`);
        fs.writeFileSync(session2, `${sysMsg}\n`); // No user message
        fs.writeFileSync(session3, `${userMsg2}\n`); // Only user message

        // Hack mtime by using fs.utimes to set different modification times
        const now = new Date();
        const t1 = new Date(now.getTime() - 30000);
        const t2 = new Date(now.getTime() - 20000);
        const t3 = new Date(now.getTime() - 10000);

        fs.utimesSync(session1, t1, t1); // Oldest
        fs.utimesSync(session2, t2, t2); // Middle
        fs.utimesSync(session3, t3, t3); // Newest

        const sessions = await JsonlContextManager.listSessions(testWorkspaceRoot);

        expect(sessions.length).toBe(3);

        // Should be sorted new to old
        expect(sessions[0].id).toBe('3');
        expect(sessions[0].preview).toContain('User2');

        expect(sessions[1].id).toBe('2');
        expect(sessions[1].preview).toContain('[system] SYS');

        expect(sessions[2].id).toBe('1');
        expect(sessions[2].preview).toContain('User1');
    });
});
