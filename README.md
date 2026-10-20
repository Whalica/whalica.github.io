# Whalica Personal Website

Astro + TypeScript 静态个人站。设计基线为 Whalica-Codex-Handoff.md。独立仓库，不依赖或修改 OJ Insight / Lica Studio 源码。

## 本地开发

需要 Node >=22.22.0（本机验证环境为 24.21.0）、npm。

```sh
npm ci
npm run dev
npm run check
npm run build
npm run verify
npm run preview
```

预览默认 http://127.0.0.1:4321 。脚本为单个子进程禁用 Astro 遥测，避免受限环境写入用户配置目录。

## 内容维护

- 文章：`src/content/posts/*.md`，由 `src/content.config.ts` 校验。正式发布需要 `draft: false`、`demo: false` 和真实 `pubDate`。`featured: true` 控制首页精选，`updatedDate` 控制更新时间。
- 项目：`src/content/projects/*.json`。`featured` 与 `order` 控制首页。`role`、状态、链接和简介应先核实，禁止把待补充的内容改成未经核实的声明。
- 演示：`/demo/reading/`，明确标注演示及 noindex，不进入正式文章、RSS、Pagefind 和 sitemap。其他 `draft: true` 文章不生成路由。
- 风格：`src/styles/global.css` 集中维护设计变量、阅读排版、响应式与深色主题。无外部字体、图片或客户端框架依赖。
- GitHub 远程仓库已确认；公开联系方式尚未提供。RSS 使用已确认的默认站点地址生成。

## 部署到 GitHub Pages

远程仓库：https://github.com/Whalica/whalica.github.io 。默认站点地址为 https://whalica.github.io ，BASE_PATH 为 `/`。仓库 Settings → Pages 选择 GitHub Actions；网站变更通过功能分支 PR 审阅后合并 main，再触发部署。

默认部署无需额外 variables；如需更换站点地址，可覆盖以下 Actions repository variables：

- `SITE_URL`：真实 origin，例如 `https://OWNER.github.io`，或自定义域名的 origin。不要填示例值。
- `BASE_PATH`：项目站为 `/REPOSITORY`，用户站或独立域名为 `/`。

工作流会在 `main` 推送时校验、构建、检查链接并发布 `dist`。SITE_URL 默认使用已确认的 https://whalica.github.io，构建会生成 canonical/RSS/sitemap。首次使用也可手动运行。

本地 PowerShell 验证真实配置：

```powershell
$env:SITE_URL='你的真实站点 origin'
$env:BASE_PATH='/你的仓库名'
npm run build
npm run verify
```

自定义域名：确认 DNS 和 GitHub Pages 设置后，把真实域名加入 `public/CNAME`，更新 SITE_URL，并将 BASE_PATH 改为 `/`。发布前重新构建验证静态资源与内部链接。

## 当前边界

首页与文章阅读页已实现；Blog/Projects/CP/About/搜索/标签/归档/404 具备可用路由。项目详情使用明确资料占位，尚无已审阅的正式文章。个人背景、项目截图、职责、成果和外链仍需真实资料。已配置远程仓库与 GitHub Pages 默认地址，尚未对外部署。
