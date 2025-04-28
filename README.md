# WebSheet - 在线文档编辑系统

WebSheet是一个基于Vue-Office的在线文档编辑系统，提供功能完善、界面美观的表格和文档编辑体验。

## 功能特点

- **多格式支持**：支持Word文档、Excel表格、PPT演示文稿、PDF(只读)和Markdown格式
- **协同办公**：基于OT算法的实时协同编辑，支持多人同时编辑文档
- **文档管理**：完善的文档版本控制，支持至少20个版本的历史记录
- **分享功能**：支持文档外链分享，可设置访问权限和有效期
- **表格增强**：支持单元格合并、样式设置、数据验证等高级功能
- **富文本编辑**：增强的文档编辑器，支持表格和图片插入

## 技术栈

### 前端
- Vue 3
- TypeScript
- Vue-Office
- Element Plus
- Pinia
- Socket.IO Client
- Vite

### 后端
- Node.js
- NestJS
- PostgreSQL
- Redis
- S3兼容存储
- Docker

## 开发环境要求

- Node.js 18 LTS 或更高版本
- pnpm 8.0 或更高版本
- Docker 和 Docker Compose (用于本地开发环境)
- 现代浏览器 (Chrome, Firefox, Edge, Safari)

## 快速开始

### 安装依赖

```bash
# 安装依赖
pnpm install
```

### 开发环境运行

```bash
# 启动开发服务器
pnpm dev
```

### 构建生产版本

```bash
# 构建生产版本
pnpm build
```

### 部署

详细的部署指南请参考 [部署文档](docs/deployment.md)。

## 项目结构

```
/
├── docs/               # 项目文档
├── public/             # 静态资源
├── src/                # 源代码
│   ├── api/            # API接口
│   ├── assets/         # 资源文件
│   ├── components/     # 组件
│   ├── composables/    # 组合式函数
│   ├── layouts/        # 布局组件
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia状态管理
│   ├── types/          # TypeScript类型定义
│   ├── utils/          # 工具函数
│   ├── views/          # 页面视图
│   ├── App.vue         # 根组件
│   └── main.ts         # 入口文件
├── .env                # 环境变量
├── .gitignore          # Git忽略文件
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript配置
└── vite.config.ts      # Vite配置
```

## 许可证

本项目使用 [MIT 许可证](LICENSE)。
