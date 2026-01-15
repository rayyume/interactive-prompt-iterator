const https = require('https');

const VERCEL_URL = 'https://interactive-prompt-iterator-9ecljhh99.vercel.app/';
const CHECK_INTERVAL = 10000; // 10秒检查一次
const MAX_ATTEMPTS = 30; // 最多检查30次（5分钟）

let attempts = 0;

function checkDeployment() {
  attempts++;
  console.log(`\n[${new Date().toLocaleTimeString()}] 检查部署状态 (${attempts}/${MAX_ATTEMPTS})...`);

  https.get(VERCEL_URL, (res) => {
    const { statusCode } = res;
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (statusCode === 200) {
        // 检查是否是认证页面
        if (data.includes('Authentication Required') || data.includes('Vercel Authentication')) {
          console.log('⚠️  部署成功，但需要身份验证（Deployment Protection 已启用）');
          console.log('✅ 代码已成功部署到 Vercel');
          console.log('🔒 需要关闭 Deployment Protection 才能公开访问');
          process.exit(0);
        } else if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
          console.log('✅ 部署成功！网站可以正常访问');
          console.log(`🌐 访问地址: ${VERCEL_URL}`);
          process.exit(0);
        }
      } else if (statusCode === 404) {
        console.log('⚠️  收到 404 响应，可能正在部署中...');
      } else {
        console.log(`⚠️  收到 ${statusCode} 响应`);
      }

      if (attempts >= MAX_ATTEMPTS) {
        console.log('\n❌ 超时：已检查 5 分钟，部署可能失败');
        console.log('请手动检查 Vercel 部署日志');
        process.exit(1);
      }

      setTimeout(checkDeployment, CHECK_INTERVAL);
    });
  }).on('error', (err) => {
    console.error('❌ 请求失败:', err.message);

    if (attempts >= MAX_ATTEMPTS) {
      process.exit(1);
    }

    setTimeout(checkDeployment, CHECK_INTERVAL);
  });
}

console.log('🚀 开始监控 Vercel 部署状态...');
console.log(`📍 URL: ${VERCEL_URL}`);
console.log(`⏱️  检查间隔: ${CHECK_INTERVAL / 1000} 秒`);
console.log(`🔄 最大尝试次数: ${MAX_ATTEMPTS}`);

checkDeployment();
