/**
 * 装饰器引擎 - 基于 prompt-decorators 项目
 * 用于控制 AI 回答的风格和形式
 */

export interface DecoratorConfig {
  // 思考深度
  thinking_depth?: 'step_by_step' | 'debate' | 'socratic' | 'reasoning' | 'none';

  // 语气风格
  tone?: 'formal' | 'casual' | 'creative' | 'technical' | 'friendly';

  // 输出格式
  output_format?: 'markdown' | 'json' | 'code' | 'structured' | 'plain';

  // 评估改进
  evaluation?: ('critique' | 'refine')[];

  // 验证
  validation?: ('fact_check' | 'cite_sources')[];

  // 自定义装饰器
  custom?: string[];
}

/**
 * 构建装饰器前缀
 */
export function buildDecoratorPrefix(config: DecoratorConfig): string {
  const decorators: string[] = [];

  // 1. 思考深度装饰器
  if (config.thinking_depth && config.thinking_depth !== 'none') {
    const thinkingMap: Record<string, string> = {
      'step_by_step': '+++StepByStep',
      'debate': '+++Debate',
      'socratic': '+++Socratic',
      'reasoning': '+++Reasoning'
    };
    const decorator = thinkingMap[config.thinking_depth];
    if (decorator) decorators.push(decorator);
  }

  // 2. 语气装饰器
  if (config.tone) {
    decorators.push(`+++Tone(style=${config.tone})`);
  }

  // 3. 输出格式装饰器
  if (config.output_format) {
    decorators.push(`+++OutputFormat(format=${config.output_format})`);
  }

  // 4. 评估改进装饰器
  if (config.evaluation) {
    if (config.evaluation.includes('critique')) {
      decorators.push('+++Critique');
    }
    if (config.evaluation.includes('refine')) {
      decorators.push('+++Refine(iterations=2)');
    }
  }

  // 5. 验证装饰器
  if (config.validation) {
    if (config.validation.includes('fact_check')) {
      decorators.push('+++FactCheck');
    }
    if (config.validation.includes('cite_sources')) {
      decorators.push('+++CiteSources');
    }
  }

  // 6. 自定义装饰器
  if (config.custom && config.custom.length > 0) {
    decorators.push(...config.custom);
  }

  return decorators.filter(Boolean).join('\n');
}

/**
 * 将装饰器应用到提示词
 */
export function applyDecorators(prompt: string, config: DecoratorConfig): string {
  const decoratorPrefix = buildDecoratorPrefix(config);

  if (!decoratorPrefix) {
    return prompt;
  }

  return `${decoratorPrefix}\n\n${prompt}`;
}
