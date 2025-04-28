<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <el-icon v-if="icon"><component :is="icon" /></el-icon>
        <img v-else-if="image" :src="image" :alt="title" class="empty-image" />
      </slot>
    </div>
    
    <h3 class="empty-title">{{ title }}</h3>
    
    <p v-if="description" class="empty-description">{{ description }}</p>
    
    <div v-if="$slots.default" class="empty-actions">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

// 定义属性
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: var(--text-color-secondary);
  margin-bottom: 16px;
}

.empty-image {
  max-width: 200px;
  max-height: 200px;
}

.empty-title {
  font-size: 18px;
  color: var(--text-color-primary);
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin: 0 0 24px 0;
  max-width: 400px;
}

.empty-actions {
  display: flex;
  gap: 8px;
}
</style>
