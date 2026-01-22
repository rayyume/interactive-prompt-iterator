/**
 * 收藏导出工具
 * 支持导出为 MD、JSON、DOCX 格式
 */

import type { FavoritePrompt } from './db';

/**
 * 导出为 Markdown 格式
 */
export function exportToMarkdown(favorites: FavoritePrompt[]): string {
  let markdown = '# 我的收藏提示词\n\n';
  markdown += `> 导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  markdown += `> 共 ${favorites.length} 个收藏\n\n`;
  markdown += '---\n\n';

  favorites.forEach((fav, index) => {
    markdown += `## ${index + 1}. ${fav.title}\n\n`;

    if (fav.tags && fav.tags.length > 0) {
      markdown += `**标签**: ${fav.tags.map(tag => `\`${tag}\``).join(', ')}\n\n`;
    }

    markdown += `**创建时间**: ${new Date(fav.createdAt).toLocaleString('zh-CN')}\n\n`;
    markdown += `**更新时间**: ${new Date(fav.updatedAt).toLocaleString('zh-CN')}\n\n`;
    markdown += '**内容**:\n\n';
    markdown += '```\n';
    markdown += fav.content;
    markdown += '\n```\n\n';
    markdown += '---\n\n';
  });

  return markdown;
}

/**
 * 导出为 JSON 格式
 */
export function exportToJSON(favorites: FavoritePrompt[]): string {
  const exportData = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    count: favorites.length,
    favorites: favorites.map(fav => ({
      title: fav.title,
      content: fav.content,
      tags: fav.tags || [],
      createdAt: fav.createdAt,
      updatedAt: fav.updatedAt
    }))
  };

  return JSON.stringify(exportData, null, 2);
}
