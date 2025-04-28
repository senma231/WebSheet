# WebSheet 数据库设计文档

## 1. 数据库概述

### 1.1 数据库选型
- 主数据库：PostgreSQL 15+
- 缓存数据库：Redis 7+

### 1.2 设计原则
- 遵循第三范式（3NF）
- 使用UUID作为主键
- 统一字段命名规范
- 必要的索引优化
- 软删除设计

## 2. 数据库表设计

### 2.1 用户相关表

#### users（用户表）
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
```

#### roles（角色表）
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### user_roles（用户角色关联表）
```sql
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);
```

### 2.2 文档相关表

#### documents（文档表）
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- WORD, EXCEL, PPT, PDF, MARKDOWN
    owner_id UUID REFERENCES users(id),
    parent_folder_id UUID REFERENCES folders(id),
    size BIGINT NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    is_template BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_documents_owner ON documents(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_parent_folder ON documents(parent_folder_id) WHERE deleted_at IS NULL;
```

#### document_versions（文档版本表）
```sql
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    version INTEGER NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    comment TEXT
);

CREATE INDEX idx_document_versions_doc ON document_versions(document_id, version);
```

#### folders（文件夹表）
```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id),
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_folders_parent ON folders(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_folders_owner ON folders(owner_id) WHERE deleted_at IS NULL;
```

### 2.3 权限相关表

#### document_permissions（文档权限表）
```sql
CREATE TABLE document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    user_id UUID REFERENCES users(id),
    permission_level VARCHAR(20) NOT NULL, -- READ, WRITE, ADMIN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, user_id)
);

CREATE INDEX idx_document_permissions_doc ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_user ON document_permissions(user_id);
```

#### folder_permissions（文件夹权限表）
```sql
CREATE TABLE folder_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES folders(id),
    user_id UUID REFERENCES users(id),
    permission_level VARCHAR(20) NOT NULL, -- READ, WRITE, ADMIN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(folder_id, user_id)
);

CREATE INDEX idx_folder_permissions_folder ON folder_permissions(folder_id);
CREATE INDEX idx_folder_permissions_user ON folder_permissions(user_id);
```

### 2.4 分享相关表

#### shares（分享表）
```sql
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    created_by UUID REFERENCES users(id),
    access_code VARCHAR(20),
    permission_level VARCHAR(20) NOT NULL, -- READ, WRITE
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shares_document ON shares(document_id);
CREATE INDEX idx_shares_code ON shares(access_code) WHERE is_active = true;
```

### 2.5 协同编辑相关表

#### edit_sessions（编辑会话表）
```sql
CREATE TABLE edit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    user_id UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    client_id VARCHAR(50) NOT NULL
);

CREATE INDEX idx_edit_sessions_document ON edit_sessions(document_id);
CREATE INDEX idx_edit_sessions_active ON edit_sessions(document_id, user_id) 
    WHERE ended_at IS NULL;
```

#### operation_logs（操作日志表）
```sql
CREATE TABLE operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    user_id UUID REFERENCES users(id),
    operation_type VARCHAR(50) NOT NULL,
    operation_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operation_logs_document ON operation_logs(document_id);
CREATE INDEX idx_operation_logs_created ON operation_logs(created_at);
```

## 3. Redis 数据结构设计

### 3.1 会话管理
```
// 用户会话
key: session:{sessionId}
type: hash
fields:
    - userId
    - username
    - permissions
    - lastAccess
expire: 24h

// 用户令牌
key: token:{token}
type: string
value: sessionId
expire: 24h
```

### 3.2 文档协同编辑
```
// 文档编辑锁
key: doc:lock:{documentId}
type: string
value: userId
expire: 30s

// 文档在线用户
key: doc:online:{documentId}
type: set
members: [userId1, userId2, ...]

// 文档操作队列
key: doc:ops:{documentId}
type: list
value: [operation1, operation2, ...]
```

### 3.3 缓存设计
```
// 文档元数据缓存
key: doc:meta:{documentId}
type: hash
fields:
    - title
    - version
    - updatedAt
expire: 1h

// 用户权限缓存
key: user:perms:{userId}
type: hash
fields:
    - documentId: permissionLevel
expire: 1h
```

## 4. 数据库优化策略

### 4.1 索引优化
- 对频繁查询的字段建立索引
- 使用部分索引减少索引大小
- 定期维护索引统计信息
- 监控索引使用情况

### 4.2 分区策略
- 文档表按时间分区
- 操作日志表按时间分区
- 根据数据量增长情况调整分区策略

### 4.3 备份策略
- 每日全量备份
- 实时WAL日志备份
- 定期备份验证
- 多地备份存储

### 4.4 性能优化
- 使用连接池
- 配置适当的工作内存
- 定期VACUUM
- 使用适当的存储引擎

## 5. 数据迁移策略

### 5.1 版本控制
- 使用Flyway进行数据库版本控制
- 所有迁移脚本版本化管理
- 支持回滚操作

### 5.2 迁移流程
1. 开发环境验证
2. 测试环境验证
3. 预发布环境验证
4. 生产环境执行

### 5.3 数据校验
- 迁移前后数据一致性校验
- 性能影响评估
- 回滚计划准备