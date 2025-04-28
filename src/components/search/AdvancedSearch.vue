<template>
  <div class="advanced-search">
    <el-form :model="searchForm" label-width="100px" size="default">
      <el-form-item label="关键词">
        <el-input
          v-model="searchForm.query"
          placeholder="输入搜索关键词"
          clearable
          @keydown.enter="search"
        />
      </el-form-item>
      
      <el-form-item label="文档类型">
        <el-select
          v-model="searchForm.type"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="选择文档类型"
          style="width: 100%"
        >
          <el-option label="Word文档" value="WORD" />
          <el-option label="Excel表格" value="EXCEL" />
          <el-option label="PPT演示文稿" value="PPT" />
          <el-option label="PDF文档" value="PDF" />
          <el-option label="Markdown" value="MARKDOWN" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="文件夹">
        <el-select
          v-model="searchForm.folderId"
          filterable
          clearable
          placeholder="选择文件夹"
          style="width: 100%"
        >
          <el-option label="所有文件夹" value="" />
          <el-option
            v-for="folder in folders"
            :key="folder.id"
            :label="folder.name"
            :value="folder.id"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="标签">
        <el-select
          v-model="searchForm.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="选择或创建标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in tags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="修改日期">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="排序方式">
        <el-select v-model="searchForm.sort" style="width: 50%">
          <el-option label="相关度" value="relevance" />
          <el-option label="修改日期" value="updated" />
          <el-option label="标题" value="title" />
        </el-select>
        
        <el-select v-model="searchForm.order" style="width: 50%">
          <el-option label="升序" value="asc" />
          <el-option label="降序" value="desc" />
        </el-select>
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="search" :loading="loading">搜索</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFolders } from '@/api/document'
import { getDocumentTags } from '@/api/search'
import type { Folder } from '@/types/document'
import type { SearchParams } from '@/api/search'

const props = defineProps({
  initialQuery: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['search', 'reset'])

// 状态
const folders = ref<Folder[]>([])
const tags = ref<string[]>([])
const searchForm = ref<SearchParams>({
  query: props.initialQuery,
  sort: 'relevance',
  order: 'desc',
  type: [],
  tags: [],
  folder_id: ''
})
const dateRange = ref<[Date, Date] | null>(null)

// 监听初始查询变化
watch(() => props.initialQuery, (newValue) => {
  searchForm.value.query = newValue
})

// 监听日期范围变化
watch(dateRange, (newValue) => {
  if (newValue) {
    searchForm.value.date_from = newValue[0].toISOString().split('T')[0]
    searchForm.value.date_to = newValue[1].toISOString().split('T')[0]
  } else {
    searchForm.value.date_from = undefined
    searchForm.value.date_to = undefined
  }
})

// 生命周期钩子
onMounted(async () => {
  await Promise.all([
    loadFolders(),
    loadTags()
  ])
})

// 方法
async function loadFolders() {
  try {
    const response = await getFolders()
    folders.value = response.data.items
  } catch (error) {
    console.error('Failed to load folders', error)
    ElMessage.error('加载文件夹失败')
  }
}

async function loadTags() {
  try {
    const response = await getDocumentTags()
    tags.value = response.data.tags
  } catch (error) {
    console.error('Failed to load tags', error)
    ElMessage.error('加载标签失败')
  }
}

function search() {
  // 构建搜索参数
  const params: SearchParams = {
    ...searchForm.value,
    folder_id: searchForm.value.folder_id || undefined
  }
  
  // 触发搜索事件
  emit('search', params)
}

function resetForm() {
  // 重置表单
  searchForm.value = {
    query: '',
    sort: 'relevance',
    order: 'desc',
    type: [],
    tags: [],
    folder_id: ''
  }
  dateRange.value = null
  
  // 触发重置事件
  emit('reset')
}
</script>

<style scoped>
.advanced-search {
  padding: 16px;
}
</style>
