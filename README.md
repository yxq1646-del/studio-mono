# Studio Mono — Personal Portfolio + Full-Stack Projects

创意技术个人作品集网站，集成三个全栈项目。Vue 3 + GSAP 动效 + Express + SQLite。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3, Vite, Pinia, vue-router, GSAP, marked |
| 后端 | Express, sql.js (SQLite), JWT, bcryptjs |
| AI | DeepSeek API（也支持 Anthropic / OpenAI / 自定义） |
| 文件处理 | mammoth (Word), adm-zip (PPT), multer |

## 快速启动

```bash
# 前端
npm install
npm run dev          # http://localhost:5174

# 后端
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
├── server/                        # Express 后端
│   ├── index.js                   # 入口
│   ├── db.js                      # SQLite + 适配层
│   ├── db.sqlite                  # 数据库文件（Navicat 可打开）
│   ├── middleware/
│   │   ├── auth.js                # JWT 验证
│   │   └── rbac.js                # 角色鉴权
│   ├── routes/
│   │   ├── auth.js                # 登录 /api/auth/login
│   │   ├── users.js               # 用户 CRUD /api/users
│   │   ├── stats.js               # 仪表盘统计 /api/stats
│   │   ├── pets.js                # 宠物 CRUD /api/pets
│   │   ├── adoptions.js           # 领养申请 /api/adoptions
│   │   ├── agents.js              # 智能体 CRUD /api/agents
│   │   ├── chat.js                # AI 对话 + 搜索 /api/chat
│   │   └── files.js               # 文件提取 /api/files/extract
│   └── seeds/seed.js              # 初始数据
│
└── src/
    ├── main.js                    # 入口
    ├── App.vue                    # 加载动画 + 布局切换
    ├── router/index.js            # 全部路由 + 守卫
    ├── stores/auth.js             # 认证状态 (Pinia)
    ├── composables/
    │   ├── useApi.js              # API 封装 (fetch + SSE)
    │   ├── useMouse.js            # 全局鼠标追踪
    │   ├── useScrollAnim.js       # ScrollTrigger 封装
    │   └── useAudio.js            # 背景音乐
    ├── views/
    │   └── HomeView.vue           # 首页
    ├── layouts/
    │   ├── DefaultLayout.vue      # NavBar + slot
    │   └── AdminLayout.vue        # 侧栏 + slot
    ├── components/                # 首页组件
    │   ├── CustomCursor.vue       # 自定义光标
    │   ├── NavBar.vue             # 导航栏
    │   ├── HeroSection.vue        # 大字标题 + 打字机
    │   ├── AboutSection.vue       # 关于我
    │   ├── WorkSection.vue        # 作品集
    │   ├── ProjectModal.vue       # 项目弹框
    │   ├── ServicesSection.vue    # 三列能力
    │   ├── SkillsSection.vue      # 技能栈
    │   ├── PhilosophySection.vue  # 个人理念
    │   ├── FooterSection.vue      # CTA + 社交
    │   └── ThemeSwitcher.vue      # 4 色主题
    ├── styles/global.css          # CSS 变量 + 全局样式
    └── projects/
        ├── admin/                 # 后台管理系统（简约中性）
        │   ├── views/
        │   │   ├── LoginView.vue
        │   │   ├── DashboardView.vue
        │   │   ├── UsersView.vue
        │   │   ├── AdminPetsView.vue
        │   │   ├── AdminAdoptionsView.vue
        │   │   └── AdminAgentsView.vue
        │   ├── components/
        │   │   ├── AdminSidebar.vue
        │   │   └── StatCard.vue
        │   └── stores/admin.js
        ├── pet-platform/          # 宠物流转平台（治愈暖色）
        │   ├── views/
        │   │   ├── PetListView.vue
        │   │   ├── PetDetailView.vue
        │   │   └── AdoptionView.vue
        │   ├── components/
        │   │   ├── PetCard.vue
        │   │   └── AISearchBar.vue
        │   └── stores/pets.js
        └── ai-assistant/          # AI 智能助手（科技蓝）
            ├── views/
            │   └── ChatView.vue
            ├── stores/
            │   ├── chat.js
            │   └── agents.js
            └── components/
```

## 路由

| 路径 | 页面 | 权限 |
|---|---|---|
| `/` | 首页 | - |
| `/admin/login` | 登录 | - |
| `/admin/dashboard` | 仪表盘 | 登录 |
| `/admin/users` | 用户管理 | Admin |
| `/admin/pets` | 宠物管理 | Admin/Editor |
| `/admin/adoptions` | 领养审核 | Admin/Editor |
| `/admin/agents` | 智能体管理 | Admin/Editor |
| `/pets` | 宠物列表 | - |
| `/pets/:id` | 宠物详情 | - |
| `/pets/:id/adopt` | 领养申请 | - |
| `/chat` | AI 助手 | - |

## 数据库

SQLite，6 张表：`users`, `pets`, `adoptions`, `agents`, `conversations`, `messages`

Navicat 连接：新建 SQLite 连接 → 选择 `server/db.sqlite`

默认账号：`admin` / `admin123`

## API 端点

| Method | Path | Auth | 说明 |
|--------|------|------|------|
| POST | /api/auth/login | - | 登录 |
| GET | /api/auth/me | JWT | 当前用户 |
| GET | /api/stats | JWT | 仪表盘统计 |
| GET/POST/PUT/DELETE | /api/users | JWT+Admin | 用户 CRUD |
| GET/POST/PUT/DELETE | /api/pets | GET 公开，写需登录 | 宠物 CRUD |
| GET/POST/PUT | /api/adoptions | 审核需登录 | 领养申请 |
| GET | /api/agents | - | 智能体列表（公开） |
| GET | /api/agents/:id | - | 智能体详情（公开） |
| POST | /api/agents | - | 创建智能体（公开，用户端可创建） |
| PUT | /api/agents/:id | JWT+Admin/Editor | 更新智能体 |
| DELETE | /api/agents/:id | JWT+Admin | 删除智能体 |
| POST | /api/chat | - | AI 对话 (SSE 流式) |
| POST | /api/chat/query | - | AI 查询 (非流式) |
| GET/POST/DELETE | /api/conversations | - | 对话管理 |
| GET/POST | /api/conversations/:id/messages | - | 消息管理 |
| POST | /api/files/extract | - | 文件提取 |

## AI 助手配置

支持多服务商：

| 服务商 | 默认模型 | 格式 |
|---|---|---|
| DeepSeek（默认） | deepseek-chat | OpenAI 兼容 |
| Anthropic | claude-sonnet-4-20250514 | Anthropic |
| OpenAI | gpt-4o | OpenAI |
| 自定义 | 自填 | OpenAI 兼容 |

在聊天页面点击 🔑 按钮配置。

## 智能体（Agent）

用户可创建自定义 AI 智能体，每个智能体拥有独立的 System Prompt、服务商和模型配置：

- **创建**：聊天页侧边栏 → "选择智能体" → "创建智能体"，或在后台 `/admin/agents` 管理
- **对话**：选择智能体后新建对话，System Prompt 自动注入，AI 按设定角色回复
- **Provider 独立**：每个智能体可配置不同的服务商和模型，不受全局设置影响
- **搜索集成**：宠物流转页的 AI 搜索也支持选择智能体，用智能体的 system prompt 和 provider 做智能匹配

## UI 主题

三个子项目采用差异化视觉风格：

| 项目 | 风格 | 配色 | 氛围 |
|------|------|------|------|
| 后台管理 | 简约中性 | 黑白灰 + 绿强调 | 干净高效 |
| AI 助手 | 科技蓝 | 深蓝底 `#0f172a` / 蓝强调 `#3b82f6` | 暗色 IDE 风 |
| 宠物流转 | 治愈暖色 | 暖白底 `#fef9f2` / 琥珀强调 `#f59e0b` | 柔软温暖 |

## 功能特性

### 首页
- 自定义光标（跟随 + 变形）
- GSAP 加载动画
- 大字标题字符逐个入场
- 打字机副标题
- 背景视差
- 作品集悬浮预览圆
- SVG 描边动效
- 模糊渐显文本
- 4 色主题切换
- 背景音乐（仅首页）

### 后台管理
- RBAC 权限（admin/editor/viewer）
- 用户 CRUD + 搜索 + 分页
- 宠物管理（增删改）
- 领养审核（通过/拒绝）
- 智能体管理（增删改）
- 6 项数据统计

### 宠物流转
- 宠物卡片网格 + 筛选
- 宠物详情 + 领养申请
- AI 智能搜索（支持智能体选择，自然语言匹配）
- 文件上传（图片/PPT/Word）

### AI 助手
- 多轮对话 + SSE 流式输出
- 智能体创建与选择（自定义 System Prompt、Provider、Model）
- Markdown + 代码高亮
- 对话历史管理
- 文件上传分析
- 科技蓝暗色主题
