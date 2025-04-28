<template>
  <div class="trash-container">
    <div class="trash-header">
      <div class="header-title">
        <h2>回收站</h2>
        <p class="header-description">已删除的文档将在30天后自动清除</p>
      </div>
      
      <div class="header-actions">
        <el-button-group>
          <el-button
            :icon="viewMode === 'grid' ? 'Menu' : 'Grid'"
            @click="toggleViewMode"
          />
          <el-button :icon="Sort" @click="showSortOptions = true" />
        </el-button-group>
        
        <el-button type="danger" @click="confirmEmptyTrash" :disabled="documents.length === 0">
          清空回收站
        </el-button>
      </div>
    </div>
    
    <div class="trash-content">
      <div v-if="isLoading" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
      
      <el-empty v-else-if="documents.length === 0" description="回收站为空" />
      
      <template v-else>
        <!-- 文档列表 -->
        <div class="documents-section">
          <div :class="['documents-list', viewMode === 'grid' ? 'grid-view' : 'list-view']">
            <div
              v-for="document in sortedDocuments"
              :key="document.id"
              class="document-item"
            >
              <div class="document-icon">
                <el-icon v-if="document.type === 'WORD'"><Document /></el-icon>
                <el-icon v-else-if="document.type === 'EXCEL'"><Grid /></el-icon>
                <el-icon v-else-if="document.type === 'PPT'"><PictureFilled /></el-icon>
                <el-icon v-else-if="document.type === 'PDF'"><Files /></el-icon>
                <el-icon v-else><Document /></el-icon>
              </div>
              
              <div class="document-info">
                <div class="document-title">{{ document.title }}</div>
                <div class="document-meta">
                  <el-tag size="small" :type="getDocumentTagType(document.type)">
                    {{ formatDocumentType(document.type) }}
                  </el-tag>
                  <span>删除于 {{ formatDate(document.deleted_at || document.updated_at) }}</span>
                </div>
              </div>
              
              <div class="document-actions">
                <el-button-group>
                  <el-button size="small" type="primary" @click="restoreDocument(document)">
                    恢复
                  </el-button>
                  <el-button size="small" type="danger" @click="confirmDeletePermanently(document)">
                    彻底删除
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <!-- 排序选项下拉菜单 -->
    <el-popover
      v-model:visible="showSortOptions"
      placement="bottom-end"
      :width="200"
      trigger="click"
    >
      <div class="sort-options">
        <p class="sort-title">排序方式</p>
        
        <el-radio-group v-model="sortBy" @change="showSortOptions = false">
          <el-radio label="name">名称</el-radio>
          <el-radio label="date">删除日期</el-radio>
        </el-radio-group>
        
        <div class="sort-order">
          <p>排序顺序</p>
          <el-radio-group v-model="sortOrder" @change="showSortOptions = false">
            <el-radio label="asc">升序</el-radio>
            <el-radio label="desc">降序</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <template #reference>
        <div></div>
      </template>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Menu, Grid, Sort, Loading, Document, PictureFilled, Files } from '@element-plus/icons-vue'
import type { Document as DocumentType } from '@/types/document'
import { getTrashDocuments, restoreDocument as restoreDocumentApi, permanentDeleteDocument, emptyTrash } from '@/api/document'
import { formatDate as formatDateUtil } from '@/utils/date'

// 状态
const isLoading = ref(true)
const documents = ref<DocumentType[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const showSortOptions = ref(false)
const sortBy = ref<'name' | 'date'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 计算属性
const sortedDocuments = computed(() => {
  let result = [...documents.value]
  
  // 排序
  result = result.sort((a, b) => {
    if (sortBy.value === 'name') {
      return sortOrder.value === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    } else {
      const dateA = new Date(a.deleted_at || a.updated_at).getTime()
      const dateB = new Date(b.deleted_at || b.updated_at).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    }
  })
  
  return result
})

// 生命周期钩子
onMounted(async () => {
  await loadData()
})

// 方法
async function loadData() {
  isLoading.value = true
  
  try {
    const response = await getTrashDocuments(1, 100)
    documents.value = response.data.items
  } catch (error) {
    console.error('Failed to load trash documents', error)
    ElMessage.error('加载回收站文档失败')
  } finally {
    isLoading.value = false
  }
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

function formatDate(dateString: string) {
  return formatDateUtil(dateString)
}

function formatDocumentType(type: string) {
  const typeMap: Record<string, string> = {
    'WORD': 'Word文档',
    'EXCEL': '表格',
    'PPT': '演示文稿',
    'PDF': 'PDF文档',
    'MARKDOWN': 'Markdown'
  }
  
  return typeMap[type] || type
}

function getDocumentTagType(type: string) {
  const typeMap: Record<string, string> = {
    'WORD': 'primary',
    'EXCEL': 'success',
    'PPT': 'warning',
    'PDF': 'danger',
    'MARKDOWN': 'info'
  }
  
  return typeMap[type] || 'info'
}

async function restoreDocument(document: DocumentType) {
  try {
    await restoreDocumentApi(document.id)
    ElMessage.success(`文档 "${document.title}" 已恢复`)
    await loadData()
  } catch (error) {
    console.error('Failed to restore document', error)
    ElMessage.error('恢复文档失败')
  }
}

function confirmDeletePermanently(document: DocumentType) {
  ElMessageBox.confirm(
    `确定要永久删除文档 "${document.title}" 吗？此操作无法撤销。`,
    '永久删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await permanentDeleteDocument(document.id)
      ElMessage.success(`文档 "${document.title}" 已永久删除`)
      await loadData()
    } catch (error) {
      console.error('Failed to permanently delete document', error)
      ElMessage.error('永久删除文档失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

function confirmEmptyTrash() {
  ElMessageBox.confirm(
    '确定要清空回收站吗？此操作将永久删除所有回收站中的文档，且无法撤销。',
    '清空回收站确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await emptyTrash()
      ElMessage.success('回收站已清空')
      await loadData()
    } catch (error) {
      console.error('Failed to empty trash', error)
      ElMessage.error('清空回收站失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}
</script>

<style scoped>
.trash-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.trash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  flex-direction: column;
}

.header-title h2 {
  margin: 0;
  margin-bottom: 4px;
}

.header-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.trash-content {
  flex: 1;
  overflow: auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.documents-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.documents-list.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.documents-list.list-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.documents-list.grid-view .document-item {
  flex-direction: column;
  align-items: flex-start;
}

.documents-list.list-view .document-item {
  flex-direction: row;
}

.document-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.document-icon {
  font-size: 24px;
  margin-right: 16px;
  color: #409eff;
}

.documents-list.grid-view .document-icon {
  margin-bottom: 16px;
  margin-right: 0;
}

.document-info {
  flex: 1;
  min-width: 0;
}

.document-title {
  font-weight: 500;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 12px;
  flex-wrap: wrap;
}

.documents-list.grid-view .document-actions {
  margin-top: 16px;
  align-self: flex-end;
}

.sort-options {
  padding: 8px;
}

.sort-title {
  margin-top: 0;
  margin-bottom: 8px;
  font-weight: 500;
}

.sort-order {
  margin-top: 16px;
}

.sort-order p {
  margin-top: 0;
  margin-bottom: 8px;
  font-weight: 500;
}
</style>
