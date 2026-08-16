# Paws & Whiskers

Friendly, practical guides for cat and dog owners - health, training, grooming, and everyday pet happiness

> 全部命令都是 `npm run xxx`，Windows（PowerShell/cmd）、Mac、Linux 通用，不依赖 bash/WSL。

> 站点域名：生成站点时建议传入真实域名（scaffold 第 6 个参数），否则 sitemap/robots/OG 元数据使用占位域名 https://example.vercel.app；也可在构建环境设置 `NEXT_PUBLIC_SITE_URL` 覆盖。

## 本地运行
```bash
npm install
npm run dev
```
打开 http://localhost:3000，改代码/加文章会热更新，适合开发时随时看效果。

## 主题风格

生成站点时已根据你的主题自动选用风格（配色 + 字体 + 布局），注入 `styles/globals.css` 的 CSS 变量与模板布局。内置预设：editorial（杂志）、travel（旅行）、food（美食）、tech（极客暗色）、minimal（极简）、playful（趣味）。文章详情页会按所选风格切换版式：`hero`（封面压字大图）、`split`（侧栏目录 + 正文）、`cover`（图在上标题在下）或 `minimal`（标题优先小图），并统一带目录、署名、相关文章和上一篇/下一篇。想换风格：重新跑 scaffold 时加 `--style <id>`；想参考某个网站的观感，加 `--ref-url <url>`（会抓取并提取其配色/字体/布局，失败时回退内置）。也可以直接改 `styles/globals.css` 顶部的 `:root` 变量微调。

## AdSense 申请

本站已内置申请所需的基础设施：关于/联系/隐私页面、`sitemap.xml`、`robots.txt`、每篇文章的 canonical/OG 元数据与 BlogPosting 结构化数据、响应式布局与 HTTPS（部署平台自带）。

提交申请前请过一遍清单：
- [ ] 已配置真实域名（scaffold 传 `site_url` 或构建时设 `NEXT_PUBLIC_SITE_URL`），不是 example.vercel.app
- [ ] 关于/联系/隐私三个页面已用真实信息替换 `TODO` 占位内容
- [ ] 至少 10-15 篇原创、有信息量的文章，且持续更新
- [ ] `npm run check` 通过且无"占位域名 / TODO"警告
- [ ] `/sitemap.xml`、`/robots.txt` 可正常访问

## 部署前本地测试（强烈建议，跟线上效果一致）

`npm run dev` 走的是 Next.js 开发模式，跟部署到 Vercel/Cloudflare 后的静态产物不完全一样。部署前建议用生产构建方式跑一遍：
```bash
npm run preview
```
这条命令等于 `next build`（产出 `out/` 静态目录，和实际部署的产物完全一样）+ `npm run check`（校验 frontmatter 与图片引用）+ 起一个本地静态服务器（自动分配端口，终端会打印访问地址，一般是 http://localhost:3000）。

**检查清单（过一遍再部署）**：
- [ ] `npm run build` 没有报错（MDX frontmatter 格式错、组件名拼错这类问题会在这一步暴露）
- [ ] 首页文章列表、每一篇文章详情页都能正常打开
- [ ] 封面图和正文配图能显示——`npm run check` 会校验图片文件是否存在，并要求每篇有 `cover` + 每个 H2 小节至少一个视觉块（`ArticleImage`/`ImageText`/`Gallery`/`Callout` 等），缺失或不达标会阻止 preview/部署；先跑 `npm run images:fetch`（见下面「配图」一节）
- [ ] `/sitemap.xml`、`/robots.txt` 能访问
- [ ] 中英文/日期这些 frontmatter 字段显示正常，没有 `undefined` 或格式错乱

跑完这一遍再执行 `npm run deploy:vercel` / `npm run deploy:cloudflare`，能提前避免部署到线上才发现的问题。

## 部署（Vercel 或 Cloudflare，任选其一，两套配置都已生成）

### Vercel

**方式一：CLI（最快）**
```bash
npm run deploy:vercel
```
首次会提示浏览器授权登录，之后每次跑这条命令就是重新部署。

**方式二：GitHub Actions 自动部署（推荐，push 即部署，无需手动导入）**
```bash
npm run push:github -- site public
```
若 `.env.local` 里同时配置了 `VERCEL_TOKEN`，脚本会自动关联/创建 Vercel 项目，并把 `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` 写入 GitHub Actions secrets（已登录 gh CLI 时自动写入，没有 gh 则打印手动添加说明）。项目已内置 `.github/workflows/deploy.yml`，之后每次 push main 自动构建部署到 Vercel。
（仓库会自动命名为 website-site；首次使用先配置 GITHUB_TOKEN 和 VERCEL_TOKEN，见文末「GitHub 托管」一节）

### Cloudflare Pages（纯静态导出，零适配层，最稳）

本项目 `next.config.mjs` 已设 `output: "export"`，`next build` 直接产出静态 `out/` 目录，Cloudflare Pages 原生托管，不需要 Workers 运行时适配，也就没有"服务端读文件"这类在 Workers 里跑不通的问题。

**方式一：CLI（最快）**
```bash
npm run deploy:cloudflare
```
内部依次是 build → `wrangler login`（首次授权）→ 建 Pages 项目（已存在会跳过）→ `wrangler pages deploy out`。

**方式二：Git 集成（Pages 面板导入一次，之后 push 自动部署）**
推送到 GitHub（仓库名 website-site，见文末「GitHub 托管」一节）后，到 Cloudflare 控制台 Workers & Pages → 创建 → Pages → 连接该 Git 仓库，构建命令填 `npm run build`，构建输出目录填 `out`，之后每次 push 自动重新构建上线。

两套配置（`vercel.json` 和 Cloudflare Pages）互不冲突，可以只选一个平台部署，也可以两个都部署做灾备/对比，产物是同一份静态 `out/` 目录。

## 新增内容

**推荐方式：让 AI 助手 / 编码 agent 直接写**，不需要配置任何模型 API key。在 `content/` 目录下新增 `xxx.mdx` 文件：
```
---
title: 文章标题
description: 一句话描述
date: "2026-08-13"
tags: ["标签1", "标签2"]
---
正文 Markdown/MDX 内容...
```

**备用方式：脱离编码 agent、想批量重新生成/换供应商时**，编辑 `content.config.json` 列出要写的选题：
```json
{
  "locale": "en",
  "topics": [
    { "title": "working title", "brief": "一句话说明角度" }
  ]
}
```
然后：
```bash
copy .env.example .env.local    # Windows；Mac/Linux 用 cp .env.example .env.local
```
编辑 `.env.local` 填入对应密钥（三选一即可），脚本会自动读取，不需要手动 export/set：
```bash
npm run content:generate -- --provider deepseek   # 或 openai / claude / openai-compatible（任意 OpenAI 兼容 API）
```
无需改代码，首页和详情页会自动读取 `content/` 下的所有文件。

## 配图（图文并茂）

每篇文章的封面图 + 正文配图统一放在 `public/images/<slug>/` 下，MDX 里用 `<ArticleImage>`、`<ImageText>`、`<Gallery>` 等正文组件插入（第一张封面固定 `cover.jpg`，后续为 `2.jpg`、`3.jpg`...）。每篇强制要求 1 张封面（frontmatter 的 `cover`）+ 每个 H2 小节至少一个视觉块，`npm run check` 会校验图文分布并阻止不合规的 preview/部署。

真正的图片文件需要在本机获取（沙盒环境连不到图片服务）：
```bash
npm run images:fetch -- --provider pexels   # 或 unsplash / openai（AI生图，适合插画类主题）
```
如果 `.env.local` 里没有对应密钥，脚本会**交互式询问并自动保存**；自动化环境可用 `--pexels-key <key>`（或 `--unsplash-key` / `--openai-key`）直接传参，或加 `--non-interactive` 禁用询问。
脚本按 `content.config.json` 里每篇 topic 的 `images: [{query, alt, filename}]` 逐张下载/生成，图片查询词（query）越具体越贴题（比如不要写 "travel"，要写 "narrow stone alley in Kyoto at dusk"）。

每个 topic 建议手写英文 `slug` 字段（脚本优先使用，未写则按标题转 ASCII slug）；重跑加 `--overwrite` 强制重新获取。下载后运行 `npm run check` 确认所有引用完整。生成站点时也可以在 scaffold 命令里加 `--pexels-key <key>`，密钥会自动写入 `.env.local`，之后直接取图。

## GitHub 托管 + 自动部署（Vercel / Cloudflare 均支持）

一次性设置后，以后每次 `git push` 都会自动触发重新构建上线（Vercel 和 Cloudflare 的 Git 集成都是这个模式）：

```bash
npm run push:github -- my-blog public
```
脚本会通过 GitHub API 自动创建仓库 **website-my-blog**（自动加 `website-` 前缀）、初始化 git（首次自动提交，主分支 main）并完成推送，全程不需要安装 gh CLI。

前提：在 `.env.local` 里配置 `GITHUB_TOKEN`（复制 `.env.example` 为 `.env.local` 后填写）。token 需要具备建仓库权限：Tokens (classic) 勾选 `repo` scope，或 fine-grained token 授予 Administration: write。token 只用于 API 调用和当次推送，不会写入 `.git/config`。推到组织仓库：

```bash
npm run push:github -- my-blog public --owner your-org
```

推送完成后：
- **Vercel**：如果 `push:github` 时已配置 `VERCEL_TOKEN`，脚本已自动关联 Vercel 项目并写入 Actions secrets，无需任何手动导入；否则手动到 https://vercel.com/new 导入该仓库（仅需一次），或补配 VERCEL_TOKEN 后重跑 `npm run push:github`。
- **Cloudflare**：控制台 Workers & Pages → Pages → 连接该 Git 仓库（仅需一次），构建命令 `npm run build`，输出目录 `out`

Vercel 绑定完成后，以后无论是加文章、跑 `content:generate`/`images:fetch`、还是改代码，只要 `git push`，GitHub Actions 都会自动重新构建部署到 Vercel；Cloudflare 走平台 Git 集成，同样 push 后自动部署。都不需要再手动跑部署命令。

## Windows 用户须知

- 只需要装好 [Node.js](https://nodejs.org/)（自带 npm/npx），不需要 WSL、Git Bash 或 bash，所有 `npm run xxx` 命令在 PowerShell / cmd 里原样可用。
- 项目内没有 bash 脚本，所有命令都是 `npm run xxx`，在 PowerShell / cmd 里原样可用。
- 推送 GitHub 不需要安装任何额外 CLI：在 `.env.local` 里配好 `GITHUB_TOKEN` 后，`npm run push:github` 直接通过 GitHub API 建仓库并推送（见上文「GitHub 托管」一节）。
