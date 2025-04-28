<template>
  <div class="recent-container">
    <div class="recent-header">
      <div class="header-title">
        <h2>最近访问</h2>
      </div>
      
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索最近文档"
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
    
    <div class="recent-content">
      <div v-if="isLoading" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
      
      <el-empty v-else-if="filteredDocuments.length === 0" description="没有最近访问的文档" />
      
      <template v-else>
        <!-- 今天访问的文档 -->
        <div v-if="todayDocuments.length > 0" class="time-section">
          <h3>今天</h3>
          
          <div :class="['documents-list', viewMode === 'grid' ? 'grid-view' : 'list-view']">
            <div
              v-for="document in todayDocuments"
              :key="document.id"
              class="document-item"
              @click="openDocument(document.id)"
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
                  <span>{{ formatTime(document.last_accessed_at || document.updated_at) }}</span>
                </div>
              </div>
              
              <div class="document-actions">
                <el-button
                  circle
                  size="small"
                  :icon="document.is_favorite ? 'StarFilled' : 'Star'"
                  @click.stop="toggleFavorite(document)"
                  :class="{ 'is-favorite': document.is_favorite }"
                />
                
                <el-dropdown trigger="click" @command="(command) => handleCommand(command, document)">
                  <el-button circle size="small" :icon="MoreFilled" />
                  
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="open">打开</el-dropdown-item>
                      <el-dropdown-item command="share">分享</el-dropdown-item>
                      <el-dropdown-item command="download">下载</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 本周访问的文档 -->
        <div v-if="weekDocuments.length > 0" class="time-section">
          <h3>本周</h3>
          
          <div :class="['documents-list', viewMode === 'grid' ? 'grid-view' : 'list-view']">
            <div
              v-for="document in weekDocuments"
              :key="document.id"
              class="document-item"
              @click="openDocument(document.id)"
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
                  <span>{{ formatDate(document.last_accessed_at || document.updated_at) }}</span>
                </div>
              </div>
              
              <div class="document-actions">
                <el-button
                  circle
                  size="small"
                  :icon="document.is_favorite ? 'StarFilled' : 'Star'"
                  @click.stop="toggleFavorite(document)"
                  :class="{ 'is-favorite': document.is_favorite }"
                />
                
                <el-dropdown trigger="click" @command="(command) => handleCommand(command, document)">
                  <el-button circle size="small" :icon="MoreFilled" />
                  
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="open">打开</el-dropdown-item>
                      <el-dropdown-item command="share">分享</el-dropdown-item>
                      <el-dropdown-item command="download">下载</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 更早访问的文档 -->
        <div v-if="earlierDocuments.length > 0" class="time-section">
          <h3>更早</h3>
          
          <div :class="['documents-list', viewMode === 'grid' ? 'grid-view' : 'list-view']">
            <div
              v-for="document in earlierDocuments"
              :key="document.id"
              class="document-item"
              @click="openDocument(document.id)"
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
                  <span>{{ formatDate(document.last_accessed_at || document.updated_at) }}</span>
                </div>
              </div>
              
              <div class="document-actions">
                <el-button
                  circle
                  size="small"
                  :icon="document.is_favorite ? 'StarFilled' : 'Star'"
                  @click.stop="toggleFavorite(document)"
                  :class="{ 'is-favorite': document.is_favorite }"
                />
                
                <el-dropdown trigger="click" @command="(command) => handleCommand(command, document)">
                  <el-button circle size="small" :icon="MoreFilled" />
                  
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="open">打开</el-dropdown-item>
                      <el-dropdown-item command="share">分享</el-dropdown-item>
                      <el-dropdown-item command="download">下载</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
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
          <el-radio label="access">访问时间</el-radio>
          <el-radio label="name">名称</el-radio>
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
    
    <!-- 分享对话框 -->
    <el-dialog
      v-model="showShareDialog"
      title="分享文档"
      width="500px"
      destroy-on-close
    >
      <div v-if="selectedDocument" class="share-container">
        <p>创建分享链接，以便其他人访问 "{{ selectedDocument.title }}"</p>
        
        <el-form label-position="top">
          <el-form-item label="权限">
            <el-radio-group v-model="shareForm.permissionLevel">
              <el-radio label="READ">只读</el-radio>
              <el-radio label="WRITE">可编辑</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="有效期">
            <el-select v-model="shareForm.expiration" style="width: 100%">
              <el-option label="永久有效" value="never" />
              <el-option label="1天" value="1d" />
              <el-option label="7天" value="7d" />
              <el-option label="30天" value="30d" />
              <el-option label="自定义" value="custom" />
            </el-select>
            
            <el-date-picker
              v-if="shareForm.expiration === 'custom'"
              v-model="shareForm.expirationDate"
              type="datetime"
              placeholder="选择过期时间"
              style="width: 100%; margin-top: 8px;"
            />
          </el-form-item>
        </el-form>
        
        <div v-if="shareLink" class="share-link">
          <el-input v-model="shareLink" readonly>
            <template #append>
              <el-button @click="copyShareLink">复制</el-button>
            </template>
          </el-input>
        </div>
        
        <div class="dialog-footer">
          <el-button @click="showShareDialog = false">取消</el-button>
          <el-button type="primary" @click="createShareLink" :loading="isCreatingShare">
            创建链接
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Menu, Grid, Sort, Loading, Document, PictureFilled, Files, MoreFilled, Star, StarFilled } from '@element-plus/icons-vue'
import type { Document as DocumentType } from '@/types/document'
import { getRecentDocuments, addToFavorites, removeFromFavorites } from '@/api/search'
import { shareDocument } from '@/api/document'
import { formatDate as formatDateUtil } from '@/utils/date'

const router = useRouter()

// 状态
const isLoading = ref(true)
const documents = ref<DocumentType[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')
const showSortOptions = ref(false)
const sortBy = ref<'access' | 'name' | 'type'>('access')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 分享对话框
const showShareDialog = ref(false)
const selectedDocument = ref<DocumentType | null>(null)
const shareForm = ref({
  permissionLevel: 'READ',
  expiration: 'never',
  expirationDate: null as Date | null
})
const shareLink = ref('')
const isCreatingShare = ref(false)

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
      const dateA = new Date(a.last_accessed_at || a.updated_at).getTime()
      const dateB = new Date(b.last_accessed_at || b.updated_at).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    }
  })
  
  return result
})

// 按时间分组
const todayDocuments = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return filteredDocuments.value.filter(doc => {
    const accessDate = new Date(doc.last_accessed_at || doc.updated_at)
    return accessDate >= today
  })
})

const weekDocuments = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  
  return filteredDocuments.value.filter(doc => {
    const accessDate = new Date(doc.last_accessed_at || doc.updated_at)
    return accessDate >= weekStart && accessDate < today
  })
})

const earlierDocuments = computed(() => {
  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  
  return filteredDocuments.value.filter(doc => {
    const accessDate = new Date(doc.last_accessed_at || doc.updated_at)
    return accessDate < weekStart
  })
})

// 生命周期钩子
onMounted(async () => {
  await loadData()
})

// 方法
async function loadData() {
  isLoading.value = true
  
  try {
    const response = await getRecentDocuments(50)
    documents.value = response.data.items
  } catch (error) {
    console.error('Failed to load recent documents', error)
    ElMessage.error('加载最近文档失败')
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

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
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

async function toggleFavorite(document: DocumentType) {
  try {
    if (document.is_favorite) {
      await removeFromFavorites(document.id)
      document.is_favorite = false
      ElMessage.success('已从收藏中移除')
    } else {
      await addToFavorites(document.id)
      document.is_favorite = true
      ElMessage.success('已添加到收藏')
    }
  } catch (error) {
    console.error('Failed to toggle favorite', error)
    ElMessage.error('操作失败')
  }
}

function handleCommand(command: string, document: DocumentType) {
  selectedDocument.value = document
  
  switch (command) {
    case 'open':
      openDocument(document.id)
      break
      
    case 'share':
      showShareDialog.value = true
      shareLink.value = ''
      break
      
    case 'download':
      // 实现下载逻辑
      ElMessage.info('下载功能开发中')
      break
  }
}

async function createShareLink() {
  if (!selectedDocument.value) return
  
  isCreatingShare.value = true
  
  try {
    // 计算过期时间
    let expiresAt: string | undefined
    
    if (shareForm.value.expiration === 'never') {
      expiresAt = undefined
    } else if (shareForm.value.expiration === 'custom' && shareForm.value.expirationDate) {
      expiresAt = shareForm.value.expirationDate.toISOString()
    } else {
      const days = parseInt(shareForm.value.expiration)
      const date = new Date()
      date.setDate(date.getDate() + days)
      expiresAt = date.toISOString()
    }
    
    // 调用分享API
    const response = await shareDocument(selectedDocument.value.id, {
      permission_level: shareForm.value.permissionLevel,
      expires_at: expiresAt
    })
    
    // 设置分享链接
    const baseUrl = window.location.origin
    shareLink.value = `${baseUrl}/share/${response.data.access_code}`
    
    ElMessage.success('分享链接已创建')
  } catch (error) {
    console.error('Failed to create share link', error)
    ElMessage.error('创建分享链接失败')
  } finally {
    isCreatingShare.value = false
  }
}

function copyShareLink() {
  navigator.clipboard.writeText(shareLink.value)
    .then(() => {
      ElMessage.success('链接已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}
</script>

<style scoped>
.recent-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.recent-header {
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

.recent-content {
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

.time-section {
  margin-bottom: 24px;
}

.time-section h3 {
  margin-top: 0;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
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
  cursor: pointer;
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
}

.document-actions {
  display: flex;
  gap: 8px;
}

.documents-list.grid-view .document-actions {
  margin-top: 16px;
  align-self: flex-end;
}

.is-favorite {
  color: #f7ba2a;
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

.share-container {
  padding: 0 16px;
}

.share-link {
  margin: 16px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
