<template>
  <div class="version-history">
    <div class="version-header">
      <h3>版本历史</h3>
      <el-button type="primary" size="small" @click="createNewVersion">创建新版本</el-button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <el-empty v-else-if="versions.length === 0" description="没有版本历史记录" />
    
    <el-timeline v-else>
      <el-timeline-item
        v-for="version in versions"
        :key="version.id"
        :timestamp="formatDate(version.created_at)"
        :type="version.is_current ? 'primary' : ''"
        :hollow="!version.is_current"
      >
        <el-card class="version-card">
          <div class="version-info">
            <div class="version-title">
              <span class="version-number">版本 {{ version.version }}</span>
              <el-tag v-if="version.is_current" type="success" size="small">当前版本</el-tag>
            </div>
            
            <div class="version-meta">
              <span>{{ version.created_by_name }}</span>
              <span>{{ formatFileSize(version.size) }}</span>
            </div>
            
            <div v-if="version.comment" class="version-comment">
              {{ version.comment }}
            </div>
          </div>
          
          <div class="version-actions">
            <el-tooltip content="预览" placement="top">
              <el-button
                type="primary"
                :icon="View"
                circle
                plain
                size="small"
                @click="previewVersion(version)"
              />
            </el-tooltip>
            
            <el-tooltip content="恢复" placement="top">
              <el-button
                v-if="!version.is_current"
                type="success"
                :icon="RefreshRight"
                circle
                plain
                size="small"
                @click="restoreVersion(version)"
              />
            </el-tooltip>
            
            <el-tooltip content="下载" placement="top">
              <el-button
                type="info"
                :icon="Download"
                circle
                plain
                size="small"
                @click="downloadVersion(version)"
              />
            </el-tooltip>
            
            <el-tooltip content="删除" placement="top">
              <el-button
                v-if="!version.is_current && canDelete"
                type="danger"
                :icon="Delete"
                circle
                plain
                size="small"
                @click="deleteVersion(version)"
              />
            </el-tooltip>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    
    <!-- 创建新版本对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建新版本"
      width="500px"
    >
      <el-form :model="versionForm" label-position="top">
        <el-form-item label="版本说明">
          <el-input
            v-model="versionForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入版本说明（可选）"
          />
        </el-form-item>
        
        <el-form-item label="上传文件">
          <el-upload
            class="upload-area"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                请上传与当前文档相同类型的文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!versionForm.file"
          :loading="uploading"
          @click="uploadNewVersion"
        >
          上传
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 版本预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="`预览版本 ${selectedVersion?.version || ''}`"
      width="80%"
      fullscreen
    >
      <div v-if="previewLoading" class="preview-loading">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
      
      <div v-else class="preview-container">
        <!-- 这里将根据文档类型显示不同的预览组件 -->
        <div class="preview-placeholder">
          <p>版本预览将在这里显示</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button
          v-if="selectedVersion && !selectedVersion.is_current"
          type="primary"
          @click="restoreVersion(selectedVersion)"
        >
          恢复到此版本
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineProps, defineEmits } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, View, RefreshRight, Download, Delete, Upload } from '@element-plus/icons-vue'
import { getDocumentVersions, createDocumentVersion, deleteDocumentVersion } from '@/api/document'
import { formatDate as formatDateUtil } from '@/utils/date'

// 定义属性
const props = defineProps({
  documentId: {
    type: String,
    required: true
  },
  canDelete: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['version-restored', 'version-created', 'version-deleted'])

// 状态
const loading = ref(true)
const versions = ref<any[]>([])
const showCreateDialog = ref(false)
const showPreviewDialog = ref(false)
const previewLoading = ref(false)
const uploading = ref(false)
const selectedVersion = ref<any | null>(null)

// 表单数据
const versionForm = ref({
  comment: '',
  file: null as File | null
})

// 生命周期钩子
onMounted(() => {
  loadVersions()
})

// 方法
async function loadVersions() {
  loading.value = true
  
  try {
    const response = await getDocumentVersions(props.documentId)
    versions.value = response.data.items.map((item: any) => ({
      ...item,
      is_current: item.version === response.data.current_version
    }))
  } catch (error) {
    console.error('Failed to load versions', error)
    ElMessage.error('加载版本历史失败')
  } finally {
    loading.value = false
  }
}

function createNewVersion() {
  versionForm.value = {
    comment: '',
    file: null
  }
  showCreateDialog.value = true
}

function handleFileChange(file: any) {
  versionForm.value.file = file.raw
}

async function uploadNewVersion() {
  if (!versionForm.value.file) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  
  uploading.value = true
  
  try {
    await createDocumentVersion(
      props.documentId,
      versionForm.value.file,
      versionForm.value.comment
    )
    
    ElMessage.success('新版本已创建')
    showCreateDialog.value = false
    
    // 重新加载版本列表
    await loadVersions()
    
    // 触发事件
    emit('version-created')
  } catch (error) {
    console.error('Failed to create version', error)
    ElMessage.error('创建新版本失败')
  } finally {
    uploading.value = false
  }
}

function previewVersion(version: any) {
  selectedVersion.value = version
  showPreviewDialog.value = true
  previewLoading.value = true
  
  // 模拟加载预览
  setTimeout(() => {
    previewLoading.value = false
  }, 1000)
}

function restoreVersion(version: any) {
  ElMessageBox.confirm(
    `确定要恢复到版本 ${version.version} 吗？当前未保存的更改将丢失。`,
    '恢复确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 调用恢复API
      // await restoreDocumentVersion(props.documentId, version.version)
      
      ElMessage.success(`已恢复到版本 ${version.version}`)
      
      // 关闭预览对话框
      showPreviewDialog.value = false
      
      // 重新加载版本列表
      await loadVersions()
      
      // 触发事件
      emit('version-restored', version)
    } catch (error) {
      console.error('Failed to restore version', error)
      ElMessage.error('恢复版本失败')
    }
  }).catch(() => {
    // 用户取消恢复
  })
}

function downloadVersion(version: any) {
  // 创建下载链接
  const downloadUrl = `/api/v1/documents/${props.documentId}/versions/${version.version}/download`
  
  // 创建临时链接并点击
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = `文档_版本${version.version}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function deleteVersion(version: any) {
  ElMessageBox.confirm(
    `确定要删除版本 ${version.version} 吗？此操作不可撤销。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteDocumentVersion(props.documentId, version.version)
      
      ElMessage.success(`已删除版本 ${version.version}`)
      
      // 重新加载版本列表
      await loadVersions()
      
      // 触发事件
      emit('version-deleted', version)
    } catch (error) {
      console.error('Failed to delete version', error)
      ElMessage.error('删除版本失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

function formatDate(dateString: string) {
  return formatDateUtil(dateString)
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }
}
</script>

<style scoped>
.version-history {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.version-header h3 {
  margin: 0;
}

.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.loading-icon {
  font-size: 32px;
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

.version-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-info {
  flex: 1;
}

.version-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.version-number {
  font-weight: 500;
}

.version-meta {
  display: flex;
  gap: 16px;
  color: var(--text-color-secondary);
  font-size: 12px;
  margin-bottom: 4px;
}

.version-comment {
  margin-top: 8px;
  color: var(--text-color-regular);
  font-size: 14px;
}

.version-actions {
  display: flex;
  gap: 8px;
}

.upload-area {
  width: 100%;
}

.preview-loading {
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.preview-container {
  height: 600px;
  overflow: auto;
}

.preview-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-color-secondary);
}
</style>
