<template>
  <div class="export-options">
    <el-form :model="exportForm" label-position="top">
      <el-form-item label="导出格式">
        <el-radio-group v-model="exportForm.format" @change="handleFormatChange">
          <el-radio-button v-for="format in availableFormats" :key="format.value" :label="format.value">
            {{ format.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      
      <!-- PDF 选项 -->
      <template v-if="exportForm.format === 'pdf'">
        <el-form-item label="纸张大小">
          <el-select v-model="exportForm.pdfOptions.paperSize">
            <el-option label="A4" value="a4" />
            <el-option label="信纸 (Letter)" value="letter" />
            <el-option label="法律文书 (Legal)" value="legal" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="方向">
          <el-radio-group v-model="exportForm.pdfOptions.orientation">
            <el-radio label="portrait">纵向</el-radio>
            <el-radio label="landscape">横向</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="页边距 (mm)">
          <el-slider v-model="exportForm.pdfOptions.margin" :min="0" :max="50" :step="5" show-stops />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="exportForm.pdfOptions.includeComments">包含评论</el-checkbox>
        </el-form-item>
      </template>
      
      <!-- Word 选项 -->
      <template v-if="exportForm.format === 'word'">
        <el-form-item>
          <el-checkbox v-model="exportForm.wordOptions.includeStyles">包含样式</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="exportForm.wordOptions.includeComments">包含评论</el-checkbox>
        </el-form-item>
      </template>
      
      <!-- Excel 选项 -->
      <template v-if="exportForm.format === 'excel'">
        <el-form-item label="工作表名称">
          <el-input v-model="exportForm.excelOptions.sheetName" placeholder="Sheet1" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="exportForm.excelOptions.includeFormulas">包含公式</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="exportForm.excelOptions.includeStyles">包含样式</el-checkbox>
        </el-form-item>
      </template>
      
      <!-- PowerPoint 选项 -->
      <template v-if="exportForm.format === 'ppt'">
        <el-form-item>
          <el-checkbox v-model="exportForm.pptOptions.includeNotes">包含备注</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="exportForm.pptOptions.includeAnimations">包含动画</el-checkbox>
        </el-form-item>
      </template>
      
      <!-- Markdown 选项 -->
      <template v-if="exportForm.format === 'markdown'">
        <el-form-item>
          <el-checkbox v-model="exportForm.markdownOptions.includeMetadata">包含元数据</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="exportForm.markdownOptions.includeImages">包含图片</el-checkbox>
        </el-form-item>
      </template>
      
      <!-- HTML 选项 -->
      <template v-if="exportForm.format === 'html'">
        <el-form-item>
          <el-checkbox v-model="exportForm.htmlOptions.includeStyles">包含样式</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="exportForm.htmlOptions.includeImages">包含图片</el-checkbox>
        </el-form-item>
      </template>
    </el-form>
    
    <div class="export-actions">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" :loading="exporting" @click="exportDocument">
        {{ exporting ? '导出中...' : '导出' }}
      </el-button>
    </div>
    
    <!-- 导出进度 -->
    <div v-if="exportProgress > 0 && exportProgress < 100" class="export-progress">
      <el-progress :percentage="exportProgress" :format="progressFormat" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import type { DocumentType } from '@/types/document'
import {
  exportToPdf,
  exportToWord,
  exportToExcel,
  exportToPowerPoint,
  exportToMarkdown,
  exportToHtml,
  getExportTaskStatus,
  downloadExportedFile,
  clientExportMarkdown,
  clientExportHtml
} from '@/api/export'

// 定义属性
const props = defineProps<{
  documentId: string;
  documentTitle: string;
  documentType: DocumentType;
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'export-complete', fileUrl: string, fileName: string): void;
}>()

// 状态
const exporting = ref(false)
const exportProgress = ref(0)
const exportTaskId = ref('')
const exportPollingInterval = ref<number | null>(null)

// 导出表单
const exportForm = reactive({
  format: 'pdf',
  pdfOptions: {
    paperSize: 'a4',
    orientation: 'portrait',
    margin: 20,
    includeComments: false
  },
  wordOptions: {
    includeStyles: true,
    includeComments: false
  },
  excelOptions: {
    sheetName: 'Sheet1',
    includeFormulas: true,
    includeStyles: true
  },
  pptOptions: {
    includeNotes: true,
    includeAnimations: true
  },
  markdownOptions: {
    includeMetadata: true,
    includeImages: true
  },
  htmlOptions: {
    includeStyles: true,
    includeImages: true
  }
})

// 根据文档类型确定可用的导出格式
const availableFormats = computed(() => {
  const formats = [
    { label: 'PDF', value: 'pdf' },
    { label: 'HTML', value: 'html' }
  ]
  
  switch (props.documentType) {
    case 'WORD':
      formats.push({ label: 'Word', value: 'word' })
      formats.push({ label: 'Markdown', value: 'markdown' })
      break
    case 'EXCEL':
      formats.push({ label: 'Excel', value: 'excel' })
      break
    case 'PPT':
      formats.push({ label: 'PowerPoint', value: 'ppt' })
      break
    case 'MARKDOWN':
      formats.push({ label: 'Markdown', value: 'markdown' })
      formats.push({ label: 'Word', value: 'word' })
      break
  }
  
  return formats
})

// 处理格式变更
function handleFormatChange() {
  // 如果当前格式不在可用格式列表中，重置为第一个可用格式
  if (!availableFormats.value.some(format => format.value === exportForm.format)) {
    exportForm.format = availableFormats.value[0].value
  }
}

// 导出文档
async function exportDocument() {
  exporting.value = true
  exportProgress.value = 0
  
  try {
    let response
    let fileName = `${props.documentTitle || 'document'}`
    
    switch (exportForm.format) {
      case 'pdf':
        fileName += '.pdf'
        response = await exportToPdf(props.documentId, {
          paperSize: exportForm.pdfOptions.paperSize,
          orientation: exportForm.pdfOptions.orientation,
          margin: exportForm.pdfOptions.margin,
          includeComments: exportForm.pdfOptions.includeComments
        })
        
        if (response.data.file_url) {
          startPollingExportStatus(response.data.file_url, fileName)
        }
        break
        
      case 'word':
        fileName += '.docx'
        response = await exportToWord(props.documentId, {
          includeStyles: exportForm.wordOptions.includeStyles,
          includeComments: exportForm.wordOptions.includeComments
        })
        
        if (response.data.file_url) {
          startPollingExportStatus(response.data.file_url, fileName)
        }
        break
        
      case 'excel':
        fileName += '.xlsx'
        response = await exportToExcel(props.documentId, {
          sheetName: exportForm.excelOptions.sheetName,
          includeFormulas: exportForm.excelOptions.includeFormulas,
          includeStyles: exportForm.excelOptions.includeStyles
        })
        
        if (response.data.file_url) {
          startPollingExportStatus(response.data.file_url, fileName)
        }
        break
        
      case 'ppt':
        fileName += '.pptx'
        response = await exportToPowerPoint(props.documentId, {
          includeNotes: exportForm.pptOptions.includeNotes,
          includeAnimations: exportForm.pptOptions.includeAnimations
        })
        
        if (response.data.file_url) {
          startPollingExportStatus(response.data.file_url, fileName)
        }
        break
        
      case 'markdown':
        fileName += '.md'
        response = await exportToMarkdown(props.documentId, {
          includeMetadata: exportForm.markdownOptions.includeMetadata,
          includeImages: exportForm.markdownOptions.includeImages
        })
        
        // Markdown可以在客户端直接导出
        if (response.data.content) {
          clientExportMarkdown(response.data.content, fileName)
          exportProgress.value = 100
          ElMessage.success('导出成功')
          emit('export-complete', '', fileName)
        }
        break
        
      case 'html':
        fileName += '.html'
        response = await exportToHtml(props.documentId, {
          includeStyles: exportForm.htmlOptions.includeStyles,
          includeImages: exportForm.htmlOptions.includeImages
        })
        
        // HTML可以在客户端直接导出
        if (response.data.content) {
          clientExportHtml(response.data.content, fileName)
          exportProgress.value = 100
          ElMessage.success('导出成功')
          emit('export-complete', '', fileName)
        }
        break
    }
  } catch (error) {
    console.error('Export failed', error)
    ElMessage.error('导出失败')
    exporting.value = false
    exportProgress.value = 0
  }
}

// 开始轮询导出任务状态
function startPollingExportStatus(taskId: string, fileName: string) {
  exportTaskId.value = taskId
  
  // 清除之前的轮询
  if (exportPollingInterval.value) {
    clearInterval(exportPollingInterval.value)
  }
  
  // 设置轮询间隔
  exportPollingInterval.value = window.setInterval(async () => {
    try {
      const response = await getExportTaskStatus(exportTaskId.value)
      
      exportProgress.value = response.data.progress
      
      if (response.data.status === 'completed' && response.data.file_url) {
        clearInterval(exportPollingInterval.value as number)
        exportPollingInterval.value = null
        
        // 下载文件
        downloadExportedFile(response.data.file_url, fileName)
        
        ElMessage.success('导出成功')
        exporting.value = false
        emit('export-complete', response.data.file_url, fileName)
      } else if (response.data.status === 'failed') {
        clearInterval(exportPollingInterval.value as number)
        exportPollingInterval.value = null
        
        ElMessage.error(`导出失败: ${response.data.error || '未知错误'}`)
        exporting.value = false
      }
    } catch (error) {
      console.error('Failed to check export status', error)
      clearInterval(exportPollingInterval.value as number)
      exportPollingInterval.value = null
      
      ElMessage.error('检查导出状态失败')
      exporting.value = false
    }
  }, 1000)
}

// 格式化进度条文本
function progressFormat(percentage: number) {
  return percentage === 100 ? '完成' : `${percentage}%`
}
</script>

<style scoped>
.export-options {
  padding: 16px;
}

.export-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.export-progress {
  margin-top: 24px;
}

.permission-radio-item {
  margin-bottom: 12px;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}
</style>
