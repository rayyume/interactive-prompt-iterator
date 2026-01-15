const { chromium } = require('playwright');

/**
 * 快速诊断测试 - 检查 AI 回复是否显示
 */

(async () => {
  console.log('=== 快速诊断测试 ===\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听关键日志
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Final AI content length') ||
        text.includes('Starting to read stream') ||
        text.includes('Received chunk 1')) {
      console.log(`[重要] ${text}`);
    }
  });

  try {
    console.log('[1] 访问页面...');
    await page.goto('http://localhost:3002', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    console.log('[2] 注入配置...');
    await page.evaluate(() => {
      const config = {
        state: {
          apiKey: 'sk-xMUZVRACBogvAsbFxm2buTDoixjx7APxES7cBh5TELHABCe0',
          baseUrl: 'https://ai.huan666.de/v1',
          model: 'claude-haiku-4-5-20251001',
          systemPrompt: '你是交互式提示词优化助手。',
          availableModels: ['claude-haiku-4-5-20251001']
        },
        version: 0
      };
      localStorage.setItem('prompt-iterator-storage', JSON.stringify(config));
    });

    console.log('[3] 硬刷新页面...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log('[4] 发送测试消息...');
    const input = await page.locator('input[placeholder*="描述"]').first();
    await input.fill('你好');
    await page.waitForTimeout(500);

    const sendButton = await page.locator('button[type="submit"]').first();
    await sendButton.click();

    console.log('[5] 等待 AI 响应（10秒）...');
    await page.waitForTimeout(10000);

    console.log('[6] 检查消息内容...');
    const messages = await page.locator('.whitespace-pre-wrap').allTextContents();

    console.log('\n=== 测试结果 ===');
    console.log(`找到 ${messages.length} 条消息`);

    if (messages.length >= 2) {
      console.log(`\n用户消息: ${messages[0]}`);
      console.log(`AI 消息长度: ${messages[1].length} 字符`);
      console.log(`AI 消息内容: ${messages[1].substring(0, 100)}${messages[1].length > 100 ? '...' : ''}`);

      if (messages[1].length > 0) {
        console.log('\n✅ 成功！AI 回复正常显示');
      } else {
        console.log('\n❌ 失败！AI 回复为空');
      }
    } else {
      console.log('\n❌ 失败！未找到足够的消息');
    }

    console.log('\n[7] 保存截图...');
    await page.screenshot({ path: 'quick-test.png', fullPage: true });

  } catch (error) {
    console.error('\n❌ 测试出错:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
    console.log('\n测试完成！');
  }
})();
