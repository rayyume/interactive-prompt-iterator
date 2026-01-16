import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
    let body;
    try {
        body = await req.json();
    } catch (error) {
        return new Response('Invalid JSON in request body', { status: 400 });
    }

    const { messages, model: modelId } = body;

    if (!messages || !Array.isArray(messages)) {
        return new Response('Missing or invalid messages array', { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key');
    let baseUrl = req.headers.get('x-base-url') || 'https://api.openai.com/v1';

    // Normalize Base URL: Ensure it doesn't end with a slash for consistency
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }
    // Note: User might input 'https://api.deepseek.com' which needs '/v1' appended, 
    // or they might input 'https://api.deepseek.com/v1' directly. 
    // To be safe, if it doesn't end in /v1 and isn't openai, we might want to warn or try both?
    // For now, we trust the settings dialog to normalize, but we handle connection errors gracefully.

    // Demo Mode
    if (apiKey === 'demo') {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const text = "【演示模式】\n\n这是一个模拟回复。在真实模式下，我会调用工具生成结构化提示词。由于当前未配置真实 API Key，仅展示文本流式效果。\n\n您可以在设置中输入 OpenAI 或 DeepSeek 的 Key 来体验完整功能。";

                for (let i = 0; i < text.length; i++) {
                    const chunk = '0:' + JSON.stringify(text[i]) + '\n';
                    controller.enqueue(encoder.encode(chunk));
                    await new Promise(r => setTimeout(r, 20)); // Simulate typing delay
                }
                controller.close();
            }
        });
        return new Response(stream, {
            headers: { 'Content-Type': 'text/x-unknown; charset=utf-8' }
        });
    }

    if (!apiKey) {
        return new Response('Configuration Error: Missing API Key. Please configure it in Settings.', { status: 401 });
    }

    const openai = createOpenAI({
        baseURL: baseUrl,
        apiKey: apiKey,
    });

    try {
        const result = streamText({
            model: openai.chat(modelId || 'gpt-4-turbo'),
            messages,
            system: `# 你是谁

你是**通用提示词优化助手**，一个专业的 Prompt Engineering 专家。

你的唯一职责是：**帮助用户设计和优化提示词**，而不是执行提示词所描述的任务。

## 角色边界

✅ 你应该做的：理解用户目标 → **立即调用 suggest_enhancements 工具**展示交互式表格 → 生成结构化提示词方案

❌ 你不应该做的：直接执行任务、生成任务的最终输出、替代用户完成工作、**只用文字建议而不调用工具**

## 示例

| 用户输入 | ❌ 错误响应 | ✅ 正确响应 |
|---------|--------|--------|
| "帮我写一篇关于 AI 的文章" | 直接写文章 | **立即调用工具**展示角色/风格/格式选项 |
| "生成一个 PPT 大纲" | 直接生成大纲 | **立即调用工具**展示结构/详细度/风格选项 |
| "翻译这段文字" | 直接翻译 | **立即调用工具**展示语言/风格/专业度选项 |
| "授权操作" | 只给文字建议 | **立即调用工具**展示授权类型/处理方式/文档要求选项 |

---

# 工作流程

## 阶段 1：快速理解（不输出文字）
- 快速识别任务类型（写作、分析、生成、翻译、授权、管理等）
- **不要输出分析文字，直接进入阶段 2**

## 阶段 2：立即调用工具展示交互式表格
**关键：必须立即调用 \`suggest_enhancements\` 工具，不要只用文字描述**

根据任务类型选择 3-5 个最相关的维度：
- **写作类**：角色设定、语气风格、详细程度、输出格式
- **分析类**：分析深度、专业程度、结构要求、输出格式
- **操作类**（如授权、配置）：操作类型、处理方式、文档要求、安全级别
- **生成类**：创意程度、结构要求、详细程度、目标受众

每个维度提供 2-4 个具体选项，允许用户自定义。

## 阶段 3：生成提示词方案
**必须调用工具**：\`propose_prompt\`

生成内容必须包含：
1. 提示词标题
2. 角色定义
3. 核心目标
4. 背景信息
5. 约束条件列表
6. 工作流程（可选）
7. 输出格式要求
8. **完整的最终提示词**（可直接复制使用）

---

# 重要原则

1. **工具强制调用**：收到用户输入后，**必须立即调用 suggest_enhancements 工具**，不要只用文字描述
2. **角色坚守**：始终记住你是提示词优化助手，不是任务执行者
3. **零文字分析**：不要输出"我理解了"、"让我分析"等文字，直接调用工具
4. **通用性**：支持所有任务类型（写作、分析、操作、配置、授权等）
5. **质量保证**：生成的提示词必须清晰、结构化、可直接使用

---

# 工具调用示例（One-Shot Examples）

## 示例 1：写作任务

**用户**："帮我写一篇关于人工智能的文章"

**你的响应**：[直接调用工具，不输出文字]

\`\`\`json
{
  "dimensions": [
    {
      "key": "role",
      "title": "角色设定",
      "options": [
        { "label": "资深科技作家", "value": "tech_writer", "description": "专业的科技写作技巧" },
        { "label": "AI 研究专家", "value": "ai_expert", "description": "深厚的 AI 专业知识" },
        { "label": "科普作者", "value": "science_writer", "description": "通俗易懂的表达" }
      ],
      "allowCustom": true
    },
    {
      "key": "tone",
      "title": "语气风格",
      "options": [
        { "label": "专业正式", "value": "formal" },
        { "label": "轻松易读", "value": "casual" },
        { "label": "学术严谨", "value": "academic" }
      ],
      "allowCustom": true
    },
    {
      "key": "detail_level",
      "title": "详细程度",
      "options": [
        { "label": "深度分析", "value": "detailed" },
        { "label": "适中", "value": "moderate" },
        { "label": "简明概述", "value": "brief" }
      ],
      "allowCustom": true
    }
  ]
}
\`\`\`

## 示例 2：授权操作任务

**用户**："我理解您想要进行授权操作，但我目前无法处理用户权限管理相关的任务"

**你的响应**：[直接调用工具，不输出文字]

\`\`\`json
{
  "dimensions": [
    {
      "key": "operation_type",
      "title": "授权操作类型",
      "options": [
        { "label": "用户权限管理", "value": "user_permission", "description": "管理用户访问权限" },
        { "label": "系统配置授权", "value": "system_config", "description": "系统级配置权限" },
        { "label": "数据访问授权", "value": "data_access", "description": "数据库或文件访问权限" }
      ],
      "allowCustom": true
    },
    {
      "key": "handling_method",
      "title": "处理方式",
      "options": [
        { "label": "联系系统管理员", "value": "contact_admin", "description": "通过管理员处理" },
        { "label": "在管理系统中直接操作", "value": "direct_operation", "description": "使用管理界面" },
        { "label": "查看相关文档", "value": "check_docs", "description": "参考权限管理文档" }
      ],
      "allowCustom": true
    },
    {
      "key": "documentation",
      "title": "文档要求",
      "options": [
        { "label": "详细操作步骤", "value": "detailed_steps", "description": "包含每一步的详细说明" },
        { "label": "快速指南", "value": "quick_guide", "description": "简明扼要的操作指南" },
        { "label": "安全注意事项", "value": "security_notes", "description": "重点说明安全相关内容" }
      ],
      "allowCustom": true
    }
  ]
}
\`\`\`

**关键点**：
- 不要只是说"我会调用工具"，而是**立即调用工具**
- 工具调用会自动渲染为交互式表格
- 用户选择后，你会收到工具反馈，然后调用 propose_prompt 生成最终提示词
- **对于任何类型的任务（包括操作、配置、授权等），都必须调用工具展示选项**`,
            tools: {
                ask_questions: tool({
                    description: '当用户需求不明确时，调用此工具向用户提问。',
                    inputSchema: z.object({
                        questions: z.array(z.object({
                            id: z.string(),
                            text: z.string().describe('The question to ask the user'),
                            type: z.enum(['text', 'select', 'checkbox']).describe('Type of input required'),
                            options: z.array(z.string()).optional().describe('Options for select/checkbox')
                        }))
                    }),
                    execute: async () => 'User interaction required'
                }),
                suggest_enhancements: tool({
                    description: 'Phase 1: 提供多维度的优化建议供用户选择。',
                    inputSchema: z.object({
                        dimensions: z.array(z.object({
                            key: z.string(),
                            title: z.string().describe('维度标题，如"语气风格"'),
                            options: z.array(z.object({
                                label: z.string(),
                                value: z.string(),
                                description: z.string().optional()
                            })).describe('供用户点击的预设选项'),
                            allowCustom: z.boolean().default(true).describe('是否允许用户输入自定义要求')
                        }))
                    }),
                    execute: async () => 'Optimization options presented to user'
                }),
                propose_prompt: tool({
                    description: 'Phase 2: 根据用户选择生成最终的结构化提示词方案。',
                    inputSchema: z.object({
                        title: z.string().describe('提示词方案标题'),
                        role: z.string().describe('角色定义'),
                        objective: z.string().describe('核心目标'),
                        context: z.string().optional().describe('背景信息'),
                        constraints: z.array(z.string()).describe('约束条件列表'),
                        workflow: z.array(z.string()).optional().describe('工作流程步骤'),
                        outputFormat: z.string().optional().describe('输出格式要求'),
                        finalPrompt: z.string().describe('完整的最终提示词')
                    }),
                    execute: async () => 'Prompt proposal generated'
                })
            },
        });

        // 使用 fullStream 手动构建包含工具调用的响应
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const part of result.fullStream) {
                        console.log('Stream part type:', part.type, part);

                        if (part.type === 'text-delta') {
                            // 文本内容：使用 "0:" 前缀
                            // text-delta 的内容在 text 字段，不是 delta 字段
                            if (part.text !== undefined && part.text !== null) {
                                const chunk = `0:${JSON.stringify(part.text)}\n`;
                                controller.enqueue(encoder.encode(chunk));
                            }
                        } else if (part.type === 'tool-call') {
                            // 工具调用：使用 "9:" 前缀
                            // 注意：参数在 input 字段，不是 args
                            const toolData = {
                                toolCallId: part.toolCallId,
                                toolName: part.toolName,
                                args: part.input  // 使用 input 而不是 args
                            };
                            const chunk = `9:${JSON.stringify(toolData)}\n`;
                            controller.enqueue(encoder.encode(chunk));
                        } else if (part.type === 'tool-result') {
                            // 工具结果
                            console.log('Tool result:', JSON.stringify(part, null, 2));
                            const resultData = {
                                toolCallId: part.toolCallId,
                                toolName: part.toolName,
                                result: 'result' in part ? part.result : undefined
                            };
                            const chunk = `a:${JSON.stringify(resultData)}\n`;
                            controller.enqueue(encoder.encode(chunk));
                        }
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Vercel-AI-Data-Stream': 'v1'
            }
        });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        // Return a JSON error that the frontend can parse nicely, 
        // or just a text response with a clear error prefix that the UI can handle.
        // Standard Response with 500 status is best, UI useChat onError handles it.
        const errorMessage = error.message || 'Unknown network error';

        if (errorMessage.includes('fetch failed')) {
            return new Response(`Connection Failed: Could not reach ${baseUrl}. Please check your Base URL settings.`, { status: 504 });
        }
        if (errorMessage.includes('401')) {
            return new Response(`Authentication Failed: Invalid API Key for ${baseUrl}.`, { status: 401 });
        }
        if (errorMessage.includes('404')) {
            return new Response(`Model Not Found: The model '${modelId}' does not exist on this provider, or the Base URL path is incorrect.`, { status: 404 });
        }

        return new Response(`AI Error: ${errorMessage}`, { status: 500 });
    }
}
