# Git / PR 操作约定

本仓库：C:\Whalica_blogs；origin：https://github.com/Whalica/whalica.github.io.git。

后续 Git 提交、推送与 PR 操作使用 PowerShell 命令。Git 调用显式传入当前仓库的 safe.directory，网络 Git 命令使用用户指定代理 http://127.0.0.1:7890。提交范围限定为本网站，不操作 OJ Insight 或 Lica Studio 仓库。通过功能分支创建 PR，不擅自合并。

```powershell
$repo = 'C:\Whalica_blogs'
$safe = $repo.Replace('\', '/')
git -c "safe.directory=$safe" -C $repo add <明确列出的文件>
git -c "safe.directory=$safe" -C $repo commit -m '<message>'
git -c "safe.directory=$safe" -c 'http.proxy=http://127.0.0.1:7890' -C $repo push -u origin HEAD:<branch>
```

PR 创建使用 PowerShell 中可用的 gh 命令；无 gh 时，可在 PowerShell 中通过 GitHub REST API 创建。凭据只在进程内使用，禁止输出、写入仓库或作为命令参数传递。
