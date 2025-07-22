# 使用Node.js 22官方镜像
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN corepack enable pnpm

# 设置pnpm配置
RUN npm config set registry https://registry.npmmirror.com
RUN pnpm config set registry https://registry.npmmirror.com

# 复制package.json和pnpm-lock.yaml
COPY package.json ./
COPY .env.docker ./

# 安装依赖
RUN pnpm install

# 复制源代码（排除node_modules）
COPY . .

# 创建必要的目录
RUN mkdir -p cache

# 构建应用
RUN pnpm run build

# 暴露端口
EXPOSE 35000

# 切换到src目录
WORKDIR /app/dist

# 启动应用
CMD ["node", "app.js"] 