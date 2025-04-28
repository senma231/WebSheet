<template>
  <div class="document-search">
    <el-popover
      placement="bottom"
      :width="400"
      trigger="click"
      popper-class="search-popover"
      v-model:visible="showPopover"
    >
      <template #reference>
        <div class="search-input-wrapper">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文档..."
            prefix-icon="Search"
            clearable
            @input="handleInput"
            @keydown.enter="search"
            @focus="showPopover = true"
            @clear="clearSearch"
          />
        </div>
      </template>
      
      <div class="search-content">
        <div v-if="loading" class="search-loading">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <p>搜索中...</p>
        </div>
        
        <div v-else-if="searchQuery && searchResults.length === 0" class="search-empty">
          <p>未找到与"{{ searchQuery }}"相关的结果</p>
        </div>
        
        <div v-else-if="!searchQuery" class="search-placeholder">
          <p>输入关键词搜索文档</p>
          
          <template v-if="recentSearches.length > 0">
            <div class="recent-searches">
              <div class="recent-header">
                <h4>最近搜索</h4>
                <el-button type="text" @click="clearRecentSearches">清除</el-button>
              </div>
              
              <div class="recent-list">
                <div
                  v-for="(search, index) in recentSearches"
                  :key="index"
                  class="recent-item"
                  @click="applyRecentSearch(search)"
                >
                  <el-icon><Clock /></el-icon>
                  <span>{{ search }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
        
        <div v-else class="search-results">
          <div class="results-header">
            <span>找到 {{ searchResults.length }} 个结果</span>
            <el-select v-model="sortBy" placeholder="排序" size="small" @change="sortResults">
              <el-option label="相关度" value="relevance" />
              <el-option label="最近更新" value="updated" />
              <el-option label="标题" value="title" />
            </el-select>
          </div>
          
          <div class="results-list">
            <div
              v-for="result in searchResults"
              :key="result.id"
              class="result-item"
              @click="selectResult(result)"
            >
              <div class="result-icon">
                <file-icon :type="result.type" />
              </div>
              
              <div class="result-content">
                <div class="result-title" v-html="highlightText(result.title, searchQuery)"></div>
                
                <div class="result-path">
                  <template v-if="result.path && result.path.length > 0">
                    <span
                      v-for="(folder, index) in result.path"
                      :key="index"
                    >
                      {{ folder }}
                      <span v-if="index < result.path.length - 1" class="path-separator">/</span>
                    </span>
                  </template>
                  <span v-else>根目录</span>
                </div>
                
                <div v-if="result.snippet" class="result-snippet" v-html="highlightText(result.snippet, searchQuery)"></div>
                
                <div class="result-meta">
                  <span>{{ formatDate(result.updated_at) }}</span>
                  <span>{{ formatFileSize(result.size) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="hasMoreResults" class="results-more">
            <el-button type="text" @click="loadMoreResults">加载更多结果</el-button>
          </div>
        </div>
        
        <div class="search-footer">
          <el-button v-if="searchQuery" type="primary" @click="search">
            高级搜索
          </el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, watch, onMounted } from 'vue'
import { Search, Loading, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDate as formatDateUtil } from '@/utils/date'
import FileIcon from '@/components/common/FileIcon.vue'

// 定义事件
const emit = defineEmits(['result-selected', 'search'])

// 状态
const searchQuery = ref('')
const showPopover = ref(false)
const loading = ref(false)
const searchResults = ref<any[]>([])
const recentSearches = ref<string[]>([])
const sortBy = ref('relevance')
const page = ref(1)
const hasMoreResults = ref(false)

// 监听搜索查询变化
let searchTimeout: number | null = null
watch(searchQuery, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (newValue) {
    searchTimeout = window.setTimeout(() => {
      search()
    }, 500)
  }
})

// 生命周期钩子
onMounted(() => {
  loadRecentSearches()
})

// 方法
function handleInput() {
  if (!searchQuery.value) {
    searchResults.value = []
  }
}

async function search() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  
  loading.value = true
  page.value = 1
  
  try {
    // 这里应该调用API搜索文档
    // const response = await searchDocuments({
    //   query: searchQuery.value,
    //   page: page.value,
    //   sort: sortBy.value
    // })
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    searchResults.value = [
      {
        id: '1',
        title: '项目计划文档',
        type: 'WORD',
        path: ['项目文件', '计划'],
        snippet: '这是一个详细的项目计划文档，包含了项目的各个阶段和里程碑。',
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        size: 1024 * 1024 * 2.5
      },
      {
        id: '2',
        title: '财务报表',
        type: 'EXCEL',
        path: ['财务', '2023'],
        snippet: '2023年第二季度财务报表，包含收入、支出和利润分析。',
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        size: 1024 * 1024 * 1.2
      },
      {
        id: '3',
        title: '产品介绍演示',
        type: 'PPT',
        path: ['营销', '产品'],
        snippet: '新产品介绍演示文稿，包含产品特点、优势和市场定位。',
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        size: 1024 * 1024 * 5.7
      }
    ]
    
    // 模拟是否有更多结果
    hasMoreResults.value = searchResults.value.length >= 3
    
    // 保存到最近搜索
    saveRecentSearch(searchQuery.value)
  } catch (error) {
    console.error('Failed to search documents', error)
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

async function loadMoreResults() {
  if (loading.value) return
  
  loading.value = true
  page.value += 1
  
  try {
    // 这里应该调用API加载更多结果
    // const response = await searchDocuments({
    //   query: searchQuery.value,
    //   page: page.value,
    //   sort: sortBy.value
    // })
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const moreResults = [
      {
        id: '4',
        title: '会议记录',
        type: 'MARKDOWN',
        path: ['会议', '2023'],
        snippet: '2023年7月15日产品讨论会议记录，包含了产品规划和任务分配。',
        updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        size: 1024 * 512
      }
    ]
    
    // 添加到结果列表
    searchResults.value = [...searchResults.value, ...moreResults]
    
    // 模拟是否有更多结果
    hasMoreResults.value = page.value < 3
  } catch (error) {
    console.error('Failed to load more results', error)
    ElMessage.error('加载更多结果失败')
  } finally {
    loading.value = false
  }
}

function sortResults() {
  // 根据排序方式对结果进行排序
  if (sortBy.value === 'updated') {
    searchResults.value.sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  } else if (sortBy.value === 'title') {
    searchResults.value.sort((a, b) => {
      return a.title.localeCompare(b.title)
    })
  }
  // relevance排序由服务端处理，这里不需要额外处理
}

function selectResult(result: any) {
  emit('result-selected', result)
  showPopover.value = false
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
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
  search()
}

function highlightText(text: string, query: string) {
  if (!query) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
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

<style>
/* 全局样式，确保弹出框样式正确 */
.search-popover {
  padding: 0 !important;
}

.highlight {
  background-color: rgba(255, 230, 0, 0.4);
  font-weight: bold;
}
</style>

<style scoped>
.document-search {
  width: 100%;
  max-width: 400px;
}

.search-input-wrapper {
  width: 100%;
}

.search-content {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.search-loading,
.search-empty,
.search-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-color-secondary);
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

.recent-searches {
  width: 100%;
  margin-top: 16px;
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.recent-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--text-color-regular);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.recent-item:hover {
  background-color: var(--background-color-base);
}

.search-results {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color-light);
}

.results-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.result-item {
  display: flex;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.result-item:hover {
  background-color: var(--background-color-base);
}

.result-icon {
  margin-right: 12px;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-path {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.path-separator {
  margin: 0 4px;
}

.result-snippet {
  font-size: 13px;
  color: var(--text-color-regular);
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.results-more {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  border-top: 1px solid var(--border-color-light);
}

.search-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color-light);
}
</style>
