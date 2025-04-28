<template>
  <div class="share-document">
    <el-form :model="shareForm" label-position="top">
      <el-form-item label="分享类型">
        <el-radio-group v-model="shareForm.type">
          <el-radio label="link">链接分享</el-radio>
          <el-radio label="user">用户分享</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <template v-if="shareForm.type === 'link'">
        <el-form-item label="权限设置">
          <el-radio-group v-model="shareForm.permissionLevel">
            <el-radio label="READ">只读</el-radio>
            <el-radio label="WRITE">可编辑</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="shareForm.expiresAt"
            type="datetime"
            placeholder="选择过期时间（可选）"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="访问密码">
          <el-input
            v-model="shareForm.password"
            placeholder="设置访问密码（可选）"
            show-password
          />
        </el-form-item>
      </template>
      
      <template v-else>
        <el-form-item label="选择用户">
          <el-select
            v-model="shareForm.users"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="搜索用户"
            :remote-method="searchUsers"
            :loading="loading"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            >
              <div class="user-option">
                <el-avatar :size="24" :src="user.avatar_url">
                  {{ user.initials }}
                </el-avatar>
                <div class="user-info">
                  <div class="username">{{ user.username }}</div>
                  <div class="email">{{ user.email }}</div>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="权限设置">
          <el-radio-group v-model="shareForm.permissionLevel">
            <el-radio label="READ">只读</el-radio>
            <el-radio label="WRITE">可编辑</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="通知用户">
          <el-switch v-model="shareForm.notifyUsers" />
        </el-form-item>
        
        <el-form-item v-if="shareForm.notifyUsers" label="通知消息">
          <el-input
            v-model="shareForm.notifyMessage"
            type="textarea"
            :rows="3"
            placeholder="输入通知消息（可选）"
          />
        </el-form-item>
      </template>
    </el-form>
    
    <div v-if="shareForm.type === 'link' && shareLink" class="share-link-container">
      <h4>分享链接</h4>
      <el-input
        v-model="shareLink"
        readonly
      >
        <template #append>
          <el-button @click="copyShareLink">复制</el-button>
        </template>
      </el-input>
      
      <div class="share-qrcode">
        <div ref="qrcodeContainer" class="qrcode"></div>
        <el-button size="small" @click="downloadQRCode">下载二维码</el-button>
      </div>
    </div>
    
    <div v-if="shareForm.type === 'user' && sharedUsers.length > 0" class="shared-users-container">
      <h4>已分享用户</h4>
      <el-table :data="sharedUsers" style="width: 100%">
        <el-table-column label="用户" min-width="200">
          <template #default="scope">
            <div class="user-cell">
              <el-avatar :size="32" :src="scope.row.avatar_url">
                {{ scope.row.initials }}
              </el-avatar>
              <div class="user-info">
                <div class="username">{{ scope.row.username }}</div>
                <div class="email">{{ scope.row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="权限" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.permission_level === 'READ' ? 'info' : 'success'"
            >
              {{ scope.row.permission_level === 'READ' ? '只读' : '可编辑' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="分享时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              @click="removeSharedUser(scope.row)"
            >
              取消分享
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="share-actions">
      <el-button @click="resetForm">重置</el-button>
      <el-button type="primary" @click="shareDocument" :loading="sharing">
        {{ shareForm.type === 'link' ? (shareLink ? '更新分享' : '生成链接') : '分享' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineProps, defineEmits, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { shareDocument, getDocumentShares, removeDocumentShare } from '@/api/document'
import { formatDate as formatDateUtil } from '@/utils/date'
import QRCode from 'qrcode'

// 定义属性
const props = defineProps({
  documentId: {
    type: String,
    required: true
  },
  documentTitle: {
    type: String,
    required: true
  }
})

// 定义事件
const emit = defineEmits(['share-created', 'share-updated', 'share-removed'])

// 状态
const loading = ref(false)
const sharing = ref(false)
const shareLink = ref('')
const userOptions = ref<any[]>([])
const sharedUsers = ref<any[]>([])
const qrcodeContainer = ref<HTMLElement | null>(null)

// 表单数据
const shareForm = reactive({
  type: 'link',
  permissionLevel: 'READ' as 'READ' | 'WRITE',
  expiresAt: '',
  password: '',
  users: [] as string[],
  notifyUsers: true,
  notifyMessage: ''
})

// 监听分享链接变化，生成二维码
watch(shareLink, (newValue) => {
  if (newValue && qrcodeContainer.value) {
    generateQRCode(newValue)
  }
})

// 生命周期钩子
onMounted(() => {
  loadSharedUsers()
})

// 方法
async function loadSharedUsers() {
  loading.value = true
  
  try {
    // 这里应该调用API获取文档分享列表
    // const response = await getDocumentShares(props.documentId)
    // sharedUsers.value = response.data.items
    
    // 模拟数据
    sharedUsers.value = [
      {
        id: '1',
        user_id: '101',
        username: 'user1',
        email: 'user1@example.com',
        avatar_url: '',
        initials: 'U1',
        permission_level: 'READ',
        created_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '2',
        user_id: '102',
        username: 'user2',
        email: 'user2@example.com',
        avatar_url: '',
        initials: 'U2',
        permission_level: 'WRITE',
        created_at: '2023-01-02T00:00:00Z'
      }
    ]
  } catch (error) {
    console.error('Failed to load shared users', error)
    ElMessage.error('加载分享用户失败')
  } finally {
    loading.value = false
  }
}

async function searchUsers(query: string) {
  if (query.length < 2) return
  
  loading.value = true
  
  try {
    // 这里应该调用API搜索用户
    // const response = await searchUsers(query)
    // userOptions.value = response.data.items
    
    // 模拟数据
    userOptions.value = [
      {
        id: '101',
        username: 'user1',
        email: 'user1@example.com',
        avatar_url: '',
        initials: 'U1'
      },
      {
        id: '102',
        username: 'user2',
        email: 'user2@example.com',
        avatar_url: '',
        initials: 'U2'
      },
      {
        id: '103',
        username: 'user3',
        email: 'user3@example.com',
        avatar_url: '',
        initials: 'U3'
      }
    ].filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    )
  } catch (error) {
    console.error('Failed to search users', error)
    ElMessage.error('搜索用户失败')
  } finally {
    loading.value = false
  }
}

async function shareDocument() {
  sharing.value = true
  
  try {
    if (shareForm.type === 'link') {
      // 分享链接
      const response = await shareDocument(
        props.documentId,
        shareForm.permissionLevel,
        shareForm.expiresAt,
        shareForm.password
      )
      
      // 构建分享链接
      const baseUrl = window.location.origin
      shareLink.value = `${baseUrl}/share/${response.data.access_code}`
      
      if (shareForm.password) {
        shareLink.value += `?password=${encodeURIComponent(shareForm.password)}`
      }
      
      ElMessage.success('分享链接已生成')
      emit('share-created', response.data)
    } else {
      // 分享给用户
      if (shareForm.users.length === 0) {
        ElMessage.warning('请选择要分享的用户')
        sharing.value = false
        return
      }
      
      // 这里应该调用API分享给用户
      // const response = await shareDocumentWithUsers(
      //   props.documentId,
      //   shareForm.users,
      //   shareForm.permissionLevel,
      //   shareForm.notifyUsers ? shareForm.notifyMessage : undefined
      // )
      
      ElMessage.success(`已分享给 ${shareForm.users.length} 个用户`)
      
      // 重新加载分享用户列表
      await loadSharedUsers()
      
      // 重置用户选择
      shareForm.users = []
      
      emit('share-created', { users: shareForm.users })
    }
  } catch (error) {
    console.error('Failed to share document', error)
    ElMessage.error('分享失败')
  } finally {
    sharing.value = false
  }
}

function resetForm() {
  Object.assign(shareForm, {
    type: 'link',
    permissionLevel: 'READ',
    expiresAt: '',
    password: '',
    users: [],
    notifyUsers: true,
    notifyMessage: ''
  })
  
  shareLink.value = ''
}

function copyShareLink() {
  navigator.clipboard.writeText(shareLink.value)
    .then(() => {
      ElMessage.success('链接已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}

async function removeSharedUser(user: any) {
  try {
    // 这里应该调用API取消分享
    // await removeDocumentShare(props.documentId, user.id)
    
    // 从列表中移除
    sharedUsers.value = sharedUsers.value.filter(u => u.id !== user.id)
    
    ElMessage.success(`已取消与 ${user.username} 的分享`)
    
    emit('share-removed', user)
  } catch (error) {
    console.error('Failed to remove shared user', error)
    ElMessage.error('取消分享失败')
  }
}

function generateQRCode(url: string) {
  if (!qrcodeContainer.value) return
  
  // 清空容器
  qrcodeContainer.value.innerHTML = ''
  
  // 生成二维码
  QRCode.toCanvas(
    qrcodeContainer.value,
    url,
    {
      width: 200,
      margin: 2,
      color: {
        dark: '#409EFF',
        light: '#FFFFFF'
      }
    },
    (error) => {
      if (error) {
        console.error('Failed to generate QR code', error)
      }
    }
  )
}

function downloadQRCode() {
  const canvas = qrcodeContainer.value?.querySelector('canvas')
  if (!canvas) return
  
  // 创建下载链接
  const link = document.createElement('a')
  link.download = `${props.documentTitle}-分享二维码.png`
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function formatDate(dateString: string) {
  return formatDateUtil(dateString)
}
</script>

<style scoped>
.share-document {
  padding: 16px;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
}

.email {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.share-link-container {
  margin-top: 20px;
  padding: 16px;
  background-color: var(--background-color-base);
  border-radius: 4px;
}

.share-qrcode {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.qrcode {
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.shared-users-container {
  margin-top: 20px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.share-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
