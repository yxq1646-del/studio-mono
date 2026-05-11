# AI 智能助手 — Vue 3 + Express + LLM

基于大语言模型的智能对话应用，支持多轮对话、实时语音和自定义智能体。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3, Vite, Pinia, vue-router, GSAP, marked |
| 后端 | Express, sql.js (SQLite), JWT, bcryptjs |
| AI | API V3 中转站 (api.v3.cm) — Claude Opus 4.7 / GPT-4o Realtime |
| 文件处理 | mammoth (Word), adm-zip (PPT), multer |

## 快速启动

```bash
npm install
npm run dev          # http://localhost:5174

cd server
npm install
node index.js        # http://localhost:3001
```

## 项目结构

```
studio-mono/
├── index.html
├── vite.config.js
├── package.json
├── server/
│   ├── index.js              # Express 入口
│   ├── db.js                 # SQLite 数据库
│   ├── routes/
│   │   ├── auth.js           # 登录 /api/auth/login
│   │   ├── chat.js           # AI 对话 (SSE 流式)
│   │   ├── agents.js         # 智能体 CRUD
│   │   └── files.js          # 文件提取
│   └── seeds/seed.js         # 初始数据
│
└── src/
    ├── main.js
    ├── App.vue
    ├── router/index.js
    ├── stores/auth.js
    ├── composables/
    │   ├── useApi.js
    │   ├── useRealtimeVoice.js   # GPT-4o 实时语音
    │   ├── useTTS.js             # 浏览器 TTS
    │   ├── useSpeechRecognition.js
    │   ├── useMouse.js
    │   ├── useScrollAnim.js
    │   └── useAudio.js
    ├── views/
    │   └── HomeView.vue
    ├── layouts/
    │   └── DefaultLayout.vue
    ├── components/            # 首页组件
    │   ├── NavBar.vue, HeroSection.vue, AboutSection.vue
    │   ├── WorkSection.vue, ProjectModal.vue
    │   ├── ServicesSection.vue, SkillsSection.vue
    │   ├── PhilosophySection.vue, FooterSection.vue
    │   ├── ThemeSwitcher.vue, CustomCursor.vue
    └── projects/ai-assistant/
        ├── views/
        │   ├── ChatView.vue       # 对话主页面
        │   └── ShareView.vue      # 分享页面
        ├── components/
        │   ├── VoiceButton.vue    # 语音输入 (STT)
        │   └── RealtimeVoice.vue  # 实时语音面板
        └── stores/
            ├── chat.js
            └── agents.js
```

## 路由

| 路径 | 页面 |
|---|---|
| `/` | 首页 |
| `/chat` | AI 助手 |
| `/share/:token` | 分享对话 |

## API 端点

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 当前用户 |
| POST | /api/chat | AI 对话 (SSE 流式) |
| POST | /api/chat/query | AI 查询 (非流式) |
| GET/POST/DELETE | /api/conversations | 对话管理 |
| GET/POST | /api/conversations/:id/messages | 消息管理 |
| POST | /api/conversations/:id/share | 生成分享链接 |
| GET | /api/share/:token | 查看分享 |
| GET/POST/PUT/DELETE | /api/agents | 智能体 CRUD |
| POST | /api/files/extract | 文件提取 |

## AI 配置

默认使用 API V3 中转站 (https://api.v3.cm)，已预配置：

| 用途 | 模型 |
|------|------|
| 文字对话 | claude-opus-4-7-max[1m] |
| 实时语音 | gpt-4o-realtime-preview-2024-12-17 |

点击聊天页 🔑 按钮可修改 API Key 和服务商。

## 语音功能

- **语音输入**：浏览器 STT，点击输入框旁的麦克风按钮
- **TTS 朗读**：点击消息旁的喇叭按钮朗读 AI 回复，可开启"自动朗读"
- **实时语音对话**：点击顶部"语音对话"按钮，支持 GPT-4o Realtime API（自动回退到 STT+TTS 模式）

## 功能特性

### 首页
- 自定义光标、GSAP 加载动画
- 大字标题、打字机副标题
- 背景视差、SVG 描边动效
- 4 色主题切换、背景音乐

### AI 助手
- 多轮对话 + SSE 流式输出
- 智能体创建与选择（自定义 System Prompt、Provider、Model）
- Markdown + 代码高亮
- 对话历史管理 + 分享
- 文件上传分析
- 实时语音对话
- 科技蓝暗色主题
