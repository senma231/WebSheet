<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    @closed="handleClosed"
  >
    <div class="confirm-content">
      <div v-if="icon || $slots.icon" class="confirm-icon">
        <slot name="icon">
          <el-icon v-if="icon === 'success'" class="confirm-icon-success"><CircleCheck /></el-icon>
          <el-icon v-else-if="icon === 'warning'" class="confirm-icon-warning"><Warning /></el-icon>
          <el-icon v-else-if="icon === 'error'" class="confirm-icon-error"><CircleClose /></el-icon>
          <el-icon v-else-if="icon === 'info'" class="confirm-icon-info"><InfoFilled /></el-icon>
          <el-icon v-else-if="icon === 'question'" class="confirm-icon-question"><QuestionFilled /></el-icon>
        </slot>
      </div>
      
      <div class="confirm-body">
        <div v-if="message" class="confirm-message" :class="{ 'confirm-message-center': center }">
          {{ message }}
        </div>
        
        <slot></slot>
      </div>
    </div>
    
    <template #footer>
      <div class="confirm-footer" :class="{ 'confirm-footer-center': center }">
        <slot name="footer">
          <el-button
            v-if="showCancelButton"
            :disabled="loading"
            @click="handleCancel"
          >
            {{ cancelButtonText }}
          </el-button>
          
          <el-button
            :type="confirmButtonType"
            :loading="loading"
            @click="handleConfirm"
          >
            {{ confirmButtonText }}
          </el-button>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import { CircleCheck, Warning, CircleClose, InfoFilled, QuestionFilled } from '@element-plus/icons-vue'

// 定义属性
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认'
  },
  message: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  confirmButtonText: {
    type: String,
    default: '确定'
  },
  cancelButtonText: {
    type: String,
    default: '取消'
  },
  confirmButtonType: {
    type: String,
    default: 'primary'
  },
  width: {
    type: String,
    default: '420px'
  },
  center: {
    type: Boolean,
    default: false
  },
  showCancelButton: {
    type: Boolean,
    default: true
  },
  closeOnClickModal: {
    type: Boolean,
    default: false
  },
  closeOnPressEscape: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'closed'])

// 状态
const dialogVisible = ref(props.modelValue)

// 监听属性变化
watch(() => props.modelValue, (newValue) => {
  dialogVisible.value = newValue
})

// 监听状态变化
watch(dialogVisible, (newValue) => {
  emit('update:modelValue', newValue)
})

// 方法
function handleConfirm() {
  emit('confirm')
  
  // 如果没有loading状态，自动关闭对话框
  if (!props.loading) {
    dialogVisible.value = false
  }
}

function handleCancel() {
  emit('cancel')
  dialogVisible.value = false
}

function handleClosed() {
  emit('closed')
}
</script>

<style scoped>
.confirm-content {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
}

.confirm-icon {
  font-size: 24px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-icon-success {
  color: var(--success-color);
}

.confirm-icon-warning {
  color: var(--warning-color);
}

.confirm-icon-error {
  color: var(--danger-color);
}

.confirm-icon-info {
  color: var(--info-color);
}

.confirm-icon-question {
  color: var(--primary-color);
}

.confirm-body {
  flex: 1;
}

.confirm-message {
  line-height: 1.5;
  margin-bottom: 0;
  font-size: 14px;
  color: var(--text-color-regular);
}

.confirm-message-center {
  text-align: center;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-footer-center {
  justify-content: center;
}
</style>
