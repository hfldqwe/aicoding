
import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { uiStore, UIState } from '../UIStore.js';
import { ConfirmResult } from '../../../types/ui.js';

const App = ({ onInputSubmit }: { onInputSubmit: (input: string) => void }) => {
    const [state, setState] = useState<UIState>(uiStore.getState());
    const [inputValue, setInputValue] = useState(''); // Local state for input
    const { exit } = useApp();

    useEffect(() => {
        const handler = (newState: UIState) => {
            setState({ ...newState });
        };
        uiStore.on('change', handler);
        return () => {
            uiStore.off('change', handler);
        };
    }, []);

    // Handle key presses for confirmation and cancellation
    useInput((input, key) => {
        if (state.pendingConfirmation) {
            if (input === 'y' || input === 'Y') {
                uiStore.handleConfirmationResult(ConfirmResult.ALLOW);
            } else if (input === 'a' || input === 'A') {
                uiStore.handleConfirmationResult(ConfirmResult.ALWAYS_ALLOW);
            } else if (input === 'n' || input === 'N') {
                uiStore.handleConfirmationResult(ConfirmResult.DENY);
            }
        }

        if (state.selectionState && state.selectionState.isVisible) {
            if (key.escape) {
                uiStore.handleSelectionResult(null);
            }
        }
    });

    const handleSubmit = (value: string) => {
        setInputValue(''); // Clear local input
        onInputSubmit(value);
    };

    return (
        <Box flexDirection="column">
            {/* Message List */}
            {state.messages.map((msg: any) => (
                <Box key={msg.id} flexDirection="column" marginBottom={1}>
                    <Text color={msg.role === 'user' ? 'green' : 'blue'} bold>
                        {msg.role === 'user' ? 'User' : 'AI'}:
                    </Text>
                    <Text>{msg.content}</Text>
                </Box>
            ))}

            {/* Spinner / Tool Status */}
            {state.spinnerMessage && (
                <Box>
                    <Text color="yellow">
                        <Spinner type="dots" /> {state.spinnerMessage}
                    </Text>
                </Box>
            )}

            {state.currentTool && (
                <Box borderStyle="round" borderColor={state.currentTool.status === 'failed' ? 'red' : 'cyan'}>
                    <Text>
                        Tool: {state.currentTool.name}
                        {state.currentTool.status === 'running' && <Spinner type="line" />}
                        {state.currentTool.status === 'completed' && ' ✓'}
                        {state.currentTool.status === 'failed' && ' ✗'}
                    </Text>
                </Box>
            )}

            {/* Dangerous Command Confirmation */}
            {state.pendingConfirmation && (
                <Box flexDirection="column" borderStyle="double" borderColor="red" padding={1} marginY={1}>
                    <Text color="red" bold>{state.pendingConfirmation.prompt}</Text>
                    <Box marginTop={1}>
                        <Text>[y] Allow once  </Text>
                        <Text color="yellow">[a] Always allow for this session  </Text>
                        <Text color="red">[n] Deny</Text>
                    </Box>
                </Box>
            )}

            {/* User Input */}
            {!state.pendingConfirmation && !state.selectionState && state.isInputVisible && (
                <Box marginTop={1}>
                    <Text color="green">{state.inputPrompt}</Text>
                    <TextInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmit}
                    />
                </Box>
            )}

            {/* Selection Input */}
            {state.selectionState && state.selectionState.isVisible && (
                <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="yellow" padding={1}>
                    <Text bold color="yellow">Select a Session:</Text>
                    <SelectInput
                        items={state.selectionState.items}
                        onSelect={(item: { label: string; value: string }) => {
                            uiStore.handleSelectionResult(item.value);
                        }}
                    />
                    <Text color="gray" italic>(Press ESC to cancel)</Text>
                </Box>
            )}
        </Box>
    );
};

export default App;
