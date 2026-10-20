# Whalica 实施与验收记录

日期：2026-10-20（Asia/Shanghai）

> 后续更新（2026-10-20）：用户已指定远程仓库 https://github.com/Whalica/whalica.github.io 。已基于远程初始化提交创建 feat/personal-website 分支；默认 SITE_URL=https://whalica.github.io、BASE_PATH=/。当前构建生成 RSS 与 sitemap，13 页、165 个本地链接/资源验证通过，类型检查 0 errors / 0 warnings / 0 hints。下文为首版实施记录，其中“未绑定远程/无提交/未配置正式站点”描述初始状态。Git/PR 约定见 docs/git-workflow.md。


## 位置与范围

本地源码：C:\Whalica_blogs。初始目录为空，已初始化独立 Git 仓库，分支 main，暂无提交、remote 或对外部署。当前聊天目录原本不属于 Git 仓库。未修改 OJ Insight、OJ Insight Coach 或 Lica Studio 的任何仓库。

## 选型与计划

基线：D:\Downloads\Whalica-Codex-Handoff.md，已复制到仓库 docs/design-handoff.md。

AstroPaper 当前公开版本为 6.1.0，MIT 许可，有持续维护。考虑首页需要作品优先的结构与较大视觉定制，采用 Astro 自建，减少主题内部结构耦合。Node 24.21.0 / npm 11.19.0 / Git 2.45.1.windows.1。

实际采用 Astro 6.4.8、TypeScript、原生 CSS 设计变量、Content Collections、KaTeX、Shiki、Pagefind，静态生成。初评的 Astro 7.4.1 在本机出现内容集合依赖加载故障，已退回 npm 验证的 6.x 最新补丁版；锁文件已保留。Vite preserveSymlinks 用于绕过本环境的 realpath 权限故障；构建脚本仅对子进程禁用遥测。Pagefind 通过官方 Node API 获取索引，再由 Node 写出，避开原生并行写出的权限问题。

实施顺序：设计变量与导航页脚 → 首页 → Markdown 内容集合和阅读页 → 其余导航及内容入口 → 构建、链接、浏览器和部署路径验证。

## 已实现

- 首页：品牌首屏、数据驱动精选项目、Lica Studio 社区入口、正式文章空状态、CP 思考路径。
- 阅读页：中文排版、LaTeX、C++ 双主题高亮、代码复制、桌面目录、移动折叠目录、标签、日期字段与相关阅读。
- 内容：Posts 和 Projects 独立集合，草稿默认不发布，正式文章需要真实发布日期。
- 演示：/demo/reading/ 明确标注演示，noindex；排除正式文章路由、搜索、RSS、sitemap。
- 导航：Home / Blog / Projects / CP / About；搜索、标签、归档和 404。
- 明暗主题、主题记忆、跳至正文、可见焦点、减少动态效果适配、容器内横向滚动。
- RSS、sitemap、canonical 按真实 SITE_URL 启用；未配置时不杜撰地址。GitHub Pages Actions 与部署说明已准备，尚未执行远程部署。

## 实际验证

- npm run check：23 个文件，0 errors / 0 warnings / 0 hints。
- npm run build：成功生成 13 个页面；Pagefind 最终索引 0 篇正式文章，符合现有内容。
- npm run verify：13 页、152 个本地链接及资源路径通过，公式与高亮代码存在，演示隔离通过。
- 浏览器：本机 Chrome / Playwright，1440 / 768 / 360px 首页与阅读页，两种主题均无整页横向溢出；移动导航、折叠目录、真实剪贴板复制、主题刷新后记忆、空文章搜索通过，无页面 JavaScript 错误。截图在 outputs 目录。
- 配置 SITE_URL=https://validation.invalid、BASE_PATH=/whalica-validation 的测试构建通过；13 页、168 个链接及资源路径、RSS 与 sitemap 检查通过。仅用于本地验证，最终构建已清除这些测试设置。
- 临时发布夹具构建：14 页、183 个链接及资源通过；正式路由、RSS 条目、Pagefind 收录 1 篇及草稿不生成路由通过。夹具已删除，最终产物不含夹具。

## 需要补充

真实个人简介、GitHub/公开联系方式、项目职责/状态/成果/截图与链接、审阅后的正式文章、远程仓库及域名。当前项目详情明确标为资料待补充。未添加虚构成绩、技术栈或联系方式。

GitHub Actions 尚未在真实 GitHub 仓库运行，Linux 部署与正式域名环境仍待验证。当前不宣称线上部署成功。最后一次构建未配置正式 SITE_URL，因此 RSS 链接与 sitemap 暂未对外启用。

## 启动

在 PowerShell 中：

```powershell
cd C:\Whalica_blogs
npm run dev
```

首页 http://127.0.0.1:4321/；阅读演示 http://127.0.0.1:4321/demo/reading/。构建检查命令：npm run check、npm run build、npm run verify。
