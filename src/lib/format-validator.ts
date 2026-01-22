/**
 * 格式校验和矫正工具
 * 用于检查 LLM 输出的工具调用格式是否正确，并在需要时进行矫正
 */

import { z } from 'zod';

// 定义工具调用的 Schema
const SuggestEnhancementsSchema = z.object({
  dimensions: z.array(z.object({
    key: z.string(),
    title: z.string(),
    options: z.array(z.object({
      label: z.string(),
      value: z.string(),
      description: z.string().optional()
    })),
    allowCustom: z.boolean().optional()
  }))
});

const ProposePromptSchema = z.object({
  title: z.string(),
  role: z.string(),
  objective: z.string(),
  context: z.string().optional(),
  constraints: z.array(z.string()),
  workflow: z.array(z.string()).optional(),
  outputFormat: z.string().optional(),
  finalPrompt: z.string()
});

/**
 * 校验工具调用格式
 */
export function validateToolCall(toolName: string, args: any): { valid: boolean; error?: string } {
  try {
    if (toolName === 'suggest_enhancements') {
      SuggestEnhancementsSchema.parse(args);
      return { valid: true };
    } else if (toolName === 'propose_prompt') {
      ProposePromptSchema.parse(args);
      return { valid: true };
    }
    return { valid: true }; // 其他工具暂不校验
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || '格式校验失败'
    };
  }
}

/**
 * 调用 grok-beta-fast 进行格式矫正
 */
export async function correctFormat(
  toolName: string,
  invalidArgs: any,
  apiKey: string,
  baseUrl: string
): Promise<{ success: boolean; correctedArgs?: any; error?: string }> {
  try {
    const correctionPrompt = `你是一个格式矫正专家。你的任务是修正 JSON 格式错误，但不能修改、删除或增加任何语义信息。

工具名称: ${toolName}
错误的 JSON: ${JSON.stringify(invalidArgs, null, 2)}

要求:
1. 只修正 JSON 格式错误（如缺少引号、逗号、括号等）
2. 不修改任何字段的值或含义
3. 不删除任何字段
4. 不添加任何新字段
5. 直接输出修正后的 JSON，不要有任何其他文字

修正后的 JSON:`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta-fast',
        messages: [
          { role: 'user', content: correctionPrompt }
        ],
        temperature: 0
      })
    });

    if (!response.ok) {
      throw new Error(`矫正请求失败: ${response.status}`);
    }

    const data = await response.json();
    const correctedText = data.choices[0]?.message?.content?.trim();

    if (!correctedText) {
      throw new Error('矫正模型返回空内容');
    }

    // 尝试解析矫正后的 JSON
    const correctedArgs = JSON.parse(correctedText);

    return { success: true, correctedArgs };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '格式矫正失败'
    };
  }
}
