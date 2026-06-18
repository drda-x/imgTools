# ImgTools - 图片管理工具

<div align="center">
  <img src="https://img.shields.io/badge/vue-3-blue" alt="Vue 3" />
  <img src="https://img.shields.io/badge/typescript-%233178C6.svg?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/less-1D1C1D?logo=less" alt="Less" />
</div>

基于 PicGo API 和 GitHub API 的个人图片管理工具，采用 Animal Island Vue 风格设计。

## 功能特点

- 📤 **多图上传**：支持批量上传
- 🖱️ **拖拽上传**：拖拽图片到上传区域
- 📋 **粘贴上传**：直接粘贴剪切板图片
- 📱 **移动端适配**：支持手机相册选择
- 🔗 **多格式链接**：支持 Markdown、HTML、URL、UBB、自定义格式
- 🖼️ **图片预览**：点击放大查看
- 📚 **相册管理**：浏览、搜索、删除已上传图片
- ⚙️ **灵活配置**：可配置 GitHub 仓库参数
- 🎨 **美观界面**：基于 Animal Island Vue 风格

## 技术栈

- Vue 3 - 渐进式 JavaScript 框架
- TypeScript - 类型安全的 JavaScript
- Vite - 下一代前端构建工具
- Less - CSS 预处理器
- Element Plus - Vue 3 组件库
- Pinia - Vue 状态管理
- Axios - HTTP 客户端
- GitHub API - 图片存储

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

打开浏览器访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 使用说明

### 1. 配置 GitHub

1. 进入「设置」页面
2. 生成 GitHub Personal Access Token (需要 repo 权限)
3. 填写仓库所有者、仓库名称
4. 设置上传路径和分支

### 2. 上传图片

- **PC端**：
  - 点击「选择图片」按钮
  - 拖拽图片到上传区域
  - 使用 Ctrl+V 粘贴剪切板图片
- **移动端**：
  - 点击上传区域，选择相册图片

### 3. 复制链接

- 支持多种格式：Markdown、HTML、URL、UBB、自定义
- 点击复制按钮即可复制

## 项目结构

```
imgTools/
├── src/
│   ├── components/    # 组件
│   ├── layouts/       # 布局
│   ├── router/        # 路由
│   ├── stores/        # Pinia 状态管理
│   ├── styles/        # 样式
│   ├── utils/         # 工具函数
│   ├── views/         # 页面
│   ├── App.vue        # 根组件
│   └── main.ts        # 入口文件
├── index.html         # HTML 模板
├── package.json       # 依赖配置
├── vite.config.ts     # Vite 配置
└── tsconfig.json      # TypeScript 配置
```

## 许可证

MIT
