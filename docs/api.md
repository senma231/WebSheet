# WebSheet API接口设计文档

## 1. API 设计规范

### 1.1 通用规范
- 基础路径: `/api/v1`
- 请求格式: `application/json`
- 认证方式: Bearer Token
- 时间格式: ISO 8601
- 分页参数: `page`、`size`

### 1.2 响应格式
```json
{
    "code": 200,
    "message": "success",
    "data": {},
    "timestamp": "2025-04-28T01:07:02.000Z"
}
```

### 1.3 错误码设计
- 200: 成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 409: 资源冲突
- 500: 服务器错误

## 2. 认证接口

### 2.1 管理员登录
```http
POST /api/v1/auth/login
Content-Type: application/json

Request:
{
    "username": "string",
    "password": "string"
}

Response:
{
    "code": 200,
    "data": {
        "token": "string",
        "expires_in": 3600,
        "user": {
            "id": "uuid",
            "username": "string",
            "email": "string",
            "is_admin": true
        }
    }
}
```

### 2.2 刷新令牌
```http
POST /api/v1/auth/refresh
Authorization: Bearer {token}

Response:
{
    "code": 200,
    "data": {
        "token": "string",
        "expires_in": 3600
    }
}
```

## 3. 用户管理接口

### 3.1 创建用户
```http
POST /api/v1/users
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
    "username": "string",
    "email": "string",
    "password": "string",
    "full_name": "string",
    "roles": ["uuid"]
}

Response:
{
    "code": 200,
    "data": {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "full_name": "string",
        "created_at": "datetime"
    }
}
```

### 3.2 查询用户列表
```http
GET /api/v1/users?page=1&size=20
Authorization: Bearer {token}

Response:
{
    "code": 200,
    "data": {
        "total": 100,
        "items": [{
            "id": "uuid",
            "username": "string",
            "email": "string",
            "full_name": "string",
            "is_active": true,
            "created_at": "datetime"
        }]
    }
}
```

## 4. 文档管理接口

### 4.1 创建文档
```http
POST /api/v1/documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
- file: File
- title: string
- description: string
- parent_folder_id: uuid (optional)

Response:
{
    "code": 200,
    "data": {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "type": "string",
        "size": 1024,
        "version": 1,
        "created_at": "datetime"
    }
}
```

### 4.2 获取文档信息
```http
GET /api/v1/documents/{id}
Authorization: Bearer {token}

Response:
{
    "code": 200,
    "data": {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "type": "string",
        "size": 1024,
        "version": 1,
        "created_at": "datetime",
        "updated_at": "datetime",
        "owner": {
            "id": "uuid",
            "username": "string"
        }
    }
}
```

### 4.3 更新文档
```http
PUT /api/v1/documents/{id}
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
    "title": "string",
    "description": "string"
}

Response:
{
    "code": 200,
    "data": {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "updated_at": "datetime"
    }
}
```

### 4.4 删除文档
```http
DELETE /api/v1/documents/{id}
Authorization: Bearer {token}

Response:
{
    "code": 200,
    "message": "Document deleted successfully"
}
```

## 5. 文档版本接口

### 5.1 创建新版本
```http
POST /api/v1/documents/{id}/versions
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
- file: File
- comment: string

Response:
{
    "code": 200,
    "data": {
        "id": "uuid",
        "version": 2,
        "size": 1024,
        "comment": "string",
        "created_at": "datetime"
    }
}
```

### 5.2 获取版本列表
```http
GET /api/v1/documents/{id}/versions
Authorization: Bearer {token}

Response:
{
    "code": 200,
    "data": {
        "total": 10,
        "items": [{
            "id": "uuid",
            "version": 2,
            "size": 1024,
            "comment": "string",
            "created_at": "datetime",
            "created_by": {
                "id": "uuid",
                "username": "string"
            }
        }]
    }
}
```

## 6. 文档共享接口

### 6.1 创建分享
```http
POST /api/v1/documents/{id}/share
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
    "permission_level": "READ",
    "expires_at": "datetime"
}

Response:
{
    "code": 200,
    "data": {
        "id": "uuid",
        "access_code": "string",
        "share_url": "string",
        "expires_at": "datetime"
    }
}
```

### 6.2 访问共享文档
```http
GET /api/v1/share/{access_code}

Response:
{
    "code": 200,
    "data": {
        "document": {
            "id": "uuid",
            "title": "string",
            "type": "string"
        },
        "permission_level": "READ"
    }
}
```

## 7. 协同编辑接口

### 7.1 WebSocket连接
```
WebSocket: /ws/documents/{id}
Protocol: socket.io
Authorization: Bearer {token}
```

### 7.2 事件定义
```javascript
// 客户端事件
{
    // 加入编辑会话
    "join": {
        "document_id": "uuid",
        "client_id": "string"
    },
    
    // 发送操作
    "operation": {
        "type": "string",
        "data": {},
        "version": 1
    },
    
    // 光标移动
    "cursor": {
        "position": {
            "x": 0,
            "y": 0
        }
    }
}

// 服务器事件
{
    // 用户加入
    "user_joined": {
        "user_id": "uuid",
        "username": "string"
    },
    
    // 用户离开
    "user_left": {
        "user_id": "uuid"
    },
    
    // 操作广播
    "operation": {
        "user_id": "uuid",
        "type": "string",
        "data": {},
        "version": 1
    },
    
    // 光标更新
    "cursor_update": {
        "user_id": "uuid",
        "position": {
            "x": 0,
            "y": 0
        }
    }
}
```

## 8. 存储接口

### 8.1 获取上传URL
```http
POST /api/v1/storage/upload
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
    "filename": "string",
    "content_type": "string",
    "size": 1024
}

Response:
{
    "code": 200,
    "data": {
        "upload_id": "string",
        "parts": [{
            "part_number": 1,
            "upload_url": "string"
        }]
    }
}
```

### 8.2 完成上传
```http
POST /api/v1/storage/upload/{upload_id}/complete
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
    "parts": [{
        "part_number": 1,
        "etag": "string"
    }]
}

Response:
{
    "code": 200,
    "data": {
        "storage_path": "string"
    }
}
```

## 9. 系统管理接口

### 9.1 系统状态
```http
GET /api/v1/system/status
Authorization: Bearer {token}

Response:
{
    "code": 200,
    "data": {
        "version": "string",
        "uptime": 3600,
        "total_users": 100,
        "total_documents": 1000,
        "storage_usage": 1024000
    }
}
```

### 9.2 系统配置
```http
GET /api/v1/system/config
Authorization: Bearer {token}

Response:
{
    "code": 200,
    "data": {
        "max_upload_size": 104857600,
        "allowed_file_types": ["docx", "xlsx", "pdf"],
        "max_versions": 20
    }
}
```

## 10. 安全考虑

### 10.1 接口安全
- 所有接口使用HTTPS
- 实现请求频率限制
- 实现IP黑名单
- 敏感数据加密传输

### 10.2 文件安全
- 文件上传类型验证
- 文件大小限制
- 文件内容扫描
- 存储加密

### 10.3 访问控制
- 基于角色的权限控制
- 操作审计日志
- 会话管理
- 密码策略