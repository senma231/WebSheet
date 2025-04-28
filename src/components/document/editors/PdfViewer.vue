<template>
  <div class="pdf-viewer">
    <div class="pdf-toolbar">
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="previousPage" :disabled="currentPage <= 1">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-button @click="nextPage" :disabled="currentPage >= totalPages">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
        
        <div class="page-info">
          <span>{{ currentPage }} / {{ totalPages }}</span>
        </div>
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="zoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button @click="zoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button @click="resetZoom">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-button-group>
        
        <el-select v-model="scale" placeholder="缩放" @change="handleScaleChange">
          <el-option label="50%" value="0.5" />
          <el-option label="75%" value="0.75" />
          <el-option label="100%" value="1" />
          <el-option label="125%" value="1.25" />
          <el-option label="150%" value="1.5" />
          <el-option label="200%" value="2" />
          <el-option label="适合页面" value="page-fit" />
          <el-option label="适合宽度" value="page-width" />
        </el-select>
      </div>
      
      <div class="toolbar-group" v-if="!readOnly">
        <el-button-group>
          <el-button :class="{ active: annotationMode === 'highlight' }" @click="setAnnotationMode('highlight')">
            <el-icon><Brush /></el-icon> 高亮
          </el-button>
          <el-button :class="{ active: annotationMode === 'underline' }" @click="setAnnotationMode('underline')">
            <el-icon><TextUnderline /></el-icon> 下划线
          </el-button>
          <el-button :class="{ active: annotationMode === 'strikethrough' }" @click="setAnnotationMode('strikethrough')">
            <el-icon><TextStrikethrough /></el-icon> 删除线
          </el-button>
          <el-button :class="{ active: annotationMode === 'comment' }" @click="setAnnotationMode('comment')">
            <el-icon><ChatDotRound /></el-icon> 评论
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-button @click="printPdf">
          <el-icon><Printer /></el-icon> 打印
        </el-button>
        <el-button @click="downloadPdf">
          <el-icon><Download /></el-icon> 下载
        </el-button>
      </div>
    </div>
    
    <div class="pdf-container" ref="pdfContainer">
      <div v-if="loading" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <el-empty description="加载PDF失败">
          <template #description>
            <p>{{ error }}</p>
          </template>
          <el-button @click="loadPdf">重试</el-button>
        </el-empty>
      </div>
      
      <div v-else class="pdf-content" ref="pdfContent">
        <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>
        
        <div class="annotation-layer" ref="annotationLayer"></div>
        
        <div class="text-layer" ref="textLayer"></div>
        
        <!-- 注释标记 -->
        <div v-for="(annotation, index) in annotations" :key="index" class="annotation-mark" :style="getAnnotationStyle(annotation)" @click="showAnnotationDetail(annotation)">
          <div v-if="annotation.type === 'comment'" class="comment-mark">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div v-else class="highlight-mark" :class="annotation.type"></div>
        </div>
      </div>
    </div>
    
    <!-- 注释详情对话框 -->
    <el-dialog v-model="showAnnotationDialog" title="注释详情" width="500px">
      <div v-if="selectedAnnotation">
        <div class="annotation-text">
          <p><strong>选中文本：</strong></p>
          <p class="selected-text">{{ selectedAnnotation.text }}</p>
        </div>
        
        <div class="annotation-comments">
          <p><strong>评论：</strong></p>
          <div v-for="(comment, index) in selectedAnnotation.comments" :key="index" class="comment-item">
            <div class="comment-header">
              <span class="comment-author">{{ comment.user.username }}</span>
              <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
        </div>
        
        <div class="add-comment" v-if="!readOnly">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="3"
            placeholder="添加评论..."
          />
          <div class="comment-actions">
            <el-button type="primary" @click="addComment" :disabled="!newComment">添加评论</el-button>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showAnnotationDialog = false">关闭</el-button>
        <el-button v-if="!readOnly && selectedAnnotation" type="danger" @click="deleteAnnotation">删除注释</el-button>
      </template>
    </el-dialog>
    
    <!-- 添加评论对话框 -->
    <el-dialog v-model="showAddCommentDialog" title="添加评论" width="500px">
      <div v-if="selectedText">
        <div class="annotation-text">
          <p><strong>选中文本：</strong></p>
          <p class="selected-text">{{ selectedText }}</p>
        </div>
        
        <div class="add-comment">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="3"
            placeholder="添加评论..."
          />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showAddCommentDialog = false">取消</el-button>
        <el-button type="primary" @click="saveComment" :disabled="!newComment">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, ArrowRight, ZoomIn, ZoomOut, FullScreen,
  Brush, TextUnderline, TextStrikethrough, ChatDotRound,
  Printer, Download, Loading
} from '@element-plus/icons-vue'
import * as pdfjsLib from 'pdfjs-dist'
import { formatDate as formatDateUtil } from '@/utils/date'
import { 
  getPdfAnnotations, 
  addPdfAnnotation, 
  updatePdfAnnotation, 
  deletePdfAnnotation,
  addAnnotationComment
} from '@/api/document'

// 设置PDF.js worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// 定义属性
const props = defineProps({
  documentId: {
    type: String,
    required: true
  },
  content: {
    type: Object,
    default: null
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  url: {
    type: String,
    default: ''
  }
})

// 定义事件
const emit = defineEmits(['change', 'cursor-change'])

// 状态
const pdfContainer = ref<HTMLElement | null>(null)
const pdfContent = ref<HTMLElement | null>(null)
const pdfCanvas = ref<HTMLCanvasElement | null>(null)
const textLayer = ref<HTMLElement | null>(null)
const annotationLayer = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const pdfDoc = ref<any>(null)
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref('1')
const annotations = ref<any[]>([])
const annotationMode = ref<'none' | 'highlight' | 'underline' | 'strikethrough' | 'comment'>('none')
const selectedText = ref('')
const selectedTextRange = ref<any>(null)
const showAnnotationDialog = ref(false)
const showAddCommentDialog = ref(false)
const selectedAnnotation = ref<any>(null)
const newComment = ref('')

// 监听URL变化
watch(() => props.url, () => {
  if (props.url) {
    loadPdf()
  }
}, { immediate: true })

// 监听页面变化
watch(currentPage, () => {
  renderPage()
})

// 监听缩放变化
watch(scale, () => {
  renderPage()
})

// 初始化
onMounted(() => {
  if (props.url) {
    loadPdf()
  }
  
  // 加载注释
  loadAnnotations()
})

// 加载PDF
async function loadPdf() {
  if (!props.url) return
  
  loading.value = true
  error.value = null
  
  try {
    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument(props.url)
    pdfDoc.value = await loadingTask.promise
    
    // 设置总页数
    totalPages.value = pdfDoc.value.numPages
    
    // 渲染第一页
    currentPage.value = 1
    await renderPage()
    
    loading.value = false
  } catch (err: any) {
    console.error('Failed to load PDF', err)
    error.value = err.message || '加载PDF失败'
    loading.value = false
  }
}

// 渲染页面
async function renderPage() {
  if (!pdfDoc.value || !pdfCanvas.value || !textLayer.value) return
  
  try {
    // 获取页面
    const page = await pdfDoc.value.getPage(currentPage.value)
    
    // 计算缩放
    let viewport
    if (scale.value === 'page-fit') {
      // 适合页面
      const containerWidth = pdfContainer.value?.clientWidth || 800
      const containerHeight = pdfContainer.value?.clientHeight || 600
      const pageAspectRatio = page.view[2] / page.view[3]
      const containerAspectRatio = containerWidth / containerHeight
      
      if (pageAspectRatio > containerAspectRatio) {
        // 宽度适配
        const scaleFactor = containerWidth / page.view[2]
        viewport = page.getViewport({ scale: scaleFactor * 0.95 })
      } else {
        // 高度适配
        const scaleFactor = containerHeight / page.view[3]
        viewport = page.getViewport({ scale: scaleFactor * 0.95 })
      }
    } else if (scale.value === 'page-width') {
      // 适合宽度
      const containerWidth = pdfContainer.value?.clientWidth || 800
      const scaleFactor = containerWidth / page.view[2]
      viewport = page.getViewport({ scale: scaleFactor * 0.95 })
    } else {
      // 固定缩放
      viewport = page.getViewport({ scale: parseFloat(scale.value) })
    }
    
    // 设置画布尺寸
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    // 渲染PDF
    const renderContext = {
      canvasContext: context!,
      viewport
    }
    
    await page.render(renderContext).promise
    
    // 渲染文本层
    const textContent = await page.getTextContent()
    textLayer.value.innerHTML = ''
    textLayer.value.style.width = `${viewport.width}px`
    textLayer.value.style.height = `${viewport.height}px`
    
    pdfjsLib.renderTextLayer({
      textContent,
      container: textLayer.value,
      viewport,
      textDivs: []
    })
    
    // 设置文本层事件
    setupTextLayerEvents()
    
  } catch (err) {
    console.error('Failed to render page', err)
    ElMessage.error('渲染页面失败')
  }
}

// 设置文本层事件
function setupTextLayerEvents() {
  if (!textLayer.value || props.readOnly) return
  
  // 监听选择事件
  textLayer.value.addEventListener('mouseup', handleTextSelection)
}

// 处理文本选择
function handleTextSelection() {
  if (annotationMode.value === 'none') return
  
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') return
  
  const range = selection.getRangeAt(0)
  const selectedStr = selection.toString().trim()
  
  // 保存选中的文本
  selectedText.value = selectedStr
  selectedTextRange.value = {
    startContainer: range.startContainer,
    startOffset: range.startOffset,
    endContainer: range.endContainer,
    endOffset: range.endOffset,
    rect: range.getBoundingClientRect()
  }
  
  // 如果是评论模式，显示添加评论对话框
  if (annotationMode.value === 'comment') {
    showAddCommentDialog.value = true
  } else {
    // 直接添加高亮、下划线或删除线
    saveAnnotation()
  }
}

// 保存注释
async function saveAnnotation() {
  if (!selectedText.value || !selectedTextRange.value) return
  
  try {
    // 计算注释位置
    const rect = selectedTextRange.value.rect
    const containerRect = pdfContent.value?.getBoundingClientRect() || { left: 0, top: 0 }
    
    const position = {
      page: currentPage.value,
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height
    }
    
    // 创建注释数据
    const annotationData = {
      document_id: props.documentId,
      type: annotationMode.value,
      text: selectedText.value,
      position,
      page: currentPage.value,
      comments: []
    }
    
    // 如果是评论模式且有评论内容，添加评论
    if (annotationMode.value === 'comment' && newComment.value) {
      annotationData.comments.push({
        content: newComment.value
      })
    }
    
    // 保存注释
    const response = await addPdfAnnotation(props.documentId, annotationData)
    
    // 添加到注释列表
    annotations.value.push(response.data)
    
    // 重置状态
    selectedText.value = ''
    selectedTextRange.value = null
    newComment.value = ''
    showAddCommentDialog.value = false
    
    // 触发变更事件
    emit('change', { annotations: annotations.value })
    
    ElMessage.success('注释已添加')
  } catch (error) {
    console.error('Failed to save annotation', error)
    ElMessage.error('添加注释失败')
  }
}

// 保存评论
async function saveComment() {
  if (!selectedText.value || !newComment.value) return
  
  // 调用保存注释方法
  await saveAnnotation()
}

// 加载注释
async function loadAnnotations() {
  try {
    const response = await getPdfAnnotations(props.documentId)
    annotations.value = response.data.items
  } catch (error) {
    console.error('Failed to load annotations', error)
    ElMessage.error('加载注释失败')
  }
}

// 获取注释样式
function getAnnotationStyle(annotation: any) {
  if (!annotation.position) return {}
  
  // 只显示当前页的注释
  if (annotation.page !== currentPage.value) {
    return { display: 'none' }
  }
  
  // 计算缩放后的位置
  const scaleValue = parseFloat(scale.value)
  
  return {
    left: `${annotation.position.x * scaleValue}px`,
    top: `${annotation.position.y * scaleValue}px`,
    width: `${annotation.position.width * scaleValue}px`,
    height: `${annotation.position.height * scaleValue}px`
  }
}

// 显示注释详情
function showAnnotationDetail(annotation: any) {
  selectedAnnotation.value = annotation
  showAnnotationDialog.value = true
}

// 添加评论
async function addComment() {
  if (!selectedAnnotation.value || !newComment.value) return
  
  try {
    const response = await addAnnotationComment(
      props.documentId,
      selectedAnnotation.value.id,
      { content: newComment.value }
    )
    
    // 更新注释
    if (!selectedAnnotation.value.comments) {
      selectedAnnotation.value.comments = []
    }
    
    selectedAnnotation.value.comments.push(response.data)
    
    // 更新注释列表
    const index = annotations.value.findIndex(a => a.id === selectedAnnotation.value.id)
    if (index !== -1) {
      annotations.value[index] = selectedAnnotation.value
    }
    
    // 重置评论输入
    newComment.value = ''
    
    // 触发变更事件
    emit('change', { annotations: annotations.value })
    
    ElMessage.success('评论已添加')
  } catch (error) {
    console.error('Failed to add comment', error)
    ElMessage.error('添加评论失败')
  }
}

// 删除注释
async function deleteAnnotation() {
  if (!selectedAnnotation.value) return
  
  try {
    await deletePdfAnnotation(props.documentId, selectedAnnotation.value.id)
    
    // 从列表中移除
    annotations.value = annotations.value.filter(a => a.id !== selectedAnnotation.value.id)
    
    // 关闭对话框
    showAnnotationDialog.value = false
    selectedAnnotation.value = null
    
    // 触发变更事件
    emit('change', { annotations: annotations.value })
    
    ElMessage.success('注释已删除')
  } catch (error) {
    console.error('Failed to delete annotation', error)
    ElMessage.error('删除注释失败')
  }
}

// 设置注释模式
function setAnnotationMode(mode: 'none' | 'highlight' | 'underline' | 'strikethrough' | 'comment') {
  annotationMode.value = annotationMode.value === mode ? 'none' : mode
}

// 上一页
function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// 下一页
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// 放大
function zoomIn() {
  const currentScale = parseFloat(scale.value)
  if (currentScale < 3) {
    scale.value = (currentScale + 0.25).toString()
  }
}

// 缩小
function zoomOut() {
  const currentScale = parseFloat(scale.value)
  if (currentScale > 0.25) {
    scale.value = (currentScale - 0.25).toString()
  }
}

// 重置缩放
function resetZoom() {
  scale.value = '1'
}

// 处理缩放变化
function handleScaleChange() {
  renderPage()
}

// 打印PDF
function printPdf() {
  if (props.url) {
    const printWindow = window.open(props.url)
    printWindow?.addEventListener('load', () => {
      printWindow.print()
    })
  }
}

// 下载PDF
function downloadPdf() {
  if (props.url) {
    const link = document.createElement('a')
    link.href = props.url
    link.download = `document-${props.documentId}.pdf`
    link.click()
  }
}

// 格式化日期
function formatDate(dateString: string) {
  return formatDateUtil(dateString)
}

// 获取内容
function getContent() {
  return {
    annotations: annotations.value
  }
}

// 应用远程更改
function applyRemoteChanges(content: any, user: any) {
  if (!content) return
  
  try {
    if (content.annotations) {
      annotations.value = content.annotations
    }
  } catch (error) {
    console.error('Failed to apply remote changes', error)
    ElMessage.error('应用远程更改失败')
  }
}

// 跳转到光标位置
function jumpToCursor(cursor: any) {
  // PDF查看器不支持光标跳转
}

// 应用解决的冲突
function applyResolvedConflict(operation: any) {
  if (!operation) return
  
  // 应用操作
  if (operation.type === 'content_change' && operation.data.content) {
    applyRemoteChanges(operation.data.content, null)
  }
}

// 暴露方法
defineExpose({
  getContent,
  applyRemoteChanges,
  jumpToCursor,
  applyResolvedConflict
})

// 组件卸载前清理
onBeforeUnmount(() => {
  if (textLayer.value) {
    textLayer.value.removeEventListener('mouseup', handleTextSelection)
  }
})
</script>

<style scoped>
.pdf-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pdf-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f5f7fa;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-info {
  margin: 0 8px;
  font-size: 14px;
}

.pdf-container {
  flex: 1;
  overflow: auto;
  position: relative;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.loading-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.pdf-content {
  position: relative;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: white;
}

.pdf-canvas {
  display: block;
}

.text-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1.0;
}

.text-layer > span {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

.annotation-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.annotation-mark {
  position: absolute;
  cursor: pointer;
  z-index: 10;
}

.highlight-mark {
  background-color: rgba(255, 255, 0, 0.3);
  border-radius: 2px;
}

.highlight-mark.underline {
  background-color: transparent;
  border-bottom: 2px solid rgba(0, 0, 255, 0.5);
}

.highlight-mark.strikethrough {
  background-color: transparent;
  text-decoration: line-through;
  text-decoration-color: rgba(255, 0, 0, 0.5);
  text-decoration-thickness: 2px;
}

.comment-mark {
  position: absolute;
  top: -20px;
  right: -10px;
  width: 24px;
  height: 24px;
  background-color: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.annotation-text {
  margin-bottom: 16px;
}

.selected-text {
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.annotation-comments {
  margin-bottom: 16px;
}

.comment-item {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.comment-author {
  font-weight: bold;
}

.comment-time {
  color: #909399;
}

.comment-content {
  font-size: 14px;
}

.add-comment {
  margin-top: 16px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.active {
  color: #409eff;
  background-color: #ecf5ff;
}
</style>
