
import { IRenderer } from '../../types/ui.js';
import { uiStore } from './UIStore.js';
import React from 'react';
import { render, Instance } from 'ink';
import App from './components/App.js';

export class TerminalRenderer implements IRenderer {
    private instance: Instance | null = null;
    private inputResolver: ((value: string) => void) | null = null;

    constructor() {
        // Start the Ink app
        this.instance = render(React.createElement(App, {
            onInputSubmit: (val: string) => this.handleInput(val)
        }));
    }

    private handleInput(value: string) {
        if (this.inputResolver) {
            uiStore.hideInput();
            // Also add the user's input to history so it looks like a chat
            uiStore.addMessage('user', value);
            this.inputResolver(value);
            this.inputResolver = null;
        }
    }

    renderMessage(role: string, content: string): void {
        uiStore.addMessage(role as any, content);
    }

    renderToolUse(toolName: string, status: 'running' | 'completed' | 'failed', output?: string): void {
        if (status === 'running') {
            uiStore.setToolStatus(toolName, 'running');
        } else {
            uiStore.setToolStatus(toolName, status, output);
            // Optionally clear after delay, but for now leave it or clear on next tool
            setTimeout(() => {
                uiStore.clearToolStatus();
            }, 2000);
        }
    }

    askUser(prompt: string): Promise<string> {
        return new Promise((resolve) => {
            this.inputResolver = resolve;
            uiStore.showInput(prompt);
        });
    }

    startSpinner(text: string): void {
        uiStore.setSpinner(text);
    }

    stopSpinner(): void {
        uiStore.setSpinner(undefined);
    }

    confirmAction(prompt: string): Promise<ConfirmResult> {
        return new Promise((resolve) => {
            uiStore.showConfirmation(prompt, resolve);
        });
    }

    selectSession(items: { label: string; value: string }[]): Promise<string | null> {
        return new Promise((resolve) => {
            this.inputResolver = resolve as any; // Re-use resolver mechanism or create new one? 
            // Actually, internal store handles resolution via callback
            uiStore.showSelection(items, resolve);
        });
    }
}

import { ConfirmResult } from '../../types/ui.js';
