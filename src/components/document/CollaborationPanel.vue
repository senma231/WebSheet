<template>
  <div class="collaboration-panel">
    <div class="panel-header">
      <h3>协作</h3>
      <el-button type="text" :icon="Close" @click="$emit('close')" />
    </div>

    <div class="panel-content">
      <collaborators-list
        :online-users="onlineUsers"
        @jump-to-cursor="handleJumpToCursor"
      />

      <div class="panel-section">
        <h4>协作状态</h4>
        <div class="connection-status">
          <div :class="['status-dot', isConnected ? 'connected' : 'disconnected']"></div>
          <span>{{ isConnected ? '已连接' : '未连接' }}</span>
        </div>
      </div>

      <div class="panel-section">
        <h4>冲突解决</h4>
        <p class="section-description">
          当多人同时编辑同一处内容时，系统会自动合并更改。
        </p>
        <div class="conflict-options">
          <el-radio-group v-model="conflictResolutionMode" size="small">
            <el-radio-button label="auto">自动合并</el-radio-button>
            <el-radio-button label="manual">手动确认</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div v-if="pendingConflicts.length > 0" class="panel-section">
        <h4>待处理冲突 ({{ pendingConflicts.length }})</h4>
        <div class="conflict-list">
          <div v-for="(conflict, index) in pendingConflicts" :key="index" class="conflict-item">
            <div class="conflict-info">
              <div class="conflict-user">{{ conflict.user.username }}</div>
              <div class="conflict-time">{{ formatTime(conflict.timestamp) }}</div>
            </div>
            <div class="conflict-actions">
              <el-button size="small" @click="resolveConflict(conflict, 'theirs')">接受他人</el-button>
              <el-button size="small" type="primary" @click="resolveConflict(conflict, 'mine')">保留我的</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import CollaboratorsList from './CollaboratorsList.vue'

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

interface Conflict {
  id: string
  user: User
  timestamp: number
  content: {
    mine: string
    theirs: string
  }
  position: {
    start: number
    end: number
  }
}

const props = defineProps<{
  onlineUsers: User[]
  isConnected: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'jump-to-cursor', user: User): void
  (e: 'resolve-conflict', conflict: Conflict, resolution: 'mine' | 'theirs'): void
  (e: 'change-conflict-mode', mode: 'auto' | 'manual'): void
}>()

// 冲突解决模式
const conflictResolutionMode = ref<'auto' | 'manual'>('auto')

// 模拟的待处理冲突
const pendingConflicts = ref<Conflict[]>([
  {
    id: '1',
    user: {
      id: '101',
      username: '张三',
      initials: 'ZS',
      status: 'editing'
    },
    timestamp: Date.now() - 60000,
    content: {
      mine: '这是我的内容',
      theirs: '这是他们的内容'
    },
    position: {
      start: 100,
      end: 120
    }
  }
])

function handleJumpToCursor(user: User) {
  emit('jump-to-cursor', user)
}

function resolveConflict(conflict: Conflict, resolution: 'mine' | 'theirs') {
  emit('resolve-conflict', conflict, resolution)
  // 从待处理列表中移除
  pendingConflicts.value = pendingConflicts.value.filter(c => c.id !== conflict.id)
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// 监听冲突解决模式变化
watch(conflictResolutionMode, (newMode) => {
  emit('change-conflict-mode', newMode)
})
</script>

<style scoped>
.collaboration-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-light);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

.panel-section {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.panel-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
}

.section-description {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.connected {
  background-color: var(--el-color-success);
}

.status-dot.disconnected {
  background-color: var(--el-color-danger);
}

.conflict-options {
  margin-top: 12px;
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conflict-item {
  padding: 12px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
}

.conflict-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.conflict-user {
  font-weight: 500;
}

.conflict-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.conflict-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
