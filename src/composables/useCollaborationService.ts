import { ref, onUnmounted, onMounted, computed } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

interface User {
  id: string
  username: string
  avatar?: string
  initials: string
  status?: 'online' | 'idle' | 'editing'
  cursor?: {
    x: number
    y: number
    selection?: {
      start: number
      end: number
    }
  }
  lastActivity?: number
  color?: string
}

interface TextOperation {
  type: 'insert' | 'delete' | 'retain'
  position: number
  text?: string
  length?: number
}

interface Operation {
  id?: string
  type: string
  data: Record<string, any>
  version?: number
  timestamp?: number
  userId?: string
  operations?: TextOperation[]
}

interface Conflict {
  id: string
  operations: {
    local: Operation
    remote: Operation
  }
  resolved: boolean
  resolution?: 'local' | 'remote' | 'merge'
}

type OperationCallback = (operation: Operation, user: User) => void
type ConflictCallback = (conflict: Conflict) => void

export function useCollaborationService() {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const onlineUsers = ref<User[]>([])
  const documentId = ref<string | null>(null)
  const operationCallbacks: OperationCallback[] = []
  const conflictCallbacks: ConflictCallback[] = []
  const statusInterval = ref<number | null>(null)
  const IDLE_TIMEOUT = 60000 // 60秒无活动则标记为空闲
  const pendingOperations = ref<Operation[]>([])
  const conflicts = ref<Conflict[]>([])
  const documentVersion = ref<number>(0)
  const operationHistory = ref<Operation[]>([])
  const userColors = [
    '#f56c6c', '#e6a23c', '#409eff', '#67c23a', '#9c27b0',
    '#ff9800', '#03a9f4', '#607d8b', '#795548', '#009688'
  ]

  const authStore = useAuthStore()

  // 为用户分配颜色
  function assignUserColor(userId: string): string {
    const existingUser = onlineUsers.value.find(u => u.id === userId)
    if (existingUser && existingUser.color) {
      return existingUser.color
    }

    // 查找已使用的颜色
    const usedColors = onlineUsers.value
      .filter(u => u.color)
      .map(u => u.color as string)

    // 找到未使用的颜色
    const availableColors = userColors.filter(color => !usedColors.includes(color))

    // 如果有可用颜色，随机选择一个；否则随机选择一个已有颜色
    const color = availableColors.length > 0
      ? availableColors[Math.floor(Math.random() * availableColors.length)]
      : userColors[Math.floor(Math.random() * userColors.length)]

    return color
  }

  // 更新用户状态
  function updateUserStatuses() {
    const now = Date.now()
    onlineUsers.value.forEach(user => {
      if (user.lastActivity && now - user.lastActivity > IDLE_TIMEOUT && user.status === 'editing') {
        user.status = 'idle'
      }
    })
  }

  // 连接到协同编辑服务
  function connect(docId: string) {
    if (isConnected.value) {
      disconnect()
    }

    documentId.value = docId

    // 启动状态更新定时器
    if (statusInterval.value === null) {
      statusInterval.value = window.setInterval(updateUserStatuses, 10000) // 每10秒检查一次
    }

    const token = authStore.token
    if (!token) {
      console.error('No authentication token found')
      return
    }

    const wsUrl = import.meta.env.VITE_WS_URL

    socket.value = io(`${wsUrl}/documents/${docId}`, {
      auth: {
        token
      },
      transports: ['websocket']
    })

    // 连接事件
    socket.value.on('connect', () => {
      isConnected.value = true
      console.log('Connected to collaboration service')

      // 加入编辑会话
      socket.value?.emit('join', {
        document_id: docId,
        client_id: socket.value.id
      })
    })

    // 断开连接事件
    socket.value.on('disconnect', () => {
      isConnected.value = false
      console.log('Disconnected from collaboration service')
    })

    // 连接错误事件
    socket.value.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    // 用户加入事件
    socket.value.on('user_joined', (user: any) => {
      console.log('User joined:', user)

      // 添加到在线用户列表
      if (!onlineUsers.value.some(u => u.id === user.user_id)) {
        onlineUsers.value.push({
          id: user.user_id,
          username: user.username,
          avatar: user.avatar,
          initials: user.username.substring(0, 2).toUpperCase(),
          status: 'online',
          lastActivity: Date.now()
        })
      } else {
        // 更新用户状态
        const existingUser = onlineUsers.value.find(u => u.id === user.user_id)
        if (existingUser) {
          existingUser.status = 'online'
          existingUser.lastActivity = Date.now()
        }
      }
    })

    // 用户离开事件
    socket.value.on('user_left', (user: any) => {
      console.log('User left:', user)

      // 从在线用户列表中移除
      onlineUsers.value = onlineUsers.value.filter(u => u.id !== user.user_id)
    })

    // 操作广播事件
    socket.value.on('operation', (data: any) => {
      console.log('Received operation:', data)

      // 查找发送操作的用户
      const user = onlineUsers.value.find(u => u.id === data.user_id) || {
        id: data.user_id,
        username: 'Unknown',
        initials: 'UN',
        status: 'online',
        color: assignUserColor(data.user_id)
      }

      // 更新用户状态为编辑中
      if (user && onlineUsers.value.find(u => u.id === user.id)) {
        const existingUser = onlineUsers.value.find(u => u.id === user.id)
        if (existingUser) {
          existingUser.status = 'editing'
          existingUser.lastActivity = Date.now()
          if (!existingUser.color) {
            existingUser.color = assignUserColor(user.id)
          }
        }
      }

      // 构建远程操作对象
      const remoteOperation: Operation = {
        id: data.id,
        type: data.operation.type,
        data: data.operation.data,
        version: data.operation.version,
        timestamp: data.timestamp || Date.now(),
        userId: data.user_id,
        operations: data.operation.operations
      }

      // 添加到操作历史
      operationHistory.value.push(remoteOperation)

      // 检查是否有待处理的操作与此操作冲突
      const conflictingOps = pendingOperations.value.filter(op =>
        op.id !== remoteOperation.id && detectConflict(op, remoteOperation)
      )

      if (conflictingOps.length > 0) {
        // 处理冲突
        for (const localOp of conflictingOps) {
          const conflict: Conflict = {
            id: generateOperationId(),
            operations: {
              local: localOp,
              remote: remoteOperation
            },
            resolved: false
          }

          // 添加到冲突列表
          conflicts.value.push(conflict)

          // 通知冲突回调
          conflictCallbacks.forEach(callback => {
            callback(conflict)
          })

          // 从待处理操作中移除
          pendingOperations.value = pendingOperations.value.filter(op => op.id !== localOp.id)
        }
      } else {
        // 没有冲突，直接应用操作
        // 更新文档版本
        if (remoteOperation.version && remoteOperation.version > documentVersion.value) {
          documentVersion.value = remoteOperation.version
        }

        // 调用所有注册的回调
        operationCallbacks.forEach(callback => {
          callback(remoteOperation, user)
        })
      }
    })

    // 在线用户列表事件
    socket.value.on('online_users', (users: any) => {
      console.log('Online users:', users)

      onlineUsers.value = users.map((user: any) => ({
        id: user.user_id,
        username: user.username,
        avatar: user.avatar,
        initials: user.username.substring(0, 2).toUpperCase(),
        status: user.status || 'online',
        cursor: user.cursor,
        lastActivity: Date.now()
      }))
    })

    // 光标位置更新事件
    socket.value.on('cursor_update', (data: any) => {
      console.log('Cursor update:', data)

      // 查找用户并更新光标位置
      const user = onlineUsers.value.find(u => u.id === data.user_id)
      if (user) {
        user.cursor = data.cursor
        user.lastActivity = Date.now()
      }
    })
  }

  // 断开连接
  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }

    // 清除状态更新定时器
    if (statusInterval.value !== null) {
      window.clearInterval(statusInterval.value)
      statusInterval.value = null
    }

    isConnected.value = false
    documentId.value = null
    onlineUsers.value = []
  }

  // 操作转换 (OT) 功能
  function transformOperation(operation: Operation, against: Operation): Operation {
    // 如果不是文本操作，直接返回原操作
    if (operation.type !== 'text' || !operation.operations || !against.operations) {
      return operation
    }

    // 深拷贝操作以避免修改原始对象
    const transformedOp = JSON.parse(JSON.stringify(operation)) as Operation

    // 对每个文本操作进行转换
    transformedOp.operations = transformTextOperations(
      transformedOp.operations,
      against.operations
    )

    return transformedOp
  }

  // 转换文本操作
  function transformTextOperations(ops: TextOperation[], againstOps: TextOperation[]): TextOperation[] {
    const result: TextOperation[] = []

    // 对每个操作进行转换
    for (const op of ops) {
      let transformed = { ...op }

      for (const againstOp of againstOps) {
        // 根据操作类型进行不同的转换
        if (againstOp.type === 'insert' && againstOp.text) {
          // 如果在当前操作位置之前插入，需要调整位置
          if (againstOp.position <= transformed.position) {
            transformed.position += againstOp.text.length
          }
        } else if (againstOp.type === 'delete' && againstOp.length) {
          // 如果删除的内容在当前操作位置之前，需要调整位置
          if (againstOp.position < transformed.position) {
            const overlap = Math.min(
              againstOp.length,
              transformed.position - againstOp.position
            )
            transformed.position -= overlap
          }
        }
      }

      result.push(transformed)
    }

    return result
  }

  // 检测冲突
  function detectConflict(local: Operation, remote: Operation): boolean {
    // 如果不是同类型的操作，不视为冲突
    if (local.type !== remote.type) {
      return false
    }

    // 如果是文本操作，检查是否有重叠的修改区域
    if (local.type === 'text' && local.operations && remote.operations) {
      for (const localOp of local.operations) {
        for (const remoteOp of remote.operations) {
          // 如果两个操作修改了相同的区域，视为冲突
          if (
            (localOp.type === 'insert' || localOp.type === 'delete') &&
            (remoteOp.type === 'insert' || remoteOp.type === 'delete') &&
            Math.abs(localOp.position - remoteOp.position) < 5 // 临近位置视为冲突
          ) {
            return true
          }
        }
      }
    }

    // 对于其他类型的操作，如果修改了相同的数据字段，视为冲突
    if (local.data && remote.data) {
      for (const key in local.data) {
        if (remote.data[key] !== undefined && local.data[key] !== remote.data[key]) {
          return true
        }
      }
    }

    return false
  }

  // 解决冲突
  function resolveConflict(conflict: Conflict, resolution: 'local' | 'remote' | 'merge'): Operation {
    if (resolution === 'local') {
      return conflict.operations.local
    } else if (resolution === 'remote') {
      return conflict.operations.remote
    } else {
      // 合并操作
      return mergeOperations(conflict.operations.local, conflict.operations.remote)
    }
  }

  // 合并操作
  function mergeOperations(local: Operation, remote: Operation): Operation {
    // 如果是文本操作，使用操作转换
    if (local.type === 'text' && local.operations && remote.operations) {
      const merged: Operation = {
        type: 'text',
        data: { ...local.data },
        operations: []
      }

      // 先应用远程操作
      merged.operations = [...remote.operations]

      // 然后应用转换后的本地操作
      const transformedLocal = transformOperation(local, remote)
      if (transformedLocal.operations) {
        merged.operations = [...merged.operations, ...transformedLocal.operations]
      }

      return merged
    }

    // 对于其他类型的操作，合并数据字段
    return {
      type: local.type,
      data: { ...remote.data, ...local.data }
    }
  }

  // 发送操作
  function sendOperation(operation: Operation) {
    if (!isConnected.value || !socket.value) {
      console.error('Not connected to collaboration service')
      return
    }

    // 为操作添加元数据
    const enhancedOperation: Operation = {
      ...operation,
      id: generateOperationId(),
      timestamp: Date.now(),
      userId: authStore.user?.id,
      version: documentVersion.value
    }

    // 添加到待处理操作队列
    pendingOperations.value.push(enhancedOperation)

    // 添加到操作历史
    operationHistory.value.push(enhancedOperation)

    // 发送到服务器
    socket.value.emit('operation', {
      type: operation.type,
      data: operation.data,
      version: documentVersion.value,
      id: enhancedOperation.id
    })

    // 增加文档版本号
    documentVersion.value++
  }

  // 生成操作ID
  function generateOperationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 发送光标位置
  function sendCursorPosition(position: {
    x: number;
    y: number;
    selection?: {
      start: number;
      end: number
    }
  }) {
    if (!isConnected.value || !socket.value) {
      console.error('Not connected to collaboration service')
      return
    }

    socket.value.emit('cursor', {
      cursor: position
    })

    // 更新自己的状态为编辑中
    const authUser = authStore.user
    if (authUser) {
      const currentUser = onlineUsers.value.find(u => u.id === authUser.id)
      if (currentUser) {
        currentUser.status = 'editing'
        currentUser.cursor = position
        currentUser.lastActivity = Date.now()
      }
    }
  }

  // 注册操作回调
  function onOperationReceived(callback: OperationCallback) {
    operationCallbacks.push(callback)
  }

  // 注册冲突回调
  function onConflictDetected(callback: ConflictCallback) {
    conflictCallbacks.push(callback)
  }

  // 获取操作历史
  function getOperationHistory() {
    return operationHistory.value
  }

  // 获取当前冲突
  function getConflicts() {
    return conflicts.value
  }

  // 解决指定冲突
  function resolveConflictById(conflictId: string, resolution: 'local' | 'remote' | 'merge') {
    const conflict = conflicts.value.find(c => c.id === conflictId)
    if (!conflict) {
      console.error(`Conflict with id ${conflictId} not found`)
      return null
    }

    // 标记为已解决
    conflict.resolved = true
    conflict.resolution = resolution

    // 获取解决后的操作
    const resolvedOperation = resolveConflict(conflict, resolution)

    // 应用解决后的操作
    sendOperation(resolvedOperation)

    // 从冲突列表中移除
    conflicts.value = conflicts.value.filter(c => c.id !== conflictId)

    return resolvedOperation
  }

  // 组件卸载时断开连接
  onUnmounted(() => {
    disconnect()

    // 确保清除定时器
    if (statusInterval.value !== null) {
      window.clearInterval(statusInterval.value)
      statusInterval.value = null
    }
  })

  return {
    isConnected,
    onlineUsers,
    connect,
    disconnect,
    sendOperation,
    sendCursorPosition,
    onOperationReceived,
    onConflictDetected,
    getOperationHistory,
    getConflicts,
    resolveConflictById,
    pendingOperations,
    conflicts,
    documentVersion
  }
}
