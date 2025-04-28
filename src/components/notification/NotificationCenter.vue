<template>
  <div class="notification-center">
    <el-popover
      placement="bottom-end"
      :width="400"
      trigger="click"
      popper-class="notification-popover"
    >
      <template #reference>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
          <el-button :icon="Bell" circle />
        </el-badge>
      </template>
      
      <div class="notification-header">
        <h3>通知</h3>
        <div class="notification-actions">
          <el-button
            v-if="unreadCount > 0"
            type="text"
            size="small"
            @click="markAllAsRead"
          >
            全部标为已读
          </el-button>
          <el-button
            type="text"
            size="small"
            @click="goToAllNotifications"
          >
            查看全部
          </el-button>
        </div>
      </div>
      
      <el-tabs v-model="activeTab" class="notification-tabs">
        <el-tab-pane label="全部" name="all">
          <div v-if="loading" class="notification-loading">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>加载中...</p>
          </div>
          
          <el-empty v-else-if="notifications.length === 0" description="没有通知" />
          
          <div v-else class="notification-list">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              :class="['notification-item', { unread: !notification.read }]"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon">
                <el-icon v-if="notification.type === 'document_share'"><Share /></el-icon>
                <el-icon v-else-if="notification.type === 'document_edit'"><Edit /></el-icon>
                <el-icon v-else-if="notification.type === 'comment'"><ChatDotRound /></el-icon>
                <el-icon v-else><Bell /></el-icon>
              </div>
              
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
              </div>
              
              <div class="notification-actions">
                <el-button
                  v-if="!notification.read"
                  type="text"
                  size="small"
                  @click.stop="markAsRead(notification)"
                >
                  标为已读
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="未读" name="unread">
          <div v-if="loading" class="notification-loading">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>加载中...</p>
          </div>
          
          <el-empty v-else-if="unreadNotifications.length === 0" description="没有未读通知" />
          
          <div v-else class="notification-list">
            <div
              v-for="notification in unreadNotifications"
              :key="notification.id"
              class="notification-item unread"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon">
                <el-icon v-if="notification.type === 'document_share'"><Share /></el-icon>
                <el-icon v-else-if="notification.type === 'document_edit'"><Edit /></el-icon>
                <el-icon v-else-if="notification.type === 'comment'"><ChatDotRound /></el-icon>
                <el-icon v-else><Bell /></el-icon>
              </div>
              
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
              </div>
              
              <div class="notification-actions">
                <el-button
                  type="text"
                  size="small"
                  @click.stop="markAsRead(notification)"
                >
                  标为已读
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Bell, Share, Edit, ChatDotRound, Loading } from '@element-plus/icons-vue'
import { formatRelativeTime } from '@/utils/date'

// 定义通知类型
interface Notification {
  id: string
  type: 'document_share' | 'document_edit' | 'comment' | 'system'
  title: string
  message: string
  read: boolean
  created_at: string
  data?: Record<string, any>
}

const router = useRouter()

// 状态
const loading = ref(true)
const activeTab = ref('all')
const notifications = ref<Notification[]>([])
const pollingInterval = ref<number | null>(null)

// 计算属性
const unreadNotifications = computed(() => {
  return notifications.value.filter(notification => !notification.read)
})

const unreadCount = computed(() => {
  return unreadNotifications.value.length
})

// 生命周期钩子
onMounted(() => {
  loadNotifications()
  
  // 设置轮询，每分钟检查一次新通知
  pollingInterval.value = window.setInterval(() => {
    loadNotifications(true)
  }, 60000)
})

onBeforeUnmount(() => {
  // 清除轮询
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
})

// 方法
async function loadNotifications(silent = false) {
  if (!silent) {
    loading.value = true
  }
  
  try {
    // 这里应该调用API获取通知列表
    // const response = await getNotifications()
    // notifications.value = response.data
    
    // 模拟数据
    notifications.value = [
      {
        id: '1',
        type: 'document_share',
        title: '文档分享',
        message: '用户 user1 与您分享了文档 "项目计划"',
        read: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        data: {
          document_id: '123',
          share_id: '456'
        }
      },
      {
        id: '2',
        type: 'document_edit',
        title: '文档编辑',
        message: '用户 user2 编辑了您的文档 "会议记录"',
        read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        data: {
          document_id: '789'
        }
      },
      {
        id: '3',
        type: 'comment',
        title: '新评论',
        message: '用户 user3 在文档 "产品规划" 中添加了评论',
        read: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        data: {
          document_id: '101',
          comment_id: '202'
        }
      },
      {
        id: '4',
        type: 'system',
        title: '系统通知',
        message: '系统将于今晚22:00-23:00进行维护，请提前保存您的工作',
        read: true,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  } catch (error) {
    console.error('Failed to load notifications', error)
    if (!silent) {
      ElMessage.error('加载通知失败')
    }
  } finally {
    loading.value = false
  }
}

async function markAsRead(notification: Notification) {
  try {
    // 这里应该调用API标记通知为已读
    // await markNotificationAsRead(notification.id)
    
    // 更新本地数据
    notification.read = true
    
    ElMessage.success('已标记为已读')
  } catch (error) {
    console.error('Failed to mark notification as read', error)
    ElMessage.error('标记已读失败')
  }
}

async function markAllAsRead() {
  try {
    // 这里应该调用API标记所有通知为已读
    // await markAllNotificationsAsRead()
    
    // 更新本地数据
    notifications.value.forEach(notification => {
      notification.read = true
    })
    
    ElMessage.success('已全部标为已读')
  } catch (error) {
    console.error('Failed to mark all notifications as read', error)
    ElMessage.error('标记全部已读失败')
  }
}

function handleNotificationClick(notification: Notification) {
  // 标记为已读
  if (!notification.read) {
    markAsRead(notification)
  }
  
  // 根据通知类型执行不同操作
  switch (notification.type) {
    case 'document_share':
      if (notification.data?.document_id) {
        router.push(`/dashboard/document/${notification.data.document_id}`)
      }
      break
      
    case 'document_edit':
      if (notification.data?.document_id) {
        router.push(`/dashboard/document/${notification.data.document_id}`)
      }
      break
      
    case 'comment':
      if (notification.data?.document_id) {
        router.push(`/dashboard/document/${notification.data.document_id}?comment=${notification.data.comment_id}`)
      }
      break
      
    case 'system':
      // 系统通知不需要特殊处理
      break
  }
}

function goToAllNotifications() {
  router.push('/dashboard/notifications')
}

function formatTime(dateString: string) {
  return formatRelativeTime(dateString)
}
</script>

<style>
/* 全局样式，确保弹出框样式正确 */
.notification-popover {
  padding: 0 !important;
  max-height: 500px;
}
</style>

<style scoped>
.notification-badge {
  margin-right: 16px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color-light);
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-tabs {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.notification-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.notification-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-icon {
  font-size: 24px;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color-lighter);
  cursor: pointer;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: var(--background-color-base);
}

.notification-item.unread {
  background-color: rgba(64, 158, 255, 0.1);
}

.notification-item.unread:hover {
  background-color: rgba(64, 158, 255, 0.15);
}

.notification-icon {
  margin-right: 12px;
  font-size: 20px;
  color: var(--primary-color);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.notification-message {
  color: var(--text-color-regular);
  font-size: 14px;
  margin-bottom: 4px;
  word-break: break-word;
}

.notification-time {
  color: var(--text-color-secondary);
  font-size: 12px;
}

.notification-actions {
  display: flex;
  align-items: center;
}
</style>
