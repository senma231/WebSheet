<template>
  <div class="search-results">
    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>搜索中...</p>
    </div>
    
    <div v-else-if="results.length === 0" class="empty-results">
      <el-empty description="未找到匹配的结果" />
    </div>
    
    <template v-else>
      <div class="results-header">
        <div class="results-count">
          找到 {{ total }} 个结果
        </div>
        
        <div class="results-actions">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="list">
              <el-icon><List /></el-icon>
            </el-radio-button>
            <el-radio-button label="grid">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <div :class="['results-list', `${viewMode}-view`]">
        <div
          v-for="result in results"
          :key="result.id"
          class="result-item"
          @click="handleResultClick(result)"
        >
          <div class="result-icon">
            <el-icon v-if="result.type === 'WORD'"><Document /></el-icon>
            <el-icon v-else-if="result.type === 'EXCEL'"><Grid /></el-icon>
            <el-icon v-else-if="result.type === 'PPT'"><PictureFilled /></el-icon>
            <el-icon v-else-if="result.type === 'PDF'"><Files /></el-icon>
            <el-icon v-else-if="result.type === 'MARKDOWN'"><Document /></el-icon>
            <el-icon v-else><Folder /></el-icon>
          </div>
          
          <div class="result-content">
            <div class="result-title" v-html="highlightText(result.title, query)"></div>
            
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
            
            <div v-if="result.snippet" class="result-snippet" v-html="highlightText(result.snippet, query)"></div>
            
            <div class="result-meta">
              <span class="result-date">{{ formatDate(result.updated_at) }}</span>
              <span class="result-size">{{ formatFileSize(result.size) }}</span>
              
              <div v-if="result.tags && result.tags.length > 0" class="result-tags">
                <el-tag
                  v-for="tag in result.tags"
                  :key="tag"
                  size="small"
                  effect="plain"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <div class="result-actions">
            <el-button
              circle
              size="small"
              :icon="result.is_favorite ? 'Star' : 'StarFilled'"
              @click.stop="toggleFavorite(result)"
              :class="{ 'is-favorite': result.is_favorite }"
            />
            
            <el-dropdown trigger="click" @command="(command) => handleCommand(command, result)">
              <el-button circle size="small" :icon="MoreFilled" />
              
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="open">打开</el-dropdown-item>
                  <el-dropdown-item command="preview">预览</el-dropdown-item>
                  <el-dropdown-item command="share">分享</el-dropdown-item>
                  <el-dropdown-item command="download">下载</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
      
      <div v-if="hasMore" class="load-more">
        <el-button
          type="primary"
          plain
          :loading="loadingMore"
          @click="loadMore"
        >
          加载更多
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, Grid, PictureFilled, Files, Folder, List, MoreFilled, Star, StarFilled, Loading } from '@element-plus/icons-vue'
import { formatDate as formatDateUtil } from '@/utils/date'
import { addToFavorites, removeFromFavorites } from '@/api/search'
import type { SearchResult } from '@/api/search'

const props = defineProps({
  results: {
    type: Array as () => SearchResult[],
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  query: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['result-click', 'load-more', 'favorite-toggle', 'action'])
const router = useRouter()

// 状态
const viewMode = ref<'list' | 'grid'>('list')

// 方法
function handleResultClick(result: SearchResult) {
  emit('result-click', result)
}

function loadMore() {
  emit('load-more')
}

async function toggleFavorite(result: SearchResult) {
  try {
    if (result.is_favorite) {
      await removeFromFavorites(result.id)
      result.is_favorite = false
      ElMessage.success('已从收藏中移除')
    } else {
      await addToFavorites(result.id)
      result.is_favorite = true
      ElMessage.success('已添加到收藏')
    }
    
    emit('favorite-toggle', result)
  } catch (error) {
    console.error('Failed to toggle favorite', error)
    ElMessage.error('操作失败')
  }
}

function handleCommand(command: string, result: SearchResult) {
  emit('action', { command, result })
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

<style scoped>
.search-results {
  width: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-icon {
  font-size: 32px;
  margin-bottom: 16px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.results-list.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.result-item {
  display: flex;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: all 0.3s;
  cursor: pointer;
}

.results-list.grid-view .result-item {
  flex-direction: column;
}

.results-list.list-view .result-item {
  align-items: center;
}

.result-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.result-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 16px;
}

.results-list.grid-view .result-icon {
  margin-bottom: 12px;
  margin-right: 0;
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
  color: #909399;
  margin-bottom: 8px;
}

.path-separator {
  margin: 0 4px;
}

.result-snippet {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.result-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-left: auto;
}

.result-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.results-list.grid-view .result-actions {
  margin-top: 12px;
  margin-left: 0;
  align-self: flex-end;
}

.is-favorite {
  color: #f7ba2a;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

:deep(.highlight) {
  background-color: rgba(255, 230, 0, 0.4);
  font-weight: bold;
}
</style>
