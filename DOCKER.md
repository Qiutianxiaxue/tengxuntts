# Docker 部署指南

本文档介绍如何将腾讯云TTS服务部署到Docker环境中。

## 📋 前置要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 腾讯云TTS服务的API密钥

## 🚀 快速开始

### 1. 配置环境变量

复制并编辑Docker环境变量文件：

```bash
cp .env.docker.example .env.docker
```

编辑 `.env.docker` 文件，填入您的腾讯云密钥：

```bash
TENCENT_SECRET_ID=your_secret_id_here
TENCENT_SECRET_KEY=your_secret_key_here
```

### 2. 一键部署

**Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```cmd
deploy.bat
```

**或者使用npm脚本:**
```bash
npm run docker:deploy
```

### 3. 验证部署

访问以下地址验证服务是否正常运行：

- 服务首页: http://localhost:35000
- 健康检查: http://localhost:35000/api/health
- API测试: http://localhost:35000/api/voices

## 📁 Docker 文件说明

### Dockerfile

```dockerfile
FROM node:18-alpine  # 使用轻量级Alpine Linux基础镜像
WORKDIR /app          # 设置工作目录
ENV NODE_ENV=production  # 设置生产环境
# ... 构建和运行配置
```

**特性:**
- ✅ 多阶段构建优化镜像大小
- ✅ 非root用户运行提高安全性  
- ✅ 内置健康检查
- ✅ 缓存目录持久化

### docker-compose.yml

服务编排配置，包含：
- 端口映射 (35000:35000)
- 环境变量配置
- 数据卷挂载
- 健康检查
- 重启策略

## 🛠️ 常用命令

### 构建和部署
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 重新构建并启动
docker-compose up -d --build

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

### 监控和调试
```bash
# 查看运行状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f tts-api

# 进入容器
docker-compose exec tts-api sh
```

### NPM 脚本快捷方式
```bash
npm run docker:build   # 构建镜像
npm run docker:up      # 启动服务
npm run docker:down    # 停止服务
npm run docker:logs    # 查看日志
npm run docker:deploy  # 重新部署
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| TENCENT_SECRET_ID | 腾讯云SecretId | - | ✅ |
| TENCENT_SECRET_KEY | 腾讯云SecretKey | - | ✅ |
| NODE_ENV | 运行环境 | production | ❌ |
| PORT | 服务端口 | 35000 | ❌ |
| CACHE_ENABLED | 是否启用缓存 | true | ❌ |
| CACHE_DIR | 缓存目录 | /app/cache | ❌ |
| DEFAULT_VOICE_TYPE | 默认音色 | 301030 | ❌ |
| DEFAULT_SAMPLE_RATE | 默认采样率 | 16000 | ❌ |
| DEFAULT_CODEC | 默认编码 | wav | ❌ |

### 数据卷

```yaml
volumes:
  tts-cache:  # 音频缓存持久化存储
    driver: local
```

缓存数据将持久化保存，即使容器重启也不会丢失。

### 网络

```yaml
networks:
  tts-network:  # 独立网络隔离
    driver: bridge
```

## 🔍 健康检查

容器内置健康检查机制：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:35000/api/health', ...)"
```

**检查策略:**
- 检查间隔: 30秒
- 超时时间: 3秒
- 启动等待: 5秒
- 重试次数: 3次

## 🏭 生产环境部署

### 1. 使用外部数据库（可选）

如需持久化更多数据，可以集成数据库：

```yaml
# docker-compose.prod.yml
services:
  tts-api:
    # ... 现有配置
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

### 2. 反向代理配置

使用Nginx作为反向代理：

```nginx
# nginx.conf
upstream tts_api {
    server 127.0.0.1:35000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://tts_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. 资源限制

在生产环境中设置资源限制：

```yaml
services:
  tts-api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '1.0'
          memory: 512M
    restart: unless-stopped
```

## 🛡️ 安全建议

### 1. 密钥管理
- 使用Docker Secrets或外部密钥管理系统
- 定期轮换API密钥
- 不要在镜像中硬编码密钥

### 2. 网络安全
- 使用防火墙限制端口访问
- 启用HTTPS（生产环境）
- 配置访问控制和速率限制

### 3. 容器安全
- 定期更新基础镜像
- 使用非root用户运行
- 扫描镜像安全漏洞

## 🔧 故障排除

### 常见问题

**1. 服务无法启动**
```bash
# 查看详细日志
docker-compose logs tts-api

# 检查端口占用
netstat -tulpn | grep :35000
```

**2. 权限问题**
```bash
# 检查缓存目录权限
ls -la cache/

# 重新设置权限
sudo chown -R 1001:1001 cache/
```

**3. 内存不足**
```bash
# 查看容器资源使用
docker stats

# 清理未使用的资源
docker system prune -a
```

**4. 网络连接问题**
```bash
# 测试容器内网络
docker-compose exec tts-api wget -qO- http://localhost:35000/api/health

# 检查防火墙设置
sudo ufw status
```

### 日志分析

```bash
# 查看最近100行日志
docker-compose logs --tail=100 tts-api

# 按时间过滤日志
docker-compose logs --since="2024-01-01T00:00:00" tts-api

# 保存日志到文件
docker-compose logs tts-api > tts-api.log
```

## 📊 性能监控

### 基础监控
```bash
# 查看容器资源使用
docker stats tts-api

# 查看缓存使用情况
curl http://localhost:35000/api/cache/info
```

### 高级监控（可选）

集成Prometheus和Grafana进行监控：

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:35000"
```

## 🔄 更新和维护

### 应用更新
```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建和部署
docker-compose up -d --build

# 3. 清理旧镜像
docker image prune -a
```

### 数据备份
```bash
# 备份缓存数据
docker run --rm -v tencent-tts-api_tts-cache:/data -v $(pwd):/backup alpine \
  tar czf /backup/cache-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### 定期维护
```bash
# 清理日志
docker-compose exec tts-api sh -c 'truncate -s 0 /var/log/*.log'

# 清理临时文件
docker system prune

# 更新基础镜像
docker-compose pull
docker-compose up -d
```

---

**需要帮助？** 如有问题请查看项目README或提交Issue。
