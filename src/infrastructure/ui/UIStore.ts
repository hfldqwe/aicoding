
import { EventEmitter } from 'events';

export type UIMessage = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
};

export type ToolStatus = {
    name: string;
    status: 'running' | 'completed' | 'failed';
    output?: string;
};

export interface UIState {
    messages: UIMessage[];
    currentTool?: ToolStatus;
    isInputVisible: boolean;
    inputPrompt: string;
    spinnerMessage?: string;
}

class UIStore extends EventEmitter {
    private state: UIState = {
        messages: [],
        isInputVisible: false,
        inputPrompt: '> ',
    };

    getState() {
        return this.state;
    }

    addMessage(role: 'user' | 'assistant' | 'system', content: string) {
        const msg: UIMessage = {
            id: Math.random().toString(36).substring(7),
            role,
            content,
            timestamp: Date.now(),
        };
        this.state.messages.push(msg);
        this.emit('change', this.state);
    }

    updateLastMessage(content: string) {
        if (this.state.messages.length > 0) {
            const last = this.state.messages[this.state.messages.length - 1];
            // Only update if it's assistant
            if (last.role === 'assistant') {
                last.content = content;
                this.emit('change', this.state);
            }
        }
    }

    appendLastMessage(chunk: string) {
        if (this.state.messages.length > 0) {
            const last = this.state.messages[this.state.messages.length - 1];
            if (last.role === 'assistant') {
                last.content += chunk;
                this.emit('change', this.state);
            }
        }
    }

    setToolStatus(name: string, status: 'running' | 'completed' | 'failed', output?: string) {
        this.state.currentTool = { name, status, output };
        this.emit('change', this.state);
    }

    clearToolStatus() {
        this.state.currentTool = undefined;
        this.emit('change', this.state);
    }

    showInput(prompt: string) {
        this.state.isInputVisible = true;
        this.state.inputPrompt = prompt;
        this.emit('change', this.state);
    }

    hideInput() {
        this.state.isInputVisible = false;
        this.emit('change', this.state);
    }

    setSpinner(message?: string) {
        this.state.spinnerMessage = message;
        this.emit('change', this.state);
    }
}

export const uiStore = new UIStore();
