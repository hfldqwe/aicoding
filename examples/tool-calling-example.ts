/**
 * 工具调用（Tool Calling）示例
 * 展示如何使用支持工具调用的 LLM Provider
 */

import { OpenAIProviderWithTools } from '../src/infrastructure/llm/OpenAIProviderWithTools.js';
import { IToolDefinition } from '../src/types/toolCalling.js';

// 定义可用工具
const tools: IToolDefinition[] = [
    {
        name: 'get_weather',
        description: '获取指定城市的天气信息',
        parameters: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: '城市名称，如 "北京"、"上海"'
                },
                date: {
                    type: 'string',
                    description: '日期，格式为 YYYY-MM-DD，默认为今天'
                }
            },
            required: ['city']
        }
    },
    {
        name: 'calculate',
        description: '执行数学计算',
        parameters: {
            type: 'object',
            properties: {
                expression: {
                    type: 'string',
                    description: '数学表达式，如 "2 + 2"、"sin(30)"'
                }
            },
            required: ['expression']
        }
    },
    {
        name: 'search',
        description: '搜索信息',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: '搜索关键词'
                },
                limit: {
                    type: 'number',
                    description: '返回结果数量，默认为 5'
                }
            },
            required: ['query']
        }
    }
];

// 模拟工具执行
async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    console.log(`🔧 执行工具: ${name}`, args);

    switch (name) {
        case 'get_weather':
            const city = args.city as string;
            return JSON.stringify({
                city,
                temperature: 25,
                condition: 'sunny',
                humidity: 60
            });

        case 'calculate':
            const expression = args.expression as string;
            // 安全计算（实际项目中应该使用安全的数学表达式解析器）
            try {
                // 注意：eval 不安全，仅作示例
                const result = eval(expression);
                return JSON.stringify({ expression, result });
            } catch (e) {
                return JSON.stringify({ error: '计算错误' });
            }

        case 'search':
            const query = args.query as string;
            return JSON.stringify({
                query,
                results: [
                    { title: `关于 ${query} 的结果 1`, url: 'http://example.com/1' },
                    { title: `关于 ${query} 的结果 2`, url: 'http://example.com/2' }
                ]
            });

        default:
            return JSON.stringify({ error: `未知工具: ${name}` });
    }
}

// 主示例函数
async function main() {
    console.log('🚀 工具调用示例\n');

    // 初始化支持工具调用的 Provider
    const provider = new OpenAIProviderWithTools({
        apiKey: process.env.AICODING_API_KEY || 'your-api-key',
        modelName: 'gpt-4o',
        provider: 'openai',
    });

    // 用户查询
    const userQueries = [
        '北京今天天气怎么样？',
        '计算 123 * 456',
        '搜索关于人工智能的最新新闻'
    ];

    for (const query of userQueries) {
        console.log(`\n👤 用户: ${query}`);

        try {
            // 调用 LLM 并传入工具定义
            const result = await provider.chatWithTools(
                [{ role: 'user', content: query }],
                tools
            );

            // 处理 LLM 的响应
            if (result.toolCalls && result.toolCalls.length > 0) {
                console.log(`🤖 LLM 决定调用 ${result.toolCalls.length} 个工具`);

                for (const toolCall of result.toolCalls) {
                    console.log(`  - ${toolCall.name}: ${JSON.stringify(toolCall.arguments)}`);

                    // 执行工具
                    const toolResult = await executeTool(toolCall.name, toolCall.arguments);
                    console.log(`  ✅ 结果: ${toolResult}`);
                }
            } else if (result.content) {
                console.log(`🤖 LLM 直接回复: ${result.content}`);
            }
        } catch (error) {
            console.error('❌ 错误:', error);
        }
    }

    console.log('\n✨ 示例完成');
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { main, tools, executeTool };
