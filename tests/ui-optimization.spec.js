const { test, expect } = require('@playwright/test');

test.describe('UI优化测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('搜索框UI测试', async ({ page }) => {
    // 检查搜索框是否存在
    const searchInput = page.locator('input[placeholder="搜索对话..."]');
    await expect(searchInput).toBeVisible();

    // 测试搜索功能
    await searchInput.fill('测试');

    // 检查清除按钮是否出现
    const clearButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    await expect(clearButton).toBeVisible();

    // 点击清除按钮
    await clearButton.click();
    await expect(searchInput).toHaveValue('');
  });

  test('模型选择器测试', async ({ page }) => {
    // 检查模型选择器是否存在
    const modelSelect = page.locator('button:has-text("deepseek")').first();
    await expect(modelSelect).toBeVisible();

    // 点击打开下拉菜单
    await modelSelect.click();

    // 等待下拉菜单出现
    await page.waitForTimeout(500);
  });

  test('主页加载测试', async ({ page }) => {
    // 检查标题是否存在
    await expect(page.locator('text=Prompt Iterator')).toBeVisible();

    // 检查快速示例按钮
    await expect(page.locator('text=AI 趋势分析文章')).toBeVisible();
    await expect(page.locator('text=PPT 大纲生成')).toBeVisible();
    await expect(page.locator('text=代码优化助手')).toBeVisible();
    await expect(page.locator('text=问卷设计')).toBeVisible();
  });

  test('输入框和发送按钮测试', async ({ page }) => {
    // 检查输入框
    const input = page.locator('input[placeholder="描述你的任务..."]');
    await expect(input).toBeVisible();

    // 输入文本
    await input.fill('测试消息');

    // 检查发送按钮是否可用
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeEnabled();
  });
});
