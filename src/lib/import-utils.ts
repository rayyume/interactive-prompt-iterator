/**
 * 收藏导入工具
 * 支持从 JSON 和 MD 格式导入
 */

import type { FavoritePrompt } from './db';

/**
 * 从 JSON 导入
 */
export function importFromJSON(jsonString: string): Omit<FavoritePrompt, 'id'>[] {
  try {
    const data = JSON.parse(jsonString);

    if (!data.favorites || !Array.isArray(data.favorites)) {
      throw new Error('无效的 JSON 格式：缺少 favorites 数组');
    }

    return data.favorites.map((fav: any) => ({
      title: fav.title || '未命名',
      content: fav.content || '',
      tags: fav.tags || [],
      createdAt: fav.createdAt ? new Date(fav.createdAt) : new Date(),
      updatedAt: fav.updatedAt ? new Date(fav.updatedAt) : new Date()
    }));
  } catch (error: any) {
    throw new Error(`JSON 解析失败: ${error.message}`);
  }
}

/**
 * 从 Markdown 导入
 */
export function importFromMarkdown(markdown: string): Omit<FavoritePrompt, 'id'>[] {
  const favorites: Omit<FavoritePrompt, 'id'>[] = [];

  // 按 ## 分割标题
  const sections = markdown.split(/^## /m).filter(s => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');

    // 提取标题（第一行，去掉序号）
    const titleLine = lines[0].trim();
    const title = titleLine.replace(/^\d+\.\s*/, '');

    // 提取标签
    let tags: string[] = [];
    const tagMatch = section.match(/\*\*标签\*\*:\s*(.+)/);
    if (tagMatch) {
      tags = tagMatch[1].split(',').map(t => t.trim().replace(/`/g, ''));
    }

    // 提取内容（在 ``` 代码块中）
    const contentMatch = section.match(/```\n([\s\S]*?)\n```/);
    const content = contentMatch ? contentMatch[1].trim() : '';

    if (title && content) {
      favorites.push({
        title,
        content,
        tags,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  return favorites;
}
