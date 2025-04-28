<template>
  <div class="cursor-overlay">
    <div 
      v-for="user in visibleUsers" 
      :key="user.id" 
      :class="['remote-cursor', `cursor-${getColorClass(user.id)}`]"
      :style="getCursorStyle(user)"
    >
      <div class="cursor-caret"></div>
      <div class="cursor-label">{{ user.username }}</div>
      
      <div 
        v-if="user.cursor?.selection && user.cursor.selection.start !== user.cursor.selection.end"
        :class="['cursor-selection', `selection-${getColorClass(user.id)}`]"
        :style="getSelectionStyle(user)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'

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
  currentUserId: string
}>()

// 只显示有光标位置的用户，且不显示当前用户
const visibleUsers = computed(() => {
  return props.onlineUsers.filter(user => 
    user.id !== props.currentUserId && 
    user.cursor && 
    typeof user.cursor.x === 'number' && 
    typeof user.cursor.y === 'number'
  )
})

// 根据用户ID生成一个颜色类名
function getColorClass(userId: string): string {
  const colors = ['blue', 'green', 'orange', 'purple', 'pink']
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  return colors[hash % colors.length]
}

// 获取光标样式
function getCursorStyle(user: User): Record<string, string> {
  if (!user.cursor) return {}
  
  return {
    left: `${user.cursor.x}px`,
    top: `${user.cursor.y}px`
  }
}

// 获取选区样式
function getSelectionStyle(user: User): Record<string, string> {
  if (!user.cursor || !user.cursor.selection) return {}
  
  // 这里需要根据实际编辑器的DOM结构来计算选区的位置和大小
  // 这是一个简化的示例
  const selectionWidth = Math.abs(user.cursor.selection.end - user.cursor.selection.start) * 8 // 假设每个字符宽度为8px
  
  return {
    width: `${selectionWidth}px`,
    height: '20px' // 假设行高为20px
  }
}
</script>

<style scoped>
.cursor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.remote-cursor {
  position: absolute;
  pointer-events: none;
}

.cursor-caret {
  position: absolute;
  width: 2px;
  height: 20px;
  animation: blink 1s infinite;
}

.cursor-label {
  position: absolute;
  top: -20px;
  left: 0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  color: white;
}

.cursor-selection {
  position: absolute;
  opacity: 0.3;
}

/* 颜色定义 */
.cursor-blue .cursor-caret,
.cursor-blue .cursor-label {
  background-color: #409EFF;
}

.selection-blue {
  background-color: #409EFF;
}

.cursor-green .cursor-caret,
.cursor-green .cursor-label {
  background-color: #67C23A;
}

.selection-green {
  background-color: #67C23A;
}

.cursor-orange .cursor-caret,
.cursor-orange .cursor-label {
  background-color: #E6A23C;
}

.selection-orange {
  background-color: #E6A23C;
}

.cursor-purple .cursor-caret,
.cursor-purple .cursor-label {
  background-color: #909399;
}

.selection-purple {
  background-color: #909399;
}

.cursor-pink .cursor-caret,
.cursor-pink .cursor-label {
  background-color: #F56C6C;
}

.selection-pink {
  background-color: #F56C6C;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
