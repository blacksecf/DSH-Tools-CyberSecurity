<p align="center">
  <img src="icon.svg" width="88" height="88" alt="DSH File Search 图标">
</p>
<h1 align="center">DSH Search File</h1>

<p align="center">
  为使用<strong>DeepSeek Harness</strong>的网络安全从业者打造的轻量本机文件搜索小窗。
  <br>
  搜索文件名，查看绝对路径，一键复制。
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="Dependencies: 0" src="https://img.shields.io/badge/dependencies-0-brightgreen">
  <img alt="Node.js >= 20" src="https://img.shields.io/badge/Node.js-%3E%3D20-339933">
</p>


<p align="center">
  <a href="README.md">English</a> | <strong>简体中文</strong>
</p>


DSH SearchFile会在 Harness Web 界面右下角添加一个悬浮搜索按钮。点击后输入文件名的一部分，即可从本地文件名索引中得到按匹配质量排序的绝对路径。点击结果行即可把路径复制到剪贴板。

插件刻意保持轻量：只有两个 JavaScript 文件，没有运行时依赖，不需要构建，也不会发起外部网络请求。

## 功能

- **简洁悬浮窗**：渲染在 Harness 的 `shell.overlay` 插槽中。
- **可拖动面板**：按住标题栏移动，拖动范围限制在视口内。
- **可拖动悬浮按钮**：面板关闭时可拖动按钮；轻点仍然打开面板。
- **即时文件名搜索**：本地索引按需建立，输入后快速返回结果。
- **显示绝对路径**：点击结果或按 `Enter` 一键复制，并显示复制状态。
- **键盘操作**：`Ctrl+Shift+F` 打开，`↑`/`↓` 选择，`Enter` 复制，`Esc` 关闭。
- **中英双语界面**，跟随 Harness 主题 token 适配明暗主题。
- **零运行时依赖**、零构建产物、无遥测、无外部 HTTP 请求。
- **可配置索引范围**：通过插件行配置 `roots`、条目上限、刷新间隔、预热和额外排除目录。

## 环境要求

- 带 Web UI 和 `shell.overlay` 插槽的 DSH。
- Host 端需要 Node.js 20 或更高版本。
- 主要面向 Windows 10/11。其他平台请显式设置 `roots`。
- 不需要安装依赖或执行构建。

已在 DSH `0.2.1-rc.3` + Windows 环境测试。

## 安装

### 1. 克隆仓库

```bash
git clone https://github.com/<your-name>/searchfile.git
```

请把 `<your-name>` 替换为仓库所属的 GitHub 账号。

### 2. 把目录安装为 DSH bundle

使用 DSH 的本地路径 bundle 安装方式。在启用了 `plugin_manager` 工具的 Agent 会话中，执行 `install_bundle`，把目录绝对路径作为 `target`：

```text
plugin_manager
  action: install_bundle
  target: <searchfile 文件夹的绝对路径>
```

安装采用链接方式，不会复制代码，因此安装后请保留该目录。

> 如果之前用其他包名安装过旧副本，请先移除旧 bundle。两个副本使用相同的
> `file-search` 行 id 和相同的 HTTP 路由，不能同时存在。

### 3. 如有需要，启用插件行

打开 **设置 → 插件**，若 `include:file-search` 被禁用，请启用它。

### 4. 刷新 Web UI

安装完成后刷新一次页面。右下角会出现 **搜索文件** 按钮；点击它，或按 `Ctrl+Shift+F`。

> 本仓库是 DSH bundle，不是发布到 npm 的包。`package.json` 中的 `private: true` 是刻意保留的。

## 使用

1. 打开悬浮按钮，或按 `Ctrl+Shift+F`。
2. 输入文件名、文件名的一部分，或路径片段。
3. 结果会显示文件名和完整绝对路径，并按匹配质量排序。
4. 点击结果，或用 `↑`/`↓` 选中后按 `Enter`，复制完整路径。
5. 拖动标题栏移动面板；面板关闭时拖动悬浮按钮调整按钮位置。
6. 按 `Esc` 关闭面板。

底部会显示匹配总数；当结果超过 60 行时显示 `已显示 / 总数`。

## 配置

插件会读取可选的插件行配置，但没有声明 Config schema，因此没有设置表单。可在 profile patch 中添加覆盖：

```yaml
- id: file-search
  config:
    roots:
      - 'C:\\'
      - 'D:\\'
    maxEntries: 300000
    refreshMinutes: 10
    warmOnStart: true
    exclude:
      - 'MyHugeFolder'
```

覆盖会替换完整的 `config` 对象，因此请重复写出所有想保留的字段。

| 字段             | 默认值                    | 说明                                                         |
| ---------------- | ------------------------- | ------------------------------------------------------------ |
| `roots`          | 用户主目录 + 所有可读盘符 | 要索引的绝对目录。支持 `~`。                                 |
| `maxEntries`     | `300000`                  | 最大索引文件数，限制在 `1000`–`1000000`。                    |
| `refreshMinutes` | `10`                      | 缓存超过该时长后后台重建。`0` 表示每次激活都刷新；最大 `10080`（7 天）。 |
| `warmOnStart`    | `true`                    | 激活后短时间预热已有缓存。首次没有缓存时仍等待第一次搜索。   |
| `exclude`        | `[]`                      | 额外跳过的目录名（不区分大小写）。                           |

内置排除目录包括 `Windows`、`WinSxS`、`Program Files`、`ProgramData`、`AppData`、`$Recycle.Bin`、`node_modules`、`.git`、`.cache`、`.npm`、`.pnpm-store`、`.venv`、`__pycache__` 等。

## 工作原理

```text
浏览器 (client.js)
  GET /plugin-file-search/search?q=报告&limit=60
        |
        v
Host (index.js)
  内存文件名索引  <-->  本地缓存
        |
        v
  JSON：排序后的路径、总匹配数、索引状态
```

- **Client**：通过 `window.__ModuleLoader__.load` 注册，渲染到 `shell.overlay`。使用普通 React 元素和内联 CSS，颜色读取 `--dsw-alias-*` 主题 token。
- **Host**：使用 `fs.promises.opendir` 建立无依赖索引，注册一个同源 `GET` 路由，并原子写入缓存。
- **排序**：文件名完全匹配 → 前缀匹配 → 文件名包含 → 路径包含 → 多关键词匹配；同等级按文件名长度和路径长度排序。
- **缓存**：`index-v3.json`，只保存绝对路径，不保存文件内容。
- **刷新**：激活后预热缓存；缓存超过 `refreshMinutes` 时后台重建，旧结果在重建期间仍可搜索。

## 隐私与安全

- 无遥测、分析或外部网络请求。
- 不读取文件内容，只读取目录项和元数据。
- 唯一 HTTP 接口是同源 `GET /plugin-file-search/search`；其他方法返回 `405`。
- 接口只响应已经到达 DSH Web 服务的请求。启用插件时，不要把 DSH 端口暴露到不可信网络。
- 本地缓存包含绝对路径。如需清除该记录，可删除缓存；下次搜索会重新建立。

完整信任模型和漏洞报告方式见 [SECURITY.md](SECURITY.md)。

## 性能与限制

在约 30 万个索引文件的 Windows 桌面上实测：

| 操作         | 典型耗时   |
| ------------ | ---------- |
| 首次建立索引 | 20–30 秒   |
| 读取热缓存   | 2–3 秒     |
| 单次查询     | 30–60 毫秒 |

首次建索引期间界面仍可使用：结果会逐步出现，状态栏显示当前扫描目录。

已知限制：

- **只搜文件名，不搜文件内容。**
- **没有文件系统实时监听**。新文件要等下一次刷新/重建才会出现。
- **有条目上限和排除目录**，避免全盘扫描拖慢界面。
- **最多显示 60 行**，底部仍会显示匹配总数。
- **跳过符号链接和 junction**，避免循环。
- **刷新页面后，面板和悬浮按钮位置恢复默认。**
- 默认盘符发现面向 Windows；其他平台请配置 `roots`。

## 开发

```bash
npm run check
```

该命令会执行语法检查，并运行 `scripts/check.mjs`，校验清单、包名/Client id/patch 名称一致性、导出文件、语言元数据、图标和 Host 路由。

项目没有构建步骤，也不需要 `npm install`。

### 修改约定

- Host 端保持无依赖，只使用 Node 内置模块。
- Client 端只允许 `require('react')`，不要引入 `@deepseek-ai/dsh-client-ui-primitives` 等 Harness Client 包。
- 保持 `package.json` 的包名、Client 模块 id、patch 中的包名一致。
- 同时测试冷启动建索引和热缓存启动。
- 破坏性测试请使用可丢弃的 DSH profile。

提交 PR 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 仓库结构

| 路径                               | 作用                                             |
| ---------------------------------- | ------------------------------------------------ |
| `index.js`                         | Host 端：索引、缓存、HTTP 路由、可选配置。       |
| `client.js`                        | 浏览器端：悬浮按钮、可拖动小窗、搜索与复制界面。 |
| `cordis.patch.yml`                 | 把 `file-search` 行插入 Harness 组合。           |
| `package.json`                     | Bundle 与 Client 清单。                          |
| `locale/en.json`、`locale/zh.json` | 插件管理器的标题与描述。                         |
| `icon.svg`                         | 原创插件图标。                                   |
| `scripts/check.mjs`                | 仓库一致性检查。                                 |
| `.github/workflows/check.yml`      | CI 语法与清单检查。                              |
| `CHANGELOG.md`                     | 版本记录。                                       |

## 卸载

在 **设置 → 插件** 中禁用或移除 `include:file-search`。如需一并删除本地索引缓存：

- Windows：删除 `%LOCALAPPDATA%\dsh-file-search\index-v3.json`
- 其他平台：删除 `$XDG_CACHE_HOME/dsh-file-search/` 或 `~/.cache/dsh-file-search/`

## 许可证

MIT，详见 [LICENSE](LICENSE)。

为 DeepSeek Harness 构建，与 DeepSeek 官方无隶属或背书关系。
