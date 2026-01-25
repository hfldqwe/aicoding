
import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { uiStore, UIState } from '../UIStore.js';

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

    const handleSubmit = (value: string) => {
        setInputValue(''); // Clear local input
        onInputSubmit(value);
    };

    return (
        <Box flexDirection="column">
            {/* Message List */}
            {state.messages.map((msg) => (
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

            {/* User Input */}
            {state.isInputVisible && (
                <Box marginTop={1}>
                    <Text color="green">{state.inputPrompt}</Text>
                    <TextInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmit}
                    />
                </Box>
            )}
        </Box>
    );
};

export default App;
