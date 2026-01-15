/**
 * 预设模式配置
 * 基于 prompt-decorators 的装饰器组合
 */

import { DecoratorConfig } from './decorator-engine';

export interface PresetMode {
  id: string;
  name: string;
  icon: string;
  description: string;
  decorators: DecoratorConfig;
}

export const PRESET_MODES: Record<string, PresetMode> = {
  academic: {
    id: 'academic',
    name: '学术研究',
    icon: '🎓',
    description: '适合文献综述、研究方法设计',
    decorators: {
      thinking_depth: 'reasoning',
      tone: 'formal',
      output_format: 'structured',
      validation: ['fact_check', 'cite_sources']
    }
  },

  coding: {
    id: 'coding',
    name: '代码开发',
    icon: '💻',
    description: '适合代码生成、代码审查',
    decorators: {
      thinking_depth: 'step_by_step',
      tone: 'technical',
      output_format: 'code',
      evaluation: ['critique']
    }
  },

  creative: {
    id: 'creative',
    name: '创意写作',
    icon: '✨',
    description: '适合文案撰写、故事创作',
    decorators: {
      thinking_depth: 'none',
      tone: 'creative',
      output_format: 'markdown',
      evaluation: ['refine']
    }
  },

  data_analysis: {
    id: 'data_analysis',
    name: '数据分析',
    icon: '📊',
    description: '适合数据解读、趋势分析',
    decorators: {
      thinking_depth: 'reasoning',
      tone: 'technical',
      output_format: 'structured',
      evaluation: ['critique'],
      validation: ['fact_check']
    }
  }
};
