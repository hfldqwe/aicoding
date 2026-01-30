/**
 * 多格式响应解析器
 * 支持 ReAct、JSON、XML 等多种格式的 LLM 响应解析
 */

export interface ParsedAction {
    toolName: string;
    args: Record<string, unknown>;
}

export interface ParsedResponse {
    type: 'action' | 'final_answer' | 'error';
    content?: string;
    action?: ParsedAction;
    error?: string;
}

export class ResponseParser {
    /**
     * 主解析入口，按优先级尝试不同格式
     */
    static parse(response: string): ParsedResponse {
        if (!response || typeof response !== 'string') {
            return { type: 'error', error: 'Empty or invalid response' };
        }

        // 按优先级尝试不同格式
        const parsers: ((response: string) => ParsedResponse | null)[] = [
            this.parseReActFormat,
            this.parseJSONFormat,
            this.parseXMLFormat,
            this.parseMarkdownCodeBlock,
        ];

        for (const parser of parsers) {
            try {
                const result = parser(response);
                if (result) return result;
            } catch (e) {
                // 继续尝试下一个解析器
                continue;
            }
        }

        // 所有解析器都失败，返回错误
        return { type: 'error', error: 'Unable to parse response format' };
    }

    /**
     * ReAct 格式解析
     * Thought: ...
     * Action: tool_name
     * Action Input: { "key": "value" }
     */
    private static parseReActFormat(response: string): ParsedResponse | null {
        // 检查是否是 Final Answer
        if (response.includes('Final Answer:')) {
            const finalAnswer = response.split('Final Answer:')[1]?.trim();
            return { type: 'final_answer', content: finalAnswer };
        }

        // 解析 Action
        const actionMatch = response.match(/Action:\s*(.+?)(?:\n|$)/);
        const inputMatch = response.match(/Action Input:\s*(.+?)(?:\n|Observation:|$)/s);

        if (!actionMatch) return null;

        const toolName = actionMatch[1].trim();
        let args: Record<string, unknown> = {};

        if (inputMatch) {
            const inputStr = inputMatch[1].trim();
            try {
                args = JSON.parse(inputStr);
            } catch (e) {
                // JSON 解析失败，作为字符串参数
                args = { input: inputStr };
            }
        }

        return {
            type: 'action',
            action: { toolName, args }
        };
    }

    /**
     * JSON 格式解析
     * { "tool": "tool_name", "args": { "key": "value" } }
     * 或
     * { "final_answer": "..." }
     */
    private static parseJSONFormat(response: string): ParsedResponse | null {
        // 尝试提取 JSON 对象
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        try {
            const data = JSON.parse(jsonMatch[0]);

            // 检查是否是 Final Answer
            if (data.final_answer !== undefined) {
                return { type: 'final_answer', content: String(data.final_answer) };
            }

            // 检查是否是 Action
            if (data.tool || data.action) {
                return {
                    type: 'action',
                    action: {
                        toolName: data.tool || data.action,
                        args: data.args || data.parameters || {}
                    }
                };
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * XML 格式解析
     * <tool name="tool_name"><arg key="...">...</arg></tool>
     * 或
     * <final_answer>...</final_answer>
     */
    private static parseXMLFormat(response: string): ParsedResponse | null {
        // 检查 Final Answer
        const finalMatch = response.match(/<final_answer>([\s\S]*?)<\/final_answer>/);
        if (finalMatch) {
            return { type: 'final_answer', content: finalMatch[1].trim() };
        }

        // 检查 Tool 调用
        const toolMatch = response.match(/<tool\s+name="([^"]+)"\s*\/?>/);
        if (toolMatch) {
            const toolName = toolMatch[1];
            const args: Record<string, unknown> = {};

            // 解析参数
            const argMatches = response.matchAll(/<arg\s+key="([^"]+)"\s*\/?>([\s\S]*?)<\/arg>/g);
            for (const match of argMatches) {
                args[match[1]] = match[2].trim();
            }

            return {
                type: 'action',
                action: { toolName, args }
            };
        }

        return null;
    }

    /**
     * Markdown 代码块解析
     * ```json
     * { "tool": "...", "args": {} }
     * ```
     */
    private static parseMarkdownCodeBlock(response: string): ParsedResponse | null {
        // 尝试提取 markdown 代码块
        const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
        if (!codeBlockMatch) return null;

        const content = codeBlockMatch[1].trim();

        // 尝试作为 JSON 解析
        try {
            const data = JSON.parse(content);

            if (data.final_answer !== undefined) {
                return { type: 'final_answer', content: String(data.final_answer) };
            }

            if (data.tool || data.action) {
                return {
                    type: 'action',
                    action: {
                        toolName: data.tool || data.action,
                        args: data.args || data.parameters || {}
                    }
                };
            }
        } catch (e) {
            // 不是有效的 JSON，作为普通文本处理
            return { type: 'final_answer', content: content };
        }

        return null;
    }
}
