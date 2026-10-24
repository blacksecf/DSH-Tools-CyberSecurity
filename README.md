<h1 align="center">DSH-Tools-CyberSecurity</h1>

<p align="center">
  为网络安全从业者打造的 <strong>DeepSeek Harness</strong> 插件合集。
  <br>
  本地优先、开源、持续补充。
</p>

<p align="center">
  <img alt="DSH plugin collection" src="https://img.shields.io/badge/DSH-plugin%20collection-4f46e5">
  <img alt="Cybersecurity" src="https://img.shields.io/badge/focus-cybersecurity-0f766e">
  <img alt="Local-first" src="https://img.shields.io/badge/data-local--first-brightgreen">
</p>

> A curated collection of DeepSeek Harness plugins for cybersecurity workflows.
> Local-first, open source, and built for repetitive day-to-day tasks.

---

## 目录

- [插件目录](#plugin-index)
- [使用方式](#usage)
- [添加新插件](#adding-plugins)
- [安全与合规](#security)
- [许可证](#license)

<a id="plugin-index"></a>

## 插件目录

当前收录 **1** 款插件，后续持续补充。

| 插件 | 分类 | 简介 | 状态 | 文档 |
|---|---|---|---|---|
| [searchfile](../searchfile/README.zh-CN.md) | 本机效率 | 本机文件名搜索，支持悬浮窗、拖动、快捷键和绝对路径复制 | 可用 · v1.1.0 | [中文]([../searchfile/README.zh-CN.md](https://github.com/blacksecf/DSH-Tools-CyberSecurity/blob/main/searchfile/README.zh-CN.md)) · [English]([../searchfile/README.md](https://github.com/blacksecf/DSH-Tools-CyberSecurity/blob/main/searchfile/README.md)) · [源码](../searchfile/) |

分类建议：本机效率、信息收集、资产测绘、漏洞验证、应急响应、报告整理。

> 本页只维护总览表格。每个插件的安装、配置、限制和安全说明放在它自己的 README 中，避免合集首页越写越长。
> 
> 当前 `searchfile` 位于合集同级目录。如果只把本目录单独发布为 GitHub 仓库，请把表格里的相对链接替换为 `searchfile` 的 GitHub 地址。

<a id="usage"></a>

## 使用方式

每个插件独立安装、独立启用：

1. 进入插件目录，按该插件 README 的说明安装为 DSH bundle；
2. 在 **设置 → 插件** 中启用对应插件行；
3. 刷新 Web 页面，让 Client 半加载；
4. 按插件文档使用对应界面或快捷键。

> 同一插件行 id 或同一 HTTP 路由不能重复。安装新副本前，先移除旧 bundle。

<a id="adding-plugins"></a>

说明：

- 插件目录在合集目录内时，用 `./your-plugin/`；在合集同级目录时，用 `../your-plugin/`；
- 详细安装步骤、配置字段、数据访问范围、网络行为、缓存位置和已知限制，写在插件自己的 README 中；
- 插件较多时按分类排序，保持表格易读即可。

<a id="security"></a>

## 安全与合规

- 本合集面向合法的安全测试、应急响应、教学和研究场景，请仅在获得明确授权的环境中使用。
- DSH 插件可能以当前用户权限读取本机文件或执行操作。安装前请阅读对应插件源码和 README。
- 不要在公开 issue、截图或示例中暴露真实凭据、客户数据、内网地址或未脱敏的漏洞细节。
- 每个插件都应在自己的 README 中说明数据访问范围、网络请求、缓存位置和卸载清理方式。

<a id="license"></a>

## 许可证

各插件以对应目录中的许可证为准。当前 `searchfile` 使用 [MIT License](../searchfile/LICENSE)。

本合集由社区维护，与 DeepSeek 官方无隶属或背书关系。

---

<p align="center">
  Built for <a href="https://github.com/deepseek-ai/deepseek-harness">DeepSeek Harness</a> · 为安全从业者节省每一次重复操作
</p>
