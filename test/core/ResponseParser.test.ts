import { describe, it, expect } from 'vitest';
import { ResponseParser } from '../../src/core/ResponseParser.js';

describe('ResponseParser', () => {
    describe('ReAct Format', () => {
        it('should parse Action and Action Input', () => {
            const response = `Thought: I need to get weather
Action: get_weather
Action Input: { "city": "Beijing" }`;

            const result = ResponseParser.parse(response);

            expect(result.type).toBe('action');
            expect(result.action?.toolName).toBe('get_weather');
            expect(result.action?.args).toEqual({ city: 'Beijing' });
        });

        it('should parse Final Answer', () => {
            const response = `Thought: I have the answer
Final Answer: The weather is sunny today.`;

            const result = ResponseParser.parse(response);

            expect(result.type).toBe('final_answer');
            expect(result.content).toBe('The weather is sunny today.');
        });
    });

    describe('JSON Format', () => {
        it('should parse JSON tool call', () => {
            const response = `{ "tool": "get_weather", "args": { "city": "Shanghai" } }`;

            const result = ResponseParser.parse(response);

            expect(result.type).toBe('action');
            expect(result.action?.toolName).toBe('get_weather');
            expect(result.action?.args).toEqual({ city: 'Shanghai' });
        });

        it('should parse JSON final answer', () => {
            const response = `{ "final_answer": "Done!" }`;

            const result = ResponseParser.parse(response);

            expect(result.type).toBe('final_answer');
            expect(result.content).toBe('Done!');
        });
    });

    describe('XML Format', () => {
        it('should parse XML tool call', () => {
            const response = `<tool name="get_weather"><arg key="city">Guangzhou</arg></tool>`;

            const result = ResponseParser.parse(response);

            expect(result.type).toBe('action');
            expect(result.action?.toolName).toBe('get_weather');
            expect(result.action?.args).toEqual({ city: 'Guangzhou' });
        });

        it('should parse XML final answer', () => {
            const response = `<final_answer>Completed successfully</final_answer>`;

            const result = ResponseParser.parse(response);

            expect(result.type).toBe('final_answer');
            expect(result.content).toBe('Completed successfully');
        });
    });

    describe('Function Tag Format (User Issue)', () => {
        it('should parse <functions.tool_name:id>{}</functions.tool_name:id> format', () => {
            const response = `<functions.12306-mcp__get-current-date:0>{}</functions.12306-mcp__get-current-date:0>`;

            const result = ResponseParser.parse(response);

            expect(result.type).toBe('action');
            expect(result.action?.toolName).toBe('12306-mcp__get-current-date');
            expect(result.action?.args).toEqual({});
        });

        it('should parse function tag with JSON content', () => {
            const response = `<functions.amap-maps__maps_geo:1>{"address": "海淀遇见西山", "city": "北京"}</functions.amap-maps__maps_geo:1>`;

            const result = ResponseParser.parse(response);

            expect(result.type).toBe('action');
            expect(result.action?.toolName).toBe('amap-maps__maps_geo');
            expect(result.action?.args).toEqual({
                address: '海淀遇见西山',
                city: '北京'
            });
        });

        it('should parse multiple function calls in sequence', () => {
            const response = `<functions.tool1:0>{"a": 1}</functions.tool1:0>
<functions.tool2:1>{"b": 2}</functions.tool2:1>`;

            // 解析器应该返回第一个匹配的工具调用
            const result = ResponseParser.parse(response);

            expect(result.type).toBe('action');
            expect(result.action?.toolName).toBe('tool1');
            expect(result.action?.args).toEqual({ a: 1 });
        });
    });

    describe('Error Handling', () => {
        it('should handle empty response', () => {
            const result = ResponseParser.parse('');

            expect(result.type).toBe('error');
            expect(result.error).toBe('Empty or invalid response');
        });

        it('should handle null response', () => {
            const result = ResponseParser.parse(null as any);

            expect(result.type).toBe('error');
            expect(result.error).toBe('Empty or invalid response');
        });

        it('should return error for unparseable response', () => {
            const result = ResponseParser.parse('This is just plain text without any format');

            expect(result.type).toBe('error');
            expect(result.error).toBe('Unable to parse response format');
        });
    });
});
