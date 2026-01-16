/**
 * Playwright 自动录制演示脚本
 * 用于录制应用的功能演示视频
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// 配置
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  outputDir: path.join(__dirname, '../docs/screenshots'),
  viewport: { width: 1920, height: 1080 },
  slowMo: 500, // 放慢操作速度，便于录制
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
 * 录制交互式提示词生成流程
 */
async function recordInteractiveFlow(page) {
  console.log('📹 开始录制：交互式提示词生成流程');

  // 等待页面加载
  await page.waitForLoadState('networkidle');
  await wait(1000);

  // 截图：初始页面
  await page.screenshot({
    path: path.join(CONFIG.outputDir, 'demo-01-homepage.png'),
    fullPage: true
  });

  console.log('✅ 已截图：初始页面');

  // 点击快速示例
  await page.click('text=AI 趋势分析文章');
  await wait(500);

  // 截图：输入框已填充
  await page.screenshot({
    path: path.join(CONFIG.outputDir, 'demo-02-input-filled.png'),
    fullPage: true
  });

  console.log('✅ 已截图：输入框已填充');

  // 点击发送按钮
  await page.click('button[type="submit"]');
  await wait(2000);

  // 等待AI响应
  await page.waitForSelector('text=正在思考', { timeout: 5000 }).catch(() => {});
  await wait(3000);

  // 截图：AI响应中
  await page.screenshot({
    path: path.join(CONFIG.outputDir, 'demo-03-ai-responding.png'),
    fullPage: true
  });

  console.log('✅ 已截图：AI响应中');

  // 等待交互式表单出现
  await page.waitForSelector('text=优化方向建议', { timeout: 15000 }).catch(() => {});
  await wait(1000);

  // 截图：交互式表单
  await page.screenshot({
    path: path.join(CONFIG.outputDir, 'demo-04-interactive-form.png'),
    fullPage: true
  });

  console.log('✅ 已截图：交互式表单');

  // 选择一些选项
  const buttons = await page.$$('button:has-text("专业")');
  if (buttons.length > 0) {
    await buttons[0].click();
    await wait(500);
  }

  // 截图：选择选项后
  await page.screenshot({
    path: path.join(CONFIG.outputDir, 'demo-05-options-selected.png'),
    fullPage: true
  });

  console.log('✅ 已截图：选择选项后');

  // 点击生成按钮
  await page.click('text=生成最终 Prompt 文档');
  await wait(3000);

  // 截图：最终结果
  await page.screenshot({
    path: path.join(CONFIG.outputDir, 'demo-06-final-result.png'),
    fullPage: true
  });

  console.log('✅ 已截图：最终结果');
  console.log('✅ 交互式流程录制完成\n');
}

/**
 * 录制文件上传演示
 */
async function recordFileUpload(page) {
  console.log('📹 开始录制：文件上传演示');

  // 点击新建对话
  await page.click('button:has-text("清空对话")');
  await wait(1000);

  console.log('✅ 文件上传演示录制完成\n');
}

/**
 * 主函数
 */
async function main() {
  console.log('🎬 开始录制演示...\n');

  const browser = await chromium.launch({
    headless: false, // 显示浏览器窗口
    slowMo: CONFIG.slowMo,
  });

  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    recordVideo: {
      dir: CONFIG.outputDir,
      size: CONFIG.viewport,
    },
  });

  const page = await context.newPage();

  try {
    // 访问应用
    console.log(`🌐 访问: ${CONFIG.baseUrl}`);
    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle' });

    // 录制各个场景
    await recordInteractiveFlow(page);
    await recordFileUpload(page);

    console.log('✅ 所有演示录制完成！');
    console.log(`📁 输出目录: ${CONFIG.outputDir}`);

  } catch (error) {
    console.error('❌ 录制出错:', error);
  } finally {
    await context.close();
    await browser.close();
  }
}

// 运行
main().catch(console.error);
