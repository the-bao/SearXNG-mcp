# SearXNG MCP Server

An MCP (Model Context Protocol) server that lets AI tools search the web via your [SearXNG](https://github.com/searxng/searxng) instance.

## Prerequisites

- Node.js >= 18
- A running SearXNG instance with **JSON format enabled** in `settings.yml`:

```yaml
search:
  formats:
    - html
    - json   # Required for this MCP server
```

## Quick Start

### Install via Claude Code

```bash
# Global (recommended, works in all projects)
claude mcp add searxng -s user -e SEARXNG_BASE_URL=http://localhost:8080 -- npx -y @the-bao/searxng-mcp

# Project-level only
claude mcp add searxng -e SEARXNG_BASE_URL=http://localhost:8080 -- npx -y @the-bao/searxng-mcp
```

### Manual

```bash
SEARXNG_BASE_URL=http://localhost:8080 npx -y @the-bao/searxng-mcp
```

## Configuration

### Environment Variable

| Variable | Required | Description |
|----------|----------|-------------|
| `SEARXNG_BASE_URL` | **Yes** | Your SearXNG instance URL (e.g. `http://localhost:8080`, `https://search.example.com`) |

### MCP Client Setup

Add to your MCP client configuration. Examples for common clients:

#### Claude Code

```bash
# Global (recommended, works in all projects)
claude mcp add searxng -s user -e SEARXNG_BASE_URL=http://localhost:8080 -- npx -y @the-bao/searxng-mcp

# Project-level only
claude mcp add searxng -e SEARXNG_BASE_URL=http://localhost:8080 -- npx -y @the-bao/searxng-mcp
```

#### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "searxng": {
      "command": "npx",
      "args": ["-y", "@the-bao/searxng-mcp"],
      "env": {
        "SEARXNG_BASE_URL": "http://localhost:8080"
      }
    }
  }
}
```

#### Cline / Roo Code (`.vscode/mcp.json`)

```json
{
  "servers": {
    "searxng": {
      "command": "npx",
      "args": ["-y", "@the-bao/searxng-mcp"],
      "env": {
        "SEARXNG_BASE_URL": "http://localhost:8080"
      }
    }
  }
}
```

#### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "searxng": {
      "command": "npx",
      "args": ["-y", "@the-bao/searxng-mcp"],
      "env": {
        "SEARXNG_BASE_URL": "http://localhost:8080"
      }
    }
  }
}
```

## Tools

### `searxng_search`

Search the web via SearXNG, aggregating results from Google, Bing, DuckDuckGo, Wikipedia, and 70+ other engines.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | *required* | Search query (supports `site:`, `filetype:`, etc.) |
| `preset` | string | — | Quick search mode: `general`, `code`, `tech`, `academic`, `news` (see below) |
| `categories` | string | — | Filter: `general`, `news`, `images`, `videos`, `science`, `it`, `files`, `music`, `repos`, `packages` |
| `engines` | string | — | Specific engines: `google`, `bing`, `duckduckgo`, `wikipedia`, `github`, `stackoverflow`, `arxiv`, `pubmed`, `youtube`... |
| `language` | string | — | Language code: `en`, `zh`, `ja`, `de`, `fr`, `es`... |
| `pageno` | number | 1 | Page number (1-50) |
| `time_range` | string | — | `day`, `month`, or `year` |
| `safesearch` | number | 0 | 0=off, 1=moderate, 2=strict |
| `response_format` | string | `markdown` | `markdown` or `json` |

**Presets** provide one-click search mode switching. Explicit params (`categories`, `engines`, `time_range`) override preset values when both are provided.

| Preset | categories | engines | time_range | Use case |
|--------|-----------|---------|------------|----------|
| `general` | — | — | — | General web search |
| `code` | — | `github,stackoverflow` | — | Code & programming |
| `tech` | `it` | — | — | IT & computer science |
| `academic` | `science` | `google scholar,arxiv,pubmed` | — | Papers & research |
| `news` | `news` | — | `month` | Recent news |

**Examples:**

```
searxng_search(query="Rust programming tutorial", preset="general")
searxng_search(query="AI", preset="news")
searxng_search(query="MCP server", preset="code")
searxng_search(query="transformer attention", preset="academic")
searxng_search(query="WebAssembly", preset="tech")
```

### `searxng_autocomplete`

Get search query suggestions.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | *required* | Partial search query |
| `language` | string | — | Language code |

## Docker Compose (SearXNG)

If you don't have SearXNG running yet:

```yaml
services:
  searxng:
    image: searxng/searxng:latest
    ports:
      - "8080:8080"
    volumes:
      - ./searxng-settings.yml:/etc/searxng/settings.yml:ro
```

Make sure `searxng-settings.yml` has JSON format enabled:

```yaml
use_default_settings: true

search:
  formats:
    - html
    - json
```

---

## 中文文档

# SearXNG MCP 服务器

一个基于 MCP（模型上下文协议）的服务器，让 AI 工具通过你的 [SearXNG](https://github.com/searxng/searxng) 实例搜索网页。

## 前置要求

- Node.js >= 18
- 一个运行中的 SearXNG 实例，并在 `settings.yml` 中**启用 JSON 格式**：

```yaml
search:
  formats:
    - html
    - json   # 本 MCP 服务器必须启用此项
```

## 快速开始

### 通过 Claude Code 安装

```bash
# 全局安装（推荐，所有项目可用）
claude mcp add searxng -s user -e SEARXNG_BASE_URL=http://localhost:8080 -- npx -y @the-bao/searxng-mcp

# 仅当前项目
claude mcp add searxng -e SEARXNG_BASE_URL=http://localhost:8080 -- npx -y @the-bao/searxng-mcp
```

### 手动运行

```bash
SEARXNG_BASE_URL=http://localhost:8080 npx -y @the-bao/searxng-mcp
```

## 配置

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `SEARXNG_BASE_URL` | **是** | SearXNG 实例地址（如 `http://localhost:8080`、`https://search.example.com`） |

### MCP 客户端配置

将以下内容添加到你的 MCP 客户端配置中。以下是常见客户端的示例：

#### Claude Code

```bash
# 全局安装（推荐，所有项目可用）
claude mcp add searxng -s user -e SEARXNG_BASE_URL=http://localhost:8080 -- npx -y @the-bao/searxng-mcp

# 仅当前项目
claude mcp add searxng -e SEARXNG_BASE_URL=http://localhost:8080 -- npx -y @the-bao/searxng-mcp
```

#### Claude Desktop（`claude_desktop_config.json`）

```json
{
  "mcpServers": {
    "searxng": {
      "command": "npx",
      "args": ["-y", "@the-bao/searxng-mcp"],
      "env": {
        "SEARXNG_BASE_URL": "http://localhost:8080"
      }
    }
  }
}
```

#### Cline / Roo Code（`.vscode/mcp.json`）

```json
{
  "servers": {
    "searxng": {
      "command": "npx",
      "args": ["-y", "@the-bao/searxng-mcp"],
      "env": {
        "SEARXNG_BASE_URL": "http://localhost:8080"
      }
    }
  }
}
```

#### Cursor（`.cursor/mcp.json`）

```json
{
  "mcpServers": {
    "searxng": {
      "command": "npx",
      "args": ["-y", "@the-bao/searxng-mcp"],
      "env": {
        "SEARXNG_BASE_URL": "http://localhost:8080"
      }
    }
  }
}
```

## 工具

### `searxng_search`

通过 SearXNG 搜索网页，聚合 Google、Bing、DuckDuckGo、Wikipedia 等 70 多个搜索引擎的结果。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `query` | string | *必填* | 搜索关键词（支持 `site:`、`filetype:` 等语法） |
| `preset` | string | — | 快捷搜索模式：`general`、`code`、`tech`、`academic`、`news`（见下表） |
| `categories` | string | — | 分类过滤：`general`、`news`、`images`、`videos`、`science`、`it`、`files`、`music`、`repos`、`packages` |
| `engines` | string | — | 指定引擎：`google`、`bing`、`duckduckgo`、`wikipedia`、`github`、`stackoverflow`、`arxiv`、`pubmed`、`youtube` 等 |
| `language` | string | — | 语言代码：`en`、`zh`、`ja`、`de`、`fr`、`es` 等 |
| `pageno` | number | 1 | 页码（1-50） |
| `time_range` | string | — | 时间范围：`day`（当天）、`month`（一个月内）、`year`（一年内） |
| `safesearch` | number | 0 | 安全搜索：0=关闭、1=适中、2=严格 |
| `response_format` | string | `markdown` | 输出格式：`markdown` 或 `json` |

**预设（Presets）** 提供一键切换搜索模式。当同时指定预设和显式参数（`categories`、`engines`、`time_range`）时，显式参数优先。

| 预设 | categories | engines | time_range | 适用场景 |
|------|-----------|---------|------------|----------|
| `general` | — | — | — | 通用搜索 |
| `code` | — | `github,stackoverflow` | — | 代码与编程 |
| `tech` | `it` | — | — | IT 与计算机科学 |
| `academic` | `science` | `google scholar,arxiv,pubmed` | — | 论文与学术研究 |
| `news` | `news` | — | `month` | 近期新闻 |

**示例：**

```
searxng_search(query="Rust 编程教程", preset="general")
searxng_search(query="AI", preset="news")                             # 搜索近期 AI 新闻
searxng_search(query="MCP server", preset="code")                     # 搜索代码仓库
searxng_search(query="transformer attention", preset="academic")      # 搜索学术论文
searxng_search(query="WebAssembly", preset="tech")                    # 搜索 IT 技术内容
```

### `searxng_autocomplete`

获取搜索关键词建议。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `query` | string | *必填* | 部分搜索关键词 |
| `language` | string | — | 语言代码 |

## Docker Compose（SearXNG）

如果你还没有部署 SearXNG：

```yaml
services:
  searxng:
    image: searxng/searxng:latest
    ports:
      - "8080:8080"
    volumes:
      - ./searxng-settings.yml:/etc/searxng/settings.yml:ro
```

确保 `searxng-settings.yml` 启用了 JSON 格式：

```yaml
use_default_settings: true

search:
  formats:
    - html
    - json
```

## 许可证

MIT
