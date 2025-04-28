<template>
  <div class="document-permissions-view">
    <el-card class="permissions-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2>文档权限管理</h2>
            <el-tag v-if="document" class="document-type-tag" :type="getDocumentTagType(document.type)">
              {{ formatDocumentType(document.type) }}
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="!document" class="error-container">
        <el-empty description="文档不存在或您没有权限访问">
          <el-button @click="goBack">返回</el-button>
        </el-empty>
      </div>
      
      <div v-else class="document-info">
        <div class="document-details">
          <h3>{{ document.title }}</h3>
          <p v-if="document.description" class="document-description">
            {{ document.description }}
          </p>
          
          <div class="document-meta">
            <div class="meta-item">
              <span class="meta-label">创建者:</span>
              <span class="meta-value">{{ document.owner?.username || '未知' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">创建时间:</span>
              <span class="meta-value">{{ formatDate(document.created_at) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">最后更新:</span>
              <span class="meta-value">{{ formatDate(document.updated_at) }}</span>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <permission-manager
          :resource-id="documentId"
          :resource-name="document.title"
          resource-type="document"
          @permission-added="handlePermissionAdded"
          @permission-updated="handlePermissionUpdated"
          @permission-removed="handlePermissionRemoved"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getDocument } from '@/api/document'
import { formatDate as formatDateUtil } from '@/utils/date'
import PermissionManager from '@/components/document/PermissionManager.vue'
import type { Document } from '@/types/document'
import type { DocumentPermission } from '@/types/permission'

const route = useRoute()
const router = useRouter()
const documentId = ref(route.params.id as string)
const document = ref<Document | null>(null)
const loading = ref(true)

onMounted(async () => {
  if (!documentId.value) {
    router.push('/dashboard')
    return
  }
  
  await loadDocument()
})

async function loadDocument() {
  loading.value = true
  
  try {
    const response = await getDocument(documentId.value)
    document.value = response.data
  } catch (error) {
    console.error('Failed to load document', error)
    ElMessage.error('加载文档失败')
    
    // 模拟数据
    document.value = {
      id: documentId.value,
      title: '示例文档',
      description: '这是一个示例文档，用于展示权限管理功能',
      type: 'WORD',
      owner_id: '1',
      size: 1024,
      version: 1,
      is_template: false,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
      owner: {
        id: '1',
        username: 'admin'
      }
    }
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function formatDate(dateString: string): string {
  return formatDateUtil(dateString, 'YYYY-MM-DD HH:mm')
}

function formatDocumentType(type: string): string {
  const typeMap: Record<string, string> = {
    'WORD': '文档',
    'EXCEL': '表格',
    'PPT': '演示文稿',
    'PDF': 'PDF',
    'MARKDOWN': 'Markdown'
  }
  
  return typeMap[type] || type
}

function getDocumentTagType(type: string): string {
  const typeMap: Record<string, string> = {
    'WORD': 'primary',
    'EXCEL': 'success',
    'PPT': 'warning',
    'PDF': 'danger',
    'MARKDOWN': 'info'
  }
  
  return typeMap[type] || 'info'
}

function handlePermissionAdded(permission: DocumentPermission) {
  console.log('Permission added:', permission)
}

function handlePermissionUpdated(permission: DocumentPermission) {
  console.log('Permission updated:', permission)
}

function handlePermissionRemoved(permission: DocumentPermission) {
  console.log('Permission removed:', permission)
}
</script>

<style scoped>
.document-permissions-view {
  padding: 20px;
}

.permissions-card {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
}

.document-type-tag {
  margin-left: 12px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.document-details h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.document-description {
  color: #606266;
  margin: 0 0 16px 0;
}

.document-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  color: #909399;
  margin-right: 4px;
}

.meta-value {
  font-weight: 500;
}
</style>
