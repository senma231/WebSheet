<template>
  <div class="text-editor">
    <div class="editor-toolbar" v-if="!readOnly">
      <div class="toolbar-group">
        <el-select v-model="formats.header" placeholder="段落格式" @change="formatHeader">
          <el-option label="正文" :value="null" />
          <el-option label="标题1" :value="1" />
          <el-option label="标题2" :value="2" />
          <el-option label="标题3" :value="3" />
          <el-option label="标题4" :value="4" />
        </el-select>
      </div>
      
      <div class="toolbar-group">
        <el-select v-model="formats.font" placeholder="字体" @change="formatFont">
          <el-option label="默认" value="sans-serif" />
          <el-option label="宋体" value="SimSun" />
          <el-option label="黑体" value="SimHei" />
          <el-option label="微软雅黑" value="Microsoft YaHei" />
          <el-option label="Arial" value="Arial" />
          <el-option label="Times New Roman" value="Times New Roman" />
        </el-select>
        
        <el-select v-model="formats.size" placeholder="字号" @change="formatSize">
          <el-option label="12px" value="12px" />
          <el-option label="14px" value="14px" />
          <el-option label="16px" value="16px" />
          <el-option label="18px" value="18px" />
          <el-option label="20px" value="20px" />
          <el-option label="24px" value="24px" />
          <el-option label="36px" value="36px" />
        </el-select>
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button :class="{ active: formats.bold }" @click="formatText('bold')">
            <el-icon><Bold /></el-icon>
          </el-button>
          <el-button :class="{ active: formats.italic }" @click="formatText('italic')">
            <el-icon><Italic /></el-icon>
          </el-button>
          <el-button :class="{ active: formats.underline }" @click="formatText('underline')">
            <el-icon><TextUnderline /></el-icon>
          </el-button>
          <el-button :class="{ active: formats.strike }" @click="formatText('strike')">
            <el-icon><TextStrikethrough /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button :class="{ active: formats.align === 'left' }" @click="formatAlign('left')">
            <el-icon><AlignLeft /></el-icon>
          </el-button>
          <el-button :class="{ active: formats.align === 'center' }" @click="formatAlign('center')">
            <el-icon><AlignCenter /></el-icon>
          </el-button>
          <el-button :class="{ active: formats.align === 'right' }" @click="formatAlign('right')">
            <el-icon><AlignRight /></el-icon>
          </el-button>
          <el-button :class="{ active: formats.align === 'justify' }" @click="formatAlign('justify')">
            <el-icon><AlignJustify /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button :class="{ active: formats.list === 'ordered' }" @click="formatList('ordered')">
            <el-icon><ListNumbers /></el-icon>
          </el-button>
          <el-button :class="{ active: formats.list === 'bullet' }" @click="formatList('bullet')">
            <el-icon><List /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-color-picker v-model="formats.color" size="small" @change="formatColor" />
        <el-color-picker v-model="formats.background" size="small" @change="formatBackground" />
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="insertLink">
            <el-icon><Link /></el-icon>
          </el-button>
          <el-button @click="insertImage">
            <el-icon><Picture /></el-icon>
          </el-button>
          <el-button @click="insertTable">
            <el-icon><Grid /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>
    
    <div class="editor-container">
      <div ref="editorRef" class="editor-content"></div>
    </div>
    
    <!-- 链接对话框 -->
    <el-dialog v-model="showLinkDialog" title="插入链接" width="500px">
      <el-form :model="linkForm" label-width="80px">
        <el-form-item label="文本">
          <el-input v-model="linkForm.text" placeholder="链接文本" />
        </el-form-item>
        <el-form-item label="URL">
          <el-input v-model="linkForm.url" placeholder="https://example.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLinkDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmInsertLink">确认</el-button>
      </template>
    </el-dialog>
    
    <!-- 图片对话框 -->
    <el-dialog v-model="showImageDialog" title="插入图片" width="500px">
      <el-form :model="imageForm" label-width="80px">
        <el-form-item label="URL">
          <el-input v-model="imageForm.url" placeholder="https://example.com/image.jpg" />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="#"
            :auto-upload="false"
            :on-change="handleImageUpload"
            :limit="1"
          >
            <el-button type="primary">选择图片</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showImageDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmInsertImage">确认</el-button>
      </template>
    </el-dialog>
    
    <!-- 表格对话框 -->
    <el-dialog v-model="showTableDialog" title="插入表格" width="500px">
      <el-form :model="tableForm" label-width="80px">
        <el-form-item label="行数">
          <el-input-number v-model="tableForm.rows" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="列数">
          <el-input-number v-model="tableForm.cols" :min="1" :max="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTableDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmInsertTable">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Bold, Italic, TextUnderline, TextStrikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List as ListIcon, ListNumbers, Link, Picture, Grid
} from '@element-plus/icons-vue'
import Quill from 'quill'
import Delta from 'quill-delta'
import 'quill/dist/quill.snow.css'
import { uploadImage } from '@/api/document'

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
  }
})

// 定义事件
const emit = defineEmits(['change', 'cursor-change'])

// 状态
const editorRef = ref<HTMLElement | null>(null)
const quill = ref<any>(null)
const isInitialized = ref(false)
const formats = ref({
  header: null,
  font: 'sans-serif',
  size: '14px',
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  color: '#000000',
  background: '#ffffff',
  align: 'left',
  list: null
})

// 对话框状态
const showLinkDialog = ref(false)
const linkForm = ref({ text: '', url: '' })
const showImageDialog = ref(false)
const imageForm = ref({ url: '', file: null as File | null })
const showTableDialog = ref(false)
const tableForm = ref({ rows: 3, cols: 3 })

// 初始化编辑器
onMounted(async () => {
  await initQuill()
  
  // 如果有内容，加载内容
  if (props.content) {
    loadContent()
  }
})

// 监听内容变化
watch(() => props.content, () => {
  if (props.content && isInitialized.value) {
    loadContent()
  }
}, { deep: true })

// 监听只读状态变化
watch(() => props.readOnly, () => {
  if (quill.value) {
    quill.value.enable(!props.readOnly)
  }
})

// 初始化Quill编辑器
async function initQuill() {
  if (!editorRef.value) return
  
  // 定义自定义格式
  const fontSizeStyle = Quill.import('attributors/style/size')
  fontSizeStyle.whitelist = ['12px', '14px', '16px', '18px', '20px', '24px', '36px']
  Quill.register(fontSizeStyle, true)
  
  const fontFamilyStyle = Quill.import('attributors/style/font')
  fontFamilyStyle.whitelist = [
    'sans-serif', 'SimSun', 'SimHei', 'Microsoft YaHei', 
    'Arial', 'Times New Roman'
  ]
  Quill.register(fontFamilyStyle, true)
  
  // 创建Quill实例
  quill.value = new Quill(editorRef.value, {
    modules: {
      toolbar: false,
      history: {
        delay: 1000,
        maxStack: 500,
        userOnly: true
      }
    },
    placeholder: '开始编辑文档...',
    readOnly: props.readOnly,
    theme: 'snow'
  })
  
  // 监听文本变化
  quill.value.on('text-change', (delta: any, oldDelta: any, source: string) => {
    if (source === 'user') {
      const content = quill.value.getContents()
      emit('change', content)
    }
  })
  
  // 监听选择变化
  quill.value.on('selection-change', (range: any, oldRange: any, source: string) => {
    if (range) {
      // 更新格式状态
      updateFormatState()
      
      // 发送光标位置
      const bounds = quill.value.getBounds(range.index)
      emit('cursor-change', {
        x: bounds.left,
        y: bounds.top,
        selection: range
      })
    }
  })
  
  isInitialized.value = true
}

// 加载内容
function loadContent() {
  if (!quill.value || !props.content) return
  
  try {
    // 设置内容
    quill.value.setContents(props.content)
  } catch (error) {
    console.error('Failed to load content', error)
    ElMessage.error('加载文档内容失败')
  }
}

// 更新格式状态
function updateFormatState() {
  if (!quill.value) return
  
  const format = quill.value.getFormat()
  
  formats.value = {
    header: format.header || null,
    font: format.font || 'sans-serif',
    size: format.size || '14px',
    bold: !!format.bold,
    italic: !!format.italic,
    underline: !!format.underline,
    strike: !!format.strike,
    color: format.color || '#000000',
    background: format.background || '#ffffff',
    align: format.align || 'left',
    list: format.list || null
  }
}

// 格式化文本
function formatText(format: string) {
  if (!quill.value) return
  
  const value = !formats.value[format as keyof typeof formats.value]
  quill.value.format(format, value)
  formats.value[format as keyof typeof formats.value] = value
}

// 格式化标题
function formatHeader(value: number | null) {
  if (!quill.value) return
  
  quill.value.format('header', value)
}

// 格式化字体
function formatFont(value: string) {
  if (!quill.value) return
  
  quill.value.format('font', value)
}

// 格式化字号
function formatSize(value: string) {
  if (!quill.value) return
  
  quill.value.format('size', value)
}

// 格式化对齐方式
function formatAlign(value: string) {
  if (!quill.value) return
  
  quill.value.format('align', value)
}

// 格式化列表
function formatList(value: string) {
  if (!quill.value) return
  
  const currentValue = formats.value.list
  quill.value.format('list', currentValue === value ? false : value)
  updateFormatState()
}

// 格式化颜色
function formatColor(value: string) {
  if (!quill.value) return
  
  quill.value.format('color', value)
}

// 格式化背景色
function formatBackground(value: string) {
  if (!quill.value) return
  
  quill.value.format('background', value)
}

// 插入链接
function insertLink() {
  const selection = quill.value?.getSelection()
  if (!selection) return
  
  const text = quill.value?.getText(selection.index, selection.length) || ''
  linkForm.value = { text, url: '' }
  showLinkDialog.value = true
}

// 确认插入链接
function confirmInsertLink() {
  if (!quill.value) return
  
  const selection = quill.value.getSelection()
  if (!selection) return
  
  if (linkForm.value.url) {
    if (selection.length > 0) {
      quill.value.deleteText(selection.index, selection.length)
    }
    
    quill.value.insertText(selection.index, linkForm.value.text || linkForm.value.url, {
      link: linkForm.value.url
    })
    
    quill.value.setSelection(selection.index + (linkForm.value.text || linkForm.value.url).length, 0)
  }
  
  showLinkDialog.value = false
}

// 插入图片
function insertImage() {
  imageForm.value = { url: '', file: null }
  showImageDialog.value = true
}

// 处理图片上传
function handleImageUpload(file: any) {
  imageForm.value.file = file.raw
}

// 确认插入图片
async function confirmInsertImage() {
  if (!quill.value) return
  
  try {
    let imageUrl = imageForm.value.url
    
    // 如果有文件，上传文件
    if (imageForm.value.file) {
      const formData = new FormData()
      formData.append('file', imageForm.value.file)
      
      const response = await uploadImage(props.documentId, formData)
      imageUrl = response.data.url
    }
    
    if (imageUrl) {
      const selection = quill.value.getSelection() || { index: quill.value.getLength() - 1, length: 0 }
      quill.value.insertEmbed(selection.index, 'image', imageUrl)
      quill.value.setSelection(selection.index + 1, 0)
    }
  } catch (error) {
    console.error('Failed to upload image', error)
    ElMessage.error('上传图片失败')
  }
  
  showImageDialog.value = false
}

// 插入表格
function insertTable() {
  tableForm.value = { rows: 3, cols: 3 }
  showTableDialog.value = true
}

// 确认插入表格
function confirmInsertTable() {
  if (!quill.value) return
  
  const selection = quill.value.getSelection() || { index: quill.value.getLength() - 1, length: 0 }
  const rows = tableForm.value.rows
  const cols = tableForm.value.cols
  
  // 创建表格HTML
  let tableHTML = '<table><tbody>'
  for (let i = 0; i < rows; i++) {
    tableHTML += '<tr>'
    for (let j = 0; j < cols; j++) {
      tableHTML += '<td style="border: 1px solid #ccc; padding: 5px; min-width: 50px;"></td>'
    }
    tableHTML += '</tr>'
  }
  tableHTML += '</tbody></table>'
  
  // 插入表格
  quill.value.clipboard.dangerouslyPasteHTML(selection.index, tableHTML)
  quill.value.setSelection(selection.index + 1, 0)
  
  showTableDialog.value = false
}

// 获取内容
function getContent() {
  return quill.value?.getContents()
}

// 应用远程更改
function applyRemoteChanges(content: any, user: any) {
  if (!quill.value || !content) return
  
  // 保存当前选择
  const selection = quill.value.getSelection()
  
  // 应用更改
  quill.value.updateContents(content)
  
  // 恢复选择
  if (selection) {
    quill.value.setSelection(selection)
  }
}

// 跳转到光标位置
function jumpToCursor(cursor: any) {
  if (!quill.value || !cursor) return
  
  // 滚动到光标位置
  if (cursor.selection) {
    quill.value.setSelection(cursor.selection.index, 0)
  }
}

// 应用解决的冲突
function applyResolvedConflict(operation: any) {
  if (!quill.value || !operation) return
  
  // 应用操作
  if (operation.type === 'content_change' && operation.data.content) {
    quill.value.setContents(operation.data.content)
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
  if (quill.value) {
    quill.value.off('text-change')
    quill.value.off('selection-change')
  }
})
</script>

<style scoped>
.text-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-toolbar {
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

.editor-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background-color: #fff;
}

.editor-content {
  min-height: 100%;
  font-size: 14px;
}

:deep(.ql-editor) {
  padding: 20px;
  min-height: 100%;
}

:deep(.ql-editor p) {
  margin-bottom: 10px;
}

:deep(.ql-editor h1),
:deep(.ql-editor h2),
:deep(.ql-editor h3),
:deep(.ql-editor h4) {
  margin-top: 20px;
  margin-bottom: 10px;
}

:deep(.ql-editor table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 10px;
}

:deep(.ql-editor table td) {
  border: 1px solid #ccc;
  padding: 5px;
  min-width: 50px;
}

.active {
  color: #409eff;
  background-color: #ecf5ff;
}
</style>
