
import { TerminalRenderer } from './src/infrastructure/ui/TerminalRenderer.js';

const renderer = new TerminalRenderer();

async function run() {
    renderer.renderMessage('system', 'System initialized.');
    await new Promise(r => setTimeout(r, 1000));

    renderer.startSpinner('AI is thinking...');
    await new Promise(r => setTimeout(r, 1500));
    renderer.stopSpinner();

    renderer.renderMessage('assistant', 'Hello! I am your AI assistant. What is your name?');

    const name = await renderer.askUser('Enter name: ');

    renderer.renderMessage('assistant', `Nice to meet you, ${name}! I will now calculate the meaning of life.`);

    renderer.renderToolUse('DeepThought', 'running');
    await new Promise(r => setTimeout(r, 2000));
    renderer.renderToolUse('DeepThought', 'completed', '42');

    renderer.renderMessage('assistant', 'The answer is 42.');

    // Keep alive briefly to see result
    await new Promise(r => setTimeout(r, 2000));
    // process.exit(0); // Ink might need explicit exit or let it hang if blocked
}

run();
