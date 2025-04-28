<template>
  <div class="conflict-resolver">
    <div class="conflict-header">
      <el-alert
        title="检测到编辑冲突"
        type="warning"
        description="您和其他用户同时编辑了相同的内容。请选择如何解决此冲突。"
        show-icon
        :closable="false"
      />
    </div>
    
    <div class="conflict-content">
      <div class="conflict-options">
        <el-radio-group v-model="resolution" size="large">
          <el-radio label="local">
            <div class="resolution-option">
              <div class="option-title">使用我的更改</div>
              <div class="option-description">保留您的更改，丢弃其他用户的更改</div>
            </div>
          </el-radio>
          
          <el-radio label="remote">
            <div class="resolution-option">
              <div class="option-title">使用其他用户的更改</div>
              <div class="option-description">丢弃您的更改，使用其他用户的更改</div>
            </div>
          </el-radio>
          
          <el-radio label="merge">
            <div class="resolution-option">
              <div class="option-title">合并更改</div>
              <div class="option-description">尝试智能合并双方的更改</div>
            </div>
          </el-radio>
        </el-radio-group>
      </div>
      
      <div class="conflict-preview">
        <div class="preview-header">
          <div class="preview-title">冲突预览</div>
        </div>
        
        <div class="preview-content">
          <div class="preview-section">
            <div class="section-header">
              <div class="section-title">您的更改</div>
              <div class="user-info">
                <el-avatar :size="24" :src="currentUser?.avatar">
                  {{ currentUser?.initials || 'YO' }}
                </el-avatar>
                <span>{{ currentUser?.username || '您' }}</span>
              </div>
            </div>
            
            <div class="section-content local-content">
              <pre>{{ getLocalContent() }}</pre>
            </div>
          </div>
          
          <div class="preview-divider">
            <el-divider>
              <el-icon><ArrowDown /></el-icon>
            </el-divider>
          </div>
          
          <div class="preview-section">
            <div class="section-header">
              <div class="section-title">其他用户的更改</div>
              <div class="user-info">
                <el-avatar :size="24" :src="remoteUser?.avatar" :style="{ backgroundColor: remoteUser?.color }">
                  {{ remoteUser?.initials || 'TH' }}
                </el-avatar>
                <span>{{ remoteUser?.username || '其他用户' }}</span>
              </div>
            </div>
            
            <div class="section-content remote-content">
              <pre>{{ getRemoteContent() }}</pre>
            </div>
          </div>
          
          <div v-if="resolution === 'merge'" class="preview-section">
            <div class="section-header">
              <div class="section-title">合并结果</div>
            </div>
            
            <div class="section-content merged-content">
              <pre>{{ getMergedContent() }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="conflict-actions">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="resolve" :loading="resolving">
        解决冲突
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  conflict: {
    type: Object,
    required: true
  },
  users: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['resolve', 'cancel'])

// 状态
const resolution = ref<'local' | 'remote' | 'merge'>('merge')
const resolving = ref(false)
const authStore = useAuthStore()

// 计算属性
const currentUser = computed(() => {
  return {
    id: authStore.user?.id,
    username: authStore.user?.username || '您',
    avatar: authStore.user?.avatar_url,
    initials: authStore.user?.username?.substring(0, 2).toUpperCase() || 'YO'
  }
})

const remoteUser = computed(() => {
  const userId = props.conflict.operations.remote.userId
  const user = props.users.find((u: any) => u.id === userId)
  
  return user || {
    id: userId,
    username: '其他用户',
    initials: 'TH'
  }
})

// 方法
function getLocalContent() {
  if (props.conflict.operations.local.type === 'text' && props.conflict.operations.local.operations) {
    // 文本操作
    return formatTextOperations(props.conflict.operations.local.operations)
  } else {
    // 其他类型操作
    return JSON.stringify(props.conflict.operations.local.data, null, 2)
  }
}

function getRemoteContent() {
  if (props.conflict.operations.remote.type === 'text' && props.conflict.operations.remote.operations) {
    // 文本操作
    return formatTextOperations(props.conflict.operations.remote.operations)
  } else {
    // 其他类型操作
    return JSON.stringify(props.conflict.operations.remote.data, null, 2)
  }
}

function getMergedContent() {
  // 这里应该根据实际情况生成合并后的内容预览
  // 简单示例：
  return '合并后的内容将在这里显示'
}

function formatTextOperations(operations: any[]) {
  // 简化的文本操作格式化
  return operations.map(op => {
    if (op.type === 'insert' && op.text) {
      return `插入 "${op.text}" 在位置 ${op.position}`
    } else if (op.type === 'delete' && op.length) {
      return `删除 ${op.length} 个字符，从位置 ${op.position}`
    } else if (op.type === 'retain' && op.length) {
      return `保留 ${op.length} 个字符，从位置 ${op.position}`
    }
    return JSON.stringify(op)
  }).join('\n')
}

function resolve() {
  resolving.value = true
  
  try {
    emit('resolve', {
      conflictId: props.conflict.id,
      resolution: resolution.value
    })
  } catch (error) {
    console.error('Failed to resolve conflict', error)
    ElMessage.error('解决冲突失败')
    resolving.value = false
  }
}

function cancel() {
  emit('cancel')
}
</script>

<style scoped>
.conflict-resolver {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.conflict-header {
  margin-bottom: 16px;
}

.conflict-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
}

.conflict-options {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.resolution-option {
  padding: 8px 0;
}

.option-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.option-description {
  font-size: 12px;
  color: #909399;
}

.conflict-preview {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.preview-header {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.preview-title {
  font-weight: 500;
}

.preview-content {
  padding: 16px;
}

.preview-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.section-content {
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  overflow: auto;
  max-height: 200px;
}

.section-content pre {
  margin: 0;
}

.local-content {
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
}

.remote-content {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.merged-content {
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
}

.preview-divider {
  margin: 16px 0;
}

.conflict-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}
</style>
