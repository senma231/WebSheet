<template>
  <div class="collaborators-list">
    <div class="collaborators-header">
      <h3>协作者 ({{ onlineUsers.length }})</h3>
    </div>
    
    <div v-if="onlineUsers.length === 0" class="no-collaborators">
      <p>当前没有其他用户在线</p>
    </div>
    
    <div v-else class="collaborators-items">
      <div v-for="user in onlineUsers" :key="user.id" class="collaborator-item">
        <div class="collaborator-avatar">
          <el-avatar :size="32" :src="user.avatar">
            {{ user.initials }}
          </el-avatar>
          <div :class="['status-indicator', `status-${user.status || 'online'}`]" :title="getStatusText(user.status)"></div>
        </div>
        
        <div class="collaborator-info">
          <div class="collaborator-name">{{ user.username }}</div>
          <div class="collaborator-status">{{ getStatusText(user.status) }}</div>
        </div>
        
        <div class="collaborator-actions">
          <el-tooltip content="跳转到用户光标位置" placement="top" :disabled="!user.cursor">
            <el-button 
              size="small" 
              circle 
              :icon="Aim" 
              :disabled="!user.cursor"
              @click="jumpToCursor(user)"
            ></el-button>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { Aim } from '@element-plus/icons-vue'

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

const props = defineProps<{
  onlineUsers: User[]
}>()

const emit = defineEmits<{
  (e: 'jump-to-cursor', user: User): void
}>()

function getStatusText(status?: string): string {
  switch (status) {
    case 'online':
      return '在线'
    case 'idle':
      return '空闲'
    case 'editing':
      return '编辑中'
    default:
      return '在线'
  }
}

function jumpToCursor(user: User) {
  if (user.cursor) {
    emit('jump-to-cursor', user)
  }
}
</script>

<style scoped>
.collaborators-list {
  padding: 16px;
}

.collaborators-header {
  margin-bottom: 16px;
}

.collaborators-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.no-collaborators {
  color: var(--el-text-color-secondary);
  text-align: center;
  padding: 16px 0;
}

.collaborators-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collaborator-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
}

.collaborator-avatar {
  position: relative;
  margin-right: 12px;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--el-bg-color);
}

.status-online {
  background-color: var(--el-color-success);
}

.status-idle {
  background-color: var(--el-color-warning);
}

.status-editing {
  background-color: var(--el-color-primary);
}

.collaborator-info {
  flex: 1;
}

.collaborator-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.collaborator-status {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.collaborator-actions {
  display: flex;
  gap: 8px;
}
</style>
