/**
 * Playwright 多场景应用示例录制脚本
 * 演示不同场景下的提示词生成
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// 配置
const CONFIG = {
  baseUrl: 'https://interactive-prompt-iterator.vercel.app',
  outputDir: path.join(__dirname, '../docs/screenshots'),
  viewport: { width: 1280, height: 800 },
};

// 确保输出目录存在
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * 等待指定时间
 */
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 录制多场景应用示例
 */
async function recordMultiScenarios(page) {
  console.log('📹 开始录制：多场景应用示例');

  // 访问首页
  await page.goto(CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(2000);

  // 场景1: 内容创作 - 博客文章
  console.log('  📝 场景1: 内容创作 - 博客文章');
  await page.fill('input[placeholder="描述你的任务..."]', '帮我写一篇关于人工智能发展趋势的博客文章');
  await wait(1000);
  await page.click('button[type="submit"]');
  await wait(5000);

  console.log('✅ 多场景应用示例录制完成');
}

/**
 * 主函数
 */
async function main() {
  console.log('🎬 开始录制多场景应用示例GIF...\n');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    recordVideo: {
      dir: CONFIG.outputDir,
      size: CONFIG.viewport,
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    await recordMultiScenarios(page);
    console.log('✅ 录制完成！');
  } catch (error) {
    console.error('❌ 录制出错:', error);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(console.error);
