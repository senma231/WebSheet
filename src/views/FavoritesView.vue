<template>
  <div class="favorites-container">
    <div class="favorites-header">
      <div class="header-title">
        <h2>我的收藏</h2>
      </div>
      
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索收藏"
          prefix-icon="Search"
          clearable
          @clear="handleSearch"
          @input="handleSearch"
        />
        
        <el-button-group>
          <el-button
            :icon="viewMode === 'grid' ? 'Menu' : 'Grid'"
            @click="toggleViewMode"
          />
          <el-button :icon="Sort" @click="showSortOptions = true" />
        </el-button-group>
      </div>
    </div>
    
    <div class="favorites-content">
      <div v-if="isLoading" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
      
      <el-empty v-else-if="filteredDocuments.length === 0" description="没有收藏的文档" />
      
      <template v-else>
        <!-- 文档列表 -->
        <div class="documents-section">
          <div :class="['documents-list', viewMode === 'grid' ? 'grid-view' : 'list-view']">
            <div
              v-for="document in filteredDocuments"
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
                  <span>{{ formatDate(document.updated_at) }}</span>
                  <span>{{ formatFileSize(document.size) }}</span>
                </div>
                
                <div v-if="document.tags && document.tags.length > 0" class="document-tags">
                  <el-tag
                    v-for="tag in document.tags"
                    :key="tag"
                    size="small"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
              
              <div class="document-actions">
                <el-button-group>
                  <el-button size="small" @click="openDocument(document.id)">打开</el-button>
                  <el-button size="small" type="danger" @click="removeFromFavorites(document)">
                    取消收藏
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
          <el-radio label="date">修改日期</el-radio>
          <el-radio label="type">类型</el-radio>
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Menu, Grid, Sort, Loading, Document, PictureFilled, Files } from '@element-plus/icons-vue'
import type { Document as DocumentType } from '@/types/document'
import { getFavoriteDocuments, removeFromFavorites as removeFavorite } from '@/api/search'
import { formatDate as formatDateUtil } from '@/utils/date'

const router = useRouter()

// 状态
const isLoading = ref(true)
const documents = ref<DocumentType[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')
const showSortOptions = ref(false)
const sortBy = ref<'name' | 'date' | 'type'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 计算属性
const filteredDocuments = computed(() => {
  let result = documents.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(doc => 
      doc.title.toLowerCase().includes(query) || 
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }
  
  // 排序
  result = [...result].sort((a, b) => {
    if (sortBy.value === 'name') {
      return sortOrder.value === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    } else if (sortBy.value === 'type') {
      return sortOrder.value === 'asc'
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type)
    } else {
      const dateA = new Date(a.updated_at).getTime()
      const dateB = new Date(b.updated_at).getTime()
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
    const response = await getFavoriteDocuments(1, 100)
    documents.value = response.data.items
  } catch (error) {
    console.error('Failed to load favorite documents', error)
    ElMessage.error('加载收藏文档失败')
  } finally {
    isLoading.value = false
  }
}

function handleSearch() {
  // 搜索逻辑已通过计算属性实现
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

function openDocument(documentId: string) {
  router.push(`/dashboard/document/${documentId}`)
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

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }
}

async function removeFromFavorites(document: DocumentType) {
  ElMessageBox.confirm(
    `确定要取消收藏 "${document.title}" 吗？`,
    '取消收藏',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await removeFavorite(document.id)
      ElMessage.success('已从收藏中移除')
      
      // 从列表中移除
      documents.value = documents.value.filter(doc => doc.id !== document.id)
    } catch (error) {
      console.error('Failed to remove from favorites', error)
      ElMessage.error('操作失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}
</script>

<style scoped>
.favorites-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.favorites-content {
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  margin-bottom: 8px;
}

.document-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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
