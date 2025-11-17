# 影像监管AI系统

一个基于 Vue.js 的影像监管AI管理平台，提供知识库、规则库、模型管理、任务管理、预警管理等核心功能。

## 项目简介

影像监管AI系统是一个综合性的管理平台，旨在为医疗影像监管提供全方位的AI辅助管理功能。系统采用现代化的前端技术栈，提供直观友好的用户界面和丰富的功能模块。

## 技术栈

- **Vue.js** 2.6.14 - 渐进式 JavaScript 框架
- **Element UI** 2.15.14 - 基于 Vue 的组件库
- **Vue Router** 3.5.1 - 官方路由管理器
- **Vuex** 3.6.2 - 状态管理模式
- **Vue CLI** 5.0.0 - 项目脚手架工具

## 功能模块

系统包含以下核心功能模块：

- **知识库管理** - 文件上传、查询、查看、删除，支持多种文件格式（.doc, .docx, .pdf, .jpg, .jpeg, .png, .txt, .xls, .xlsx）
- **规则库管理** - 规则配置和管理
- **模型管理** - AI模型的管理和维护
- **任务管理** - 任务创建、执行和监控
- **预警管理** - 预警规则配置和预警信息查看
- **数据统计** - 数据分析和统计报表
- **日志管理** - 系统操作日志查看和管理
- **权限管理** - 用户权限配置和管理

## 项目结构

```
image_cloud/
├── public/                 # 静态资源目录
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── assets/            # 资源文件
│   │   └── logo.png
│   ├── components/         # 组件目录
│   │   ├── DataBaseView.vue
│   │   ├── KnowledgeBaseView.vue
│   │   ├── LogBaseView.vue
│   │   ├── ModelBaseView.vue
│   │   ├── PermissionBaseView.vue
│   │   ├── RuleBaseView.vue
│   │   ├── TaskBaseView.vue
│   │   └── WarningBaseView.vue
│   ├── router/            # 路由配置
│   │   └── index.js
│   ├── store/             # Vuex 状态管理
│   │   └── index.js
│   ├── views/             # 视图组件
│   │   └── Navigation.vue
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── babel.config.js        # Babel 配置
├── jsconfig.json         # JavaScript 配置
├── package.json          # 项目依赖配置
├── vue.config.js         # Vue CLI 配置
└── README.md            # 项目说明文档
```

## 安装和运行

### 环境要求

- Node.js >= 12.x
- npm >= 6.x 或 yarn >= 1.x

### 安装依赖

```bash
npm install
```

### 开发模式

启动开发服务器（支持热重载）：

```bash
npm run serve
```

项目将在 `http://localhost:8080` 启动。

### 生产构建

构建生产版本：

```bash
npm run build
```

构建后的文件将输出到 `dist/` 目录。

### 代码检查

运行 ESLint 进行代码检查和自动修复：

```bash
npm run lint
```

## 开发说明

### 路由配置

路由配置位于 `src/router/index.js`，采用嵌套路由结构，主布局为 `Navigation.vue`，各功能模块作为子路由。

### 组件开发

- 所有功能模块组件位于 `src/components/` 目录
- 使用 Element UI 组件库进行界面开发
- 遵循 Vue 2.x 的组件开发规范

### 状态管理

使用 Vuex 进行全局状态管理，配置文件位于 `src/store/index.js`。

## 浏览器支持

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 许可证

本项目为私有项目。

## 联系方式

如有问题或建议，请联系项目维护团队。

