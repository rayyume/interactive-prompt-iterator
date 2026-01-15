# 开发规范和规则

- Next.js 16+ 在 Windows 环境下配合 Tailwind CSS v4 可能出现 Native Binding (lightningcss/oxide) 兼容性问题。
解决方法：彻底清理 node_modules 和 package-lock.json 后重装，或显式安装平台特定的 optionalDependencies。
启动脚本：不要使用 --turbo=false，直接使用 next dev (默认 Webpack) 或 next dev --turbo (启用 Turbopack)。
- 用户要求提示词迭代器输出必须是结构化的多维度建议表单（Generative UI），而非纯文本。支持用户选择、修改或新增。同时要求完善配置校验和模型自定义功能。
- 项目已实现 Generative UI 结构化输出（PromptProposalCard）和 Settings 连接测试功能。未来开发需维护此模式，禁止退化回纯文本输出。
- # 关键技术决策和约束

## 核心设计原则
1. **一轮交互优先**：所有优化维度必须在一次表单中展示完毕，避免多轮对话
2. **AI 驱动的维度生成**：不能只依赖预设选项，必须根据用户提示词动态分析生成
3. **三层架构分离**：
   - 装饰器层（风格控制）
   - 内容优化层（AI 分析）
   - 可视化层（对比展示）

## 技术约束
1. 使用 Vercel AI SDK 3.x (Legacy) 的 tool-calling 机制
2. 前端使用 Generative UI 模式，不能退化为纯文本输出
3. 必须保持与现有代码的兼容性（useChat, streamText）

## 待解决的技术问题
1. 如何设计 AI 分析工具的 schema 和 prompt
2. 如何平衡通用维度和动态维度的比例
3. 如何高效计算和展示文本差异
4. 如何处理用户拒绝所有建议的情况
