
import path from 'path';
import fs from 'fs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JsonlContextManager } from '../../src/infrastructure/context/JsonlContextManager.js';
import { IChatMessage } from '../../src/types/context.js';

describe('JsonlContextManager Race Condition Fix', () => {
    const workspaceRoot = path.join(__dirname, 'temp_test_workspace_fix');
    const sessionId = 'race-cond-fix-test';

    beforeEach(() => {
        if (fs.existsSync(workspaceRoot)) {
            fs.rmSync(workspaceRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(workspaceRoot, { recursive: true });
    });

    afterEach(() => {
        if (fs.existsSync(workspaceRoot)) {
            fs.rmSync(workspaceRoot, { recursive: true, force: true });
        }
    });

    it('should return updated history immediately after addMessage even if file IO is pending', async () => {
        const manager = new JsonlContextManager(sessionId, workspaceRoot);

        // 1. Simulate Agent Behavior: Initial load of history (loading cache)
        await manager.getHistory();

        const message: IChatMessage = { role: 'user', content: 'test message' };

        // 2. Add message (updates cache synchronously, writes to file efficiently)
        manager.addMessage(message);

        // 3. Immediately get history
        const history = await manager.getHistory();

        // 4. Assert instant availability (The Fix)
        expect(history).toHaveLength(1);
        expect(history[0]).toEqual(message);
    });

    it('should persist messages to file eventually', async () => {
        const manager = new JsonlContextManager(sessionId, workspaceRoot);
        await manager.getHistory(); // Init
        const message: IChatMessage = { role: 'user', content: 'persistent message' };
        manager.addMessage(message);

        // Wait for potential file I/O
        await new Promise(resolve => setTimeout(resolve, 200));

        // Create NEW manager instance to simulate restart/new read
        const newManager = new JsonlContextManager(sessionId, workspaceRoot);
        const history = await newManager.getHistory();

        expect(history).toHaveLength(1);
        expect(history[0]).toEqual(message);
    });
});
