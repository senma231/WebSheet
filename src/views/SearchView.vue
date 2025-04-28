<template>
  <div class="search-view">
    <div class="search-header">
      <div class="search-input-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文档、文件夹、标签..."
          prefix-icon="Search"
          clearable
          @keydown.enter="performSearch"
          @clear="clearSearch"
        >
          <template #append>
            <el-button @click="performSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
      
      <div class="search-filters">
        <el-button
          :type="showAdvanced ? 'primary' : 'default'"
          @click="toggleAdvancedSearch"
        >
          高级搜索
        </el-button>
      </div>
    </div>
    
    <div v-if="showAdvanced" class="advanced-search-container">
      <advanced-search
        :initial-query="searchQuery"
        :loading="isSearching"
        @search="handleAdvancedSearch"
        @reset="clearSearch"
      />
    </div>
    
    <div v-if="!searchQuery && !hasSearched" class="search-placeholder">
      <div class="recent-searches" v-if="recentSearches.length > 0">
        <h3>最近搜索</h3>
        <div class="recent-list">
          <el-tag
            v-for="(search, index) in recentSearches"
            :key="index"
            class="recent-tag"
            @click="applyRecentSearch(search)"
          >
            {{ search }}
          </el-tag>
        </div>
        <el-button type="text" @click="clearRecentSearches">清除搜索历史</el-button>
      </div>
      
      <div class="hot-searches" v-if="hotSearches.length > 0">
        <h3>热门搜索</h3>
        <div class="hot-list">
          <el-tag
            v-for="(search, index) in hotSearches"
            :key="index"
            class="hot-tag"
            @click="applyRecentSearch(search)"
          >
            {{ search }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <search-results
      v-else
      :results="searchResults"
      :total="totalResults"
      :query="searchQuery"
      :loading="isSearching"
      :loading-more="isLoadingMore"
      :has-more="hasMoreResults"
      @result-click="handleResultClick"
      @load-more="loadMoreResults"
      @favorite-toggle="handleFavoriteToggle"
      @action="handleResultAction"
    />
    
    <!-- 预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="文档预览"
      width="80%"
      destroy-on-close
    >
      <div v-if="selectedResult" class="preview-container">
        <div class="preview-header">
          <h3>{{ selectedResult.title }}</h3>
          <div class="preview-meta">
            <span>{{ formatDate(selectedResult.updated_at) }}</span>
            <span>{{ formatFileSize(selectedResult.size) }}</span>
          </div>
        </div>
        
        <div class="preview-content">
          <!-- 这里应该根据文档类型显示不同的预览组件 -->
          <div class="preview-placeholder">
            <el-empty description="预览功能开发中" />
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 分享对话框 -->
    <el-dialog
      v-model="showShareDialog"
      title="分享文档"
      width="500px"
      destroy-on-close
    >
      <div v-if="selectedResult" class="share-container">
        <p>创建分享链接，以便其他人访问 "{{ selectedResult.title }}"</p>
        
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
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import AdvancedSearch from '@/components/search/AdvancedSearch.vue'
import SearchResults from '@/components/search/SearchResults.vue'
import { searchDocuments, getHotSearches, recordDocumentAccess, type SearchParams, type SearchResult } from '@/api/search'
import { shareDocument } from '@/api/document'
import { formatDate as formatDateUtil } from '@/utils/date'

const router = useRouter()
const route = useRoute()

// 状态
const searchQuery = ref('')
const showAdvanced = ref(false)
const isSearching = ref(false)
const isLoadingMore = ref(false)
const searchResults = ref<SearchResult[]>([])
const totalResults = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const hasMoreResults = ref(false)
const hasSearched = ref(false)
const recentSearches = ref<string[]>([])
const hotSearches = ref<string[]>([])
const currentSearchParams = ref<SearchParams | null>(null)

// 预览和分享对话框
const showPreviewDialog = ref(false)
const showShareDialog = ref(false)
const selectedResult = ref<SearchResult | null>(null)
const shareForm = ref({
  permissionLevel: 'READ',
  expiration: 'never',
  expirationDate: null as Date | null
})
const shareLink = ref('')
const isCreatingShare = ref(false)

// 监听路由查询参数变化
watch(() => route.query.q, (newQuery) => {
  if (newQuery) {
    searchQuery.value = newQuery as string
    performSearch()
  }
})

// 生命周期钩子
onMounted(async () => {
  // 从路由参数获取查询
  const query = route.query.q as string | undefined
  if (query) {
    searchQuery.value = query
    performSearch()
  }
  
  // 加载最近搜索和热门搜索
  loadRecentSearches()
  await loadHotSearches()
})

// 方法
async function performSearch() {
  if (!searchQuery.value.trim()) return
  
  isSearching.value = true
  currentPage.value = 1
  hasSearched.value = true
  
  try {
    // 更新URL
    router.push({
      path: '/dashboard/search',
      query: { q: searchQuery.value }
    })
    
    // 构建搜索参数
    const params: SearchParams = {
      query: searchQuery.value,
      page: currentPage.value,
      size: pageSize.value,
      sort: 'relevance',
      order: 'desc'
    }
    
    currentSearchParams.value = params
    
    // 调用搜索API
    const response = await searchDocuments(params)
    searchResults.value = response.data.items
    totalResults.value = response.data.total
    
    // 检查是否有更多结果
    hasMoreResults.value = searchResults.value.length < totalResults.value
    
    // 保存到最近搜索
    saveRecentSearch(searchQuery.value)
  } catch (error) {
    console.error('Failed to search documents', error)
    ElMessage.error('搜索失败')
  } finally {
    isSearching.value = false
  }
}

async function handleAdvancedSearch(params: SearchParams) {
  isSearching.value = true
  currentPage.value = 1
  hasSearched.value = true
  
  try {
    // 更新URL
    router.push({
      path: '/dashboard/search',
      query: { q: params.query }
    })
    
    // 保存搜索参数
    currentSearchParams.value = {
      ...params,
      page: currentPage.value,
      size: pageSize.value
    }
    
    // 更新搜索框
    searchQuery.value = params.query
    
    // 调用搜索API
    const response = await searchDocuments(currentSearchParams.value)
    searchResults.value = response.data.items
    totalResults.value = response.data.total
    
    // 检查是否有更多结果
    hasMoreResults.value = searchResults.value.length < totalResults.value
    
    // 保存到最近搜索
    saveRecentSearch(params.query)
  } catch (error) {
    console.error('Failed to search documents', error)
    ElMessage.error('搜索失败')
  } finally {
    isSearching.value = false
  }
}

async function loadMoreResults() {
  if (isLoadingMore.value || !currentSearchParams.value) return
  
  isLoadingMore.value = true
  currentPage.value += 1
  
  try {
    // 更新页码
    const params = {
      ...currentSearchParams.value,
      page: currentPage.value
    }
    
    // 调用搜索API
    const response = await searchDocuments(params)
    
    // 添加到结果列表
    searchResults.value = [...searchResults.value, ...response.data.items]
    
    // 检查是否有更多结果
    hasMoreResults.value = searchResults.value.length < totalResults.value
  } catch (error) {
    console.error('Failed to load more results', error)
    ElMessage.error('加载更多结果失败')
  } finally {
    isLoadingMore.value = false
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  totalResults.value = 0
  hasSearched.value = false
  currentSearchParams.value = null
  
  // 更新URL
  router.push({
    path: '/dashboard/search',
    query: {}
  })
}

function toggleAdvancedSearch() {
  showAdvanced.value = !showAdvanced.value
}

function saveRecentSearch(query: string) {
  // 从本地存储加载最近搜索
  const searches = [...recentSearches.value]
  
  // 如果已存在，先移除
  const index = searches.indexOf(query)
  if (index !== -1) {
    searches.splice(index, 1)
  }
  
  // 添加到开头
  searches.unshift(query)
  
  // 只保留最近10个搜索
  recentSearches.value = searches.slice(0, 10)
  
  // 保存到本地存储
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
}

function loadRecentSearches() {
  const searches = localStorage.getItem('recentSearches')
  if (searches) {
    try {
      recentSearches.value = JSON.parse(searches)
    } catch (e) {
      console.error('Failed to parse recent searches', e)
      recentSearches.value = []
    }
  }
}

function clearRecentSearches() {
  recentSearches.value = []
  localStorage.removeItem('recentSearches')
}

function applyRecentSearch(query: string) {
  searchQuery.value = query
  performSearch()
}

async function loadHotSearches() {
  try {
    const response = await getHotSearches()
    hotSearches.value = response.data.keywords
  } catch (error) {
    console.error('Failed to load hot searches', error)
  }
}

async function handleResultClick(result: SearchResult) {
  try {
    // 记录访问
    await recordDocumentAccess(result.id)
    
    // 导航到文档
    router.push(`/dashboard/document/${result.id}`)
  } catch (error) {
    console.error('Failed to record document access', error)
    // 仍然导航到文档
    router.push(`/dashboard/document/${result.id}`)
  }
}

function handleFavoriteToggle(result: SearchResult) {
  // 已在SearchResults组件中处理
}

function handleResultAction({ command, result }: { command: string, result: SearchResult }) {
  selectedResult.value = result
  
  switch (command) {
    case 'open':
      handleResultClick(result)
      break
      
    case 'preview':
      showPreviewDialog.value = true
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
  if (!selectedResult.value) return
  
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
    const response = await shareDocument(selectedResult.value.id, {
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
.search-view {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input-container {
  flex: 1;
}

.advanced-search-container {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.search-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 40px 0;
}

.recent-searches, .hot-searches {
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.recent-list, .hot-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.recent-tag, .hot-tag {
  cursor: pointer;
}

.preview-container {
  min-height: 400px;
}

.preview-header {
  margin-bottom: 16px;
}

.preview-meta {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}

.preview-content {
  min-height: 300px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.preview-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
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
