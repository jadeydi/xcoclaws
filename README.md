# XCoClaws Chrome Extension

一个基于 Vite + React + CRXJS 构建的现代 Chrome 扩展基础模版。

## 特性

- **Vite**: 极速的开发启动和热更新 (HMR)。
- **React**: 使用组件化方式开发 UI。
- **CRXJS**: 自动处理 `manifest.json` 和资源打包，简化扩展开发流程。
- **Manifest V3**: 符合最新的 Chrome 扩展标准。

## 开发环境准备

确保您的系统中已安装 [Node.js](https://nodejs.org/)。

## 快速开始

### 1. 安装依赖

在项目根目录下运行：

```bash
pnpm install
```

### 2. 开发模式

运行以下命令启动开发服务器：

```bash
pnpm dev
```

该命令会启动 Vite 并生成一个 `dist` 目录。

### 3. 安装到 Chrome

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`。
2. 开启右上角的 **"开发者模式"**。
3. 点击 **"加载已解压的扩展程序"**。
4. 选择本项目中的 `dist` 目录。

现在，每当您修改代码并保存时，扩展程序会自动热重载。

### 4. 生产构建

当您准备好发布扩展时，运行：

```bash
pnpm build
```

构建后的文件将位于 `dist` 目录中，您可以将其打包发布到 Chrome 应用商店。

## 项目结构

- `popup/`: 弹出窗口的 React 代码。
- `options/`: 选项页面的 React 代码。
- `background.js`: 后台服务工作线程 (Service Worker)。
- `scripts/content.js`: 内容脚本。
- `manifest.json`: 扩展清单文件。
- `vite.config.js`: Vite 配置文件。
