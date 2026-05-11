# 部署指南

## 当前状态

项目已部署在 Railway：https://studio-mono.up.railway.app

## 绑定自定义域名（国内访问必做）

Railway 域名在国内被墙，需要绑定自己的域名才能正常访问。

### 1. 购买域名（3 个推荐平台）

| 平台 | 地址 | .com 首年价 | .cn 首年价 |
|---|---|---|---|
| 阿里云（万网） | wanwang.aliyun.com | 约 ¥60 | 约 ¥29 |
| 腾讯云 | cloud.tencent.com | 约 ¥60 | 约 ¥29 |
| 西部数码 | west.cn | 约 ¥55 | 约 ¥29 |

建议买 `.com`，全球通用。

### 2. Railway 添加自定义域名

1. 登录 Railway
2. 打开项目 → **Settings** → **Networking** → **Public Networking**
3. 找到 **Custom Domain**，输入你的域名（如 `example.com`）
4. 点击 **Add**，Railway 会显示一个 CNAME 目标地址

### 3. DNS 解析设置

在购买域名的平台找到 **DNS 解析** 或 **域名解析**，添加两条记录：

| 记录类型 | 主机记录 | 记录值 |
|---|---|---|
| CNAME | `www` | `studio-mono.up.railway.app`（或 Railway 给的地址）|
| CNAME | `@` | `studio-mono.up.railway.app`（或 Railway 给的地址）|

> 部分国内平台 `@` 记录不支持 CNAME，可用 **URL 转发** 替代，将 `example.com` 转发到 `www.example.com`。

### 4. 等待生效

DNS 解析通常 **1-10 分钟** 生效，最长 24 小时。之后用 `https://www.你的域名.com` 就能在国内访问了。

---

## 本地开发

```bash
# 前端（项目根目录）
npm install
npm run dev          # http://localhost:5174

# 后端
cd server
npm install
node index.js        # http://localhost:3001
```

默认管理员账号：`admin` / `admin123`

## 技术栈

- **前端**：Vue 3 + Vite + Pinia + GSAP + vue-router
- **后端**：Express + sql.js (SQLite) + JWT + bcryptjs
- **AI**：DeepSeek / Anthropic / OpenAI
- **部署**：Railway (Node.js 22)

## 数据库

SQLite，文件存储在 `server/db.sqlite`。Railway 免费套餐的数据库**会在重启后重置**。需要持久化请升级 Railway 套餐或考虑迁移到 PostgreSQL。

## 环境变量（按需配置）

在 Railway 项目 → Variables 中添加：

| 变量 | 说明 | 默认值 |
|---|---|---|
| `PORT` | 服务端口 | `3001` |
| `JWT_SECRET` | JWT 密钥 | 自动生成 |
| `NODE_ENV` | 环境模式 | `production` |
| `CDN_PROVIDER` | 图片存储 | `local` |
