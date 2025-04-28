import { ref, onUnmounted, onMounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

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
}

interface Operation {
  type: string
  data: Record<string, any>
  version?: number
}

type OperationCallback = (operation: Operation, user: User) => void

export function useCollaborationService() {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const onlineUsers = ref<User[]>([])
  const documentId = ref<string | null>(null)
  const operationCallbacks: OperationCallback[] = []
  const statusInterval = ref<number | null>(null)
  const IDLE_TIMEOUT = 60000 // 60秒无活动则标记为空闲

  const authStore = useAuthStore()

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
        status: 'online'
      }

      // 更新用户状态为编辑中
      if (user && onlineUsers.value.find(u => u.id === user.id)) {
        const existingUser = onlineUsers.value.find(u => u.id === user.id)
        if (existingUser) {
          existingUser.status = 'editing'
          existingUser.lastActivity = Date.now()
        }
      }

      // 调用所有注册的回调
      operationCallbacks.forEach(callback => {
        callback(data.operation, user)
      })
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

  // 发送操作
  function sendOperation(operation: Operation) {
    if (!isConnected.value || !socket.value) {
      console.error('Not connected to collaboration service')
      return
    }

    socket.value.emit('operation', {
      type: operation.type,
      data: operation.data,
      version: operation.version
    })
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
    onOperationReceived
  }
}
