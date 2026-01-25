
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerminalRenderer } from '../../../src/infrastructure/ui/TerminalRenderer.js'; // Ensure .js
import { uiStore } from '../../../src/infrastructure/ui/UIStore.js'; // Ensure .js

// Mock ink and react
vi.mock('ink', () => ({
    render: vi.fn(() => ({
        exit: vi.fn(),
        rerender: vi.fn(),
        unmount: vi.fn(),
        waitUntilExit: vi.fn(),
        cleanup: vi.fn(),
        clear: vi.fn(),
    })),
    Box: () => null,
    Text: () => null,
    useApp: () => ({ exit: vi.fn() }),
}));

vi.mock('react', async () => {
    const actual = await vi.importActual<any>('react');
    return {
        ...actual,
        createElement: vi.fn(),
    };
});

// Mock App component
vi.mock('../../../src/infrastructure/ui/components/App.js', () => ({
    default: () => null,
}));

describe('TerminalRenderer', () => {
    beforeEach(() => {
        // Reset store
        (uiStore as any).state = {
            messages: [],
            isInputVisible: false,
            inputPrompt: '> ',
        };
        vi.clearAllMocks();
    });

    it('should update store when renderMessage is called', () => {
        const renderer = new TerminalRenderer();
        renderer.renderMessage('user', 'Hello Agent');

        const state = uiStore.getState();
        expect(state.messages).toHaveLength(1);
        expect(state.messages[0].content).toBe('Hello Agent');
        expect(state.messages[0].role).toBe('user');
    });

    it('should update store when startSpinner is called', () => {
        const renderer = new TerminalRenderer();
        renderer.startSpinner('Thinking...');

        const state = uiStore.getState();
        expect(state.spinnerMessage).toBe('Thinking...');
    });

    it('should update store when tool status changes', () => {
        const renderer = new TerminalRenderer();
        renderer.renderToolUse('calc', 'running');

        let state = uiStore.getState();
        expect(state.currentTool?.name).toBe('calc');
        expect(state.currentTool?.status).toBe('running');

        renderer.renderToolUse('calc', 'completed', '42');
        state = uiStore.getState();
        expect(state.currentTool?.status).toBe('completed');
        expect(state.currentTool?.output).toBe('42');
    });

    it('should show input when askUser is called', async () => {
        const renderer = new TerminalRenderer();
        const promise = renderer.askUser('Name?');

        const state = uiStore.getState();
        expect(state.isInputVisible).toBe(true);
        expect(state.inputPrompt).toBe('Name?');

        // Simulate input from App (via private handleInput method exposed potentially or mock App behavior)
        // Since we can't easily trigger the private callback from here without spying deeply,
        // we can check if the internal resolver is set? 
        // Or access private method via casting.
        (renderer as any).handleInput('Ralph');

        const result = await promise;
        expect(result).toBe('Ralph');
        expect(uiStore.getState().isInputVisible).toBe(false);
    });
});
