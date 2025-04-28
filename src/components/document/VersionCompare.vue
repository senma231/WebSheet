<template>
  <div class="version-compare">
    <div class="compare-header">
      <h3>版本比较</h3>
      <div class="version-selectors">
        <div class="version-selector">
          <span>从版本：</span>
          <el-select v-model="fromVersion" placeholder="选择版本" @change="handleVersionChange">
            <el-option
              v-for="version in versions"
              :key="version.id"
              :label="`版本 ${version.version} (${formatDate(version.created_at)})`"
              :value="version.version"
            />
          </el-select>
        </div>
        
        <div class="version-selector">
          <span>到版本：</span>
          <el-select v-model="toVersion" placeholder="选择版本" @change="handleVersionChange">
            <el-option
              v-for="version in versions"
              :key="version.id"
              :label="`版本 ${version.version} (${formatDate(version.created_at)})`"
              :value="version.version"
            />
          </el-select>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-alert
        :title="error"
        type="error"
        show-icon
      />
    </div>
    
    <div v-else-if="!fromVersion || !toVersion" class="empty-container">
      <el-empty description="请选择要比较的版本" />
    </div>
    
    <div v-else-if="!diffResult" class="empty-container">
      <el-empty description="没有差异" />
    </div>
    
    <div v-else class="diff-container">
      <!-- Markdown差异 -->
      <div v-if="documentType === 'MARKDOWN'" class="markdown-diff">
        <div class="diff-view">
          <div class="diff-header">
            <div class="diff-title">版本 {{ fromVersion }}</div>
            <div class="diff-title">版本 {{ toVersion }}</div>
          </div>
          
          <div class="diff-content">
            <div v-for="(diff, index) in diffResult.diffs" :key="index" class="diff-line">
              <div class="line-number">{{ diff.lineNumber }}</div>
              
              <div 
                class="line-content" 
                :class="{
                  'line-added': diff.type === 'added',
                  'line-removed': diff.type === 'removed',
                  'line-unchanged': diff.type === 'unchanged'
                }"
              >
                <pre>{{ diff.content }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 其他文档类型差异 -->
      <div v-else class="other-diff">
        <div class="diff-summary">
          <h4>变更摘要</h4>
          <ul>
            <li v-for="(change, index) in diffResult.summary" :key="index">
              {{ change }}
            </li>
          </ul>
        </div>
        
        <div class="diff-actions">
          <el-button type="primary" @click="previewFromVersion">预览旧版本</el-button>
          <el-button type="primary" @click="previewToVersion">预览新版本</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { compareDocumentVersions } from '@/api/document'
import { formatDate as formatDateUtil } from '@/utils/date'

// 定义属性
const props = defineProps<{
  documentId: string;
  documentType: string;
  versions: any[];
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'preview-version', version: number): void;
}>()

// 状态
const loading = ref(false)
const error = ref<string | null>(null)
const fromVersion = ref<number | null>(null)
const toVersion = ref<number | null>(null)
const diffResult = ref<any | null>(null)

// 监听版本变化
watch([fromVersion, toVersion], async ([newFrom, newTo]) => {
  if (newFrom && newTo && newFrom !== newTo) {
    await loadDiff()
  } else {
    diffResult.value = null
  }
})

// 监听版本列表变化
watch(() => props.versions, (newVersions) => {
  if (newVersions && newVersions.length >= 2) {
    // 默认选择最近的两个版本进行比较
    fromVersion.value = newVersions[1].version
    toVersion.value = newVersions[0].version
  }
}, { immediate: true })

// 方法
async function loadDiff() {
  if (!fromVersion.value || !toVersion.value) return
  
  loading.value = true
  error.value = null
  
  try {
    const response = await compareDocumentVersions(
      props.documentId,
      fromVersion.value,
      toVersion.value
    )
    
    diffResult.value = response.data
  } catch (err: any) {
    console.error('Failed to load diff', err)
    error.value = err.message || '加载差异失败'
    diffResult.value = null
  } finally {
    loading.value = false
  }
}

function handleVersionChange() {
  if (fromVersion.value === toVersion.value) {
    ElMessage.warning('请选择不同的版本进行比较')
    diffResult.value = null
  }
}

function previewFromVersion() {
  if (fromVersion.value) {
    emit('preview-version', fromVersion.value)
  }
}

function previewToVersion() {
  if (toVersion.value) {
    emit('preview-version', toVersion.value)
  }
}

function formatDate(dateString: string) {
  return formatDateUtil(dateString, 'YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.version-compare {
  padding: 16px;
}

.compare-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.compare-header h3 {
  margin: 0;
}

.version-selectors {
  display: flex;
  gap: 16px;
}

.version-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
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

.diff-container {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.diff-header {
  display: flex;
  background-color: var(--el-color-info-light-9);
  border-bottom: 1px solid var(--el-border-color);
}

.diff-title {
  flex: 1;
  padding: 8px 16px;
  font-weight: bold;
  text-align: center;
  border-right: 1px solid var(--el-border-color);
}

.diff-title:last-child {
  border-right: none;
}

.diff-content {
  max-height: 600px;
  overflow: auto;
}

.diff-line {
  display: flex;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.line-number {
  width: 50px;
  padding: 4px 8px;
  text-align: right;
  background-color: var(--el-color-info-light-9);
  color: var(--el-text-color-secondary);
  border-right: 1px solid var(--el-border-color);
  user-select: none;
}

.line-content {
  flex: 1;
  padding: 4px 16px;
  white-space: pre-wrap;
  font-family: monospace;
}

.line-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.line-added {
  background-color: var(--el-color-success-light-9);
}

.line-removed {
  background-color: var(--el-color-danger-light-9);
}

.other-diff {
  padding: 16px;
}

.diff-summary {
  margin-bottom: 24px;
}

.diff-summary h4 {
  margin-top: 0;
  margin-bottom: 16px;
}

.diff-summary ul {
  padding-left: 20px;
}

.diff-summary li {
  margin-bottom: 8px;
}

.diff-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 24px;
}
</style>
