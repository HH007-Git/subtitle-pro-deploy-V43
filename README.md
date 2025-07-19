# 🎬 SubtitlePro - AI字幕生成系统

> 基于OpenAI Whisper和智能翻译的专业字幕生成平台

## ✨ 功能特性

- 🎙️ **AI语音识别**: OpenAI Whisper高精度语音转文字
- 🌐 **智能翻译**: MyMemory + DeepL多语言翻译
- 📝 **专业编辑**: 可视化字幕编辑器
- 📁 **多格式支持**: MP4, WebM, AVI, MOV等
- 📤 **标准导出**: SRT, VTT等字幕格式
- 🌍 **50+语言**: 支持全球主要语言
- 🧪 **测试模式**: 无需API密钥即可体验

## 🚀 快速开始

### 在线使用
直接访问: **https://same-hvvchx3ol2s-latest.netlify.app**

1. 上传视频文件
2. 选择语言设置
3. 生成AI字幕
4. 下载SRT文件

### 生产环境配置

要使用完整的AI功能，需要配置API密钥：

#### 1. 获取API密钥
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (必需)
- **DeepL**: [deepl.com/pro-api](https://www.deepl.com/pro-api) (可选)

#### 2. 配置环境变量
1. 访问 [Netlify Dashboard](https://app.netlify.com/)
2. 选择 SubtitlePro 项目
3. 进入 **Site settings** → **Environment variables**
4. 添加以下变量:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key-here
   DEEPL_API_KEY=your-deepl-api-key-here (可选)
   NODE_ENV=production
   ```
5. **Deploy site** 重新部署

#### 3. 验证配置
访问 `/api/health` 查看配置状态，或查看编辑器页面的系统状态提示。

## 📖 详细文档

- [📋 生产环境配置指南](./PRODUCTION_SETUP.md)
- [🧪 API测试验证](./verify-production.sh)

## 🛠️ 技术架构

### 前端
- **框架**: Next.js 15 + React 18
- **UI库**: shadcn/ui + Tailwind CSS
- **部署**: Netlify (动态站点)

### 后端API
- **语音识别**: OpenAI Whisper API
- **翻译服务**:
  - MyMemory (免费)
  - DeepL (高质量)
- **架构**: Next.js API Routes

### 核心功能
```
/api/health      - 系统健康检查
/api/transcribe  - 语音识别处理
/api/translate   - 翻译服务
/api/test/*      - 测试模式API
```

## 💰 成本说明

### OpenAI Whisper
- **定价**: $0.006/分钟
- **示例**: 10分钟视频 ≈ $0.06

### DeepL (可选)
- **免费版**: 500,000字符/月
- **Pro版**: $6.99/月起

### 使用建议
- 测试/演示: 使用测试模式
- 生产环境: 配置真实API密钥
- 成本控制: 监控API使用量

## 🔧 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd subtitle-program

# 安装依赖
bun install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 添加你的API密钥

# 启动开发服务器
bun run dev
```

访问 http://localhost:3000

## 📊 项目状态

- ✅ **核心功能**: 完全实现
- ✅ **API集成**: 后端API完整
- ✅ **测试验证**: 全部通过
- ✅ **生产部署**: 在线可用
- ✅ **文档完整**: 配置指南齐全

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**🎉 开始创建专业字幕吧！** [立即使用 →](https://same-hvvchx3ol2s-latest.netlify.app)
