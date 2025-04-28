<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="500px"
    @closed="handleClosed"
  >
    <div class="move-document-dialog">
      <p class="dialog-description">选择目标文件夹：</p>
      
      <folder-tree-select
        :current-folder-id="currentFolderId"
        :exclude-folder-id="excludeFolderId"
        @select="handleFolderSelect"
      />
      
      <div class="selected-folder">
        <p>已选择：<strong>{{ selectedFolderName || '根目录' }}</strong></p>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="isProcessing"
        @click="handleConfirm"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import FolderTreeSelect from './FolderTreeSelect.vue'
import { getFolder } from '@/api/document'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  documentId: {
    type: String,
    default: ''
  },
  folderId: {
    type: String,
    default: ''
  },
  currentFolderId: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'move', // 'move' 或 'copy'
    validator: (value: string) => ['move', 'copy'].includes(value)
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

// 状态
const dialogVisible = ref(props.visible)
const selectedFolderId = ref<string | null>(null)
const selectedFolderName = ref('')
const isProcessing = ref(false)

// 计算属性
const title = computed(() => props.mode === 'move' ? '移动文档' : '复制文档')
const excludeFolderId = computed(() => {
  // 如果是移动文件夹，需要排除自身及其子文件夹
  return props.mode === 'move' && props.folderId ? props.folderId : ''
})

// 监听props变化
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue
  if (newValue) {
    // 对话框打开时，重置选择的文件夹
    selectedFolderId.value = null
    selectedFolderName.value = ''
  }
})

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

// 方法
async function handleFolderSelect(folderId: string | null) {
  selectedFolderId.value = folderId
  
  if (folderId) {
    try {
      const response = await getFolder(folderId)
      selectedFolderName.value = response.data.name
    } catch (error) {
      console.error('Failed to get folder details', error)
      selectedFolderName.value = '未知文件夹'
    }
  } else {
    selectedFolderName.value = '根目录'
  }
}

function handleConfirm() {
  // 如果目标文件夹与当前文件夹相同，提示用户
  if (selectedFolderId.value === props.currentFolderId) {
    ElMessage.warning('目标文件夹与当前文件夹相同')
    return
  }
  
  isProcessing.value = true
  
  // 触发确认事件
  emit('confirm', {
    documentId: props.documentId,
    folderId: props.folderId,
    targetFolderId: selectedFolderId.value
  })
  
  // 模拟API调用延迟
  setTimeout(() => {
    isProcessing.value = false
    dialogVisible.value = false
  }, 500)
}

function handleClosed() {
  emit('cancel')
}
</script>

<style scoped>
.move-document-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-description {
  margin: 0;
  margin-bottom: 8px;
}

.selected-folder {
  margin-top: 8px;
}

.selected-folder p {
  margin: 0;
}
</style>
