# WebSheet 部署文档

## 1. 系统要求

### 1.1 硬件要求
- CPU: 8核心及以上
- 内存: 16GB及以上
- 存储: SSD，至少100GB可用空间
- 网络: 100Mbps及以上带宽

### 1.2 软件要求
- Docker Engine 24.0+
- Docker Compose 2.20+
- Node.js 18 LTS (开发环境)
- PostgreSQL 15+
- Redis 7+
- Nginx 1.24+

### 1.3 支持的操作系统
- Ubuntu 22.04 LTS
- CentOS 8 Stream
- Debian 11

## 2. 环境准备

### 2.1 安装Docker
```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh

# 启动Docker服务
systemctl enable docker
systemctl start docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2.2 配置系统参数
```bash
# 设置系统参数
cat >> /etc/sysctl.conf << EOF
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_tw_reuse = 1
vm.overcommit_memory = 1
EOF

sysctl -p
```

### 2.3 配置文件限制
```bash
# 设置文件描述符限制
cat >> /etc/security/limits.conf << EOF
*         soft    nofile      65535
*         hard    nofile      65535
EOF
```

## 3. 项目部署

### 3.1 目录结构
```
/opt/websheet/
├── docker-compose.yml
├── .env
├── nginx/
│   ├── conf.d/
│   └── nginx.conf
├── config/
│   ├── redis.conf
│   └── postgresql.conf
├── data/
│   ├── postgresql/
│   ├── redis/
│   └── storage/
└── logs/
    ├── nginx/
    ├── app/
    └── postgresql/
```

### 3.2 环境变量配置
```bash
# .env 文件内容
# 应用配置
APP_NAME=websheet
APP_ENV=production
APP_PORT=3000
APP_SECRET=your-secret-key

# 数据库配置
DB_HOST=postgres
DB_PORT=5432
DB_NAME=websheet
DB_USER=websheet
DB_PASSWORD=your-db-password

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# S3配置
S3_ENDPOINT=your-s3-endpoint
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# JWT配置
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
```

### 3.3 Docker Compose配置
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.24-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./logs/nginx:/var/log/nginx
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    depends_on:
      - app
    networks:
      - websheet-network

  app:
    image: websheet/app:latest
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs/app:/app/logs
    depends_on:
      - postgres
      - redis
    networks:
      - websheet-network

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/postgresql:/var/lib/postgresql/data
      - ./config/postgresql.conf:/etc/postgresql/postgresql.conf
    networks:
      - websheet-network

  redis:
    image: redis:7-alpine
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - ./data/redis:/data
      - ./config/redis.conf:/usr/local/etc/redis/redis.conf
    networks:
      - websheet-network

networks:
  websheet-network:
    driver: bridge
```

### 3.4 Nginx配置
```nginx
# nginx/conf.d/websheet.conf
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 4. 部署步骤

### 4.1 初始化部署
```bash
# 创建部署目录
mkdir -p /opt/websheet
cd /opt/websheet

# 创建必要的目录
mkdir -p nginx/conf.d config data/{postgresql,redis,storage} logs/{nginx,app,postgresql}

# 复制配置文件
cp /path/to/configs/* ./config/
cp /path/to/docker-compose.yml ./
cp /path/to/.env ./

# 启动服务
docker-compose up -d
```

### 4.2 数据库初始化
```bash
# 进入PostgreSQL容器
docker-compose exec postgres psql -U websheet

# 执行数据库初始化脚本
\i /path/to/init.sql
```

### 4.3 SSL证书配置
```bash
# 安装certbot
apt-get update
apt-get install certbot

# 获取SSL证书
certbot certonly --webroot -w /opt/websheet/data/certbot/www -d your-domain.com

# 配置SSL
# 修改nginx配置添加SSL支持
```

## 5. 运维管理

### 5.1 日常维护
```bash
# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [service_name]

# 重启服务
docker-compose restart [service_name]

# 更新服务
docker-compose pull
docker-compose up -d
```

### 5.2 数据备份
```bash
# 备份PostgreSQL数据
docker-compose exec postgres pg_dump -U websheet > backup.sql

# 备份Redis数据
docker-compose exec redis redis-cli SAVE

# 备份上传文件
tar -czf storage_backup.tar.gz /opt/websheet/data/storage
```

### 5.3 监控配置
```bash
# 安装Prometheus和Grafana
docker-compose -f monitoring-docker-compose.yml up -d

# 配置告警规则
# 在Grafana中导入监控面板
```

### 5.4 日志管理
```bash
# 配置日志轮转
cat > /etc/logrotate.d/websheet << EOF
/opt/websheet/logs/*/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    sharedscripts
    postrotate
        docker-compose kill -s USR1 nginx
    endscript
}
EOF
```

## 6. 故障处理

### 6.1 常见问题
1. 服务无法启动
   - 检查配置文件
   - 检查端口占用
   - 检查日志输出

2. 数据库连接失败
   - 检查数据库配置
   - 检查网络连接
   - 检查数据库日志

3. Redis连接失败
   - 检查Redis配置
   - 检查内存使用
   - 检查持久化状态

### 6.2 性能优化
1. 数据库优化
   - 定期VACUUM
   - 更新统计信息
   - 优化查询计划

2. Redis优化
   - 配置合适的内存策略
   - 监控内存使用
   - 优化持久化配置

3. 应用优化
   - 调整Node.js内存限制
   - 优化文件上传配置
   - 调整WebSocket连接参数

## 7. 扩展部署

### 7.1 负载均衡
```nginx
# nginx/conf.d/upstream.conf
upstream websheet {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://websheet;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.2 高可用配置
1. 数据库主从配置
2. Redis哨兵模式
3. 应用多实例部署
4. 容器编排管理

### 7.3 监控告警
1. 系统监控
   - CPU使用率
   - 内存使用
   - 磁盘使用
   - 网络流量

2. 应用监控
   - 响应时间
   - 错误率
   - 并发连接
   - 业务指标

3. 告警配置
   - 邮件通知
   - 短信通知
   - 钉钉/企业微信通知