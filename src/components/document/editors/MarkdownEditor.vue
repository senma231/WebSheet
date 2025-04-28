<template>
  <div class="markdown-editor">
    <div class="editor-toolbar" v-if="!readOnly">
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="insertMarkdown('heading', 1)" title="标题1">
            <span class="toolbar-text">H1</span>
          </el-button>
          <el-button @click="insertMarkdown('heading', 2)" title="标题2">
            <span class="toolbar-text">H2</span>
          </el-button>
          <el-button @click="insertMarkdown('heading', 3)" title="标题3">
            <span class="toolbar-text">H3</span>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="insertMarkdown('bold')" title="加粗">
            <el-icon><Bold /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('italic')" title="斜体">
            <el-icon><Italic /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('strikethrough')" title="删除线">
            <el-icon><TextStrikethrough /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="insertMarkdown('list', 'unordered')" title="无序列表">
            <el-icon><List /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('list', 'ordered')" title="有序列表">
            <el-icon><ListNumbers /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('list', 'task')" title="任务列表">
            <el-icon><Check /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="insertMarkdown('link')" title="链接">
            <el-icon><Link /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('image')" title="图片">
            <el-icon><Picture /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('code')" title="代码">
            <el-icon><Terminal /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('codeblock')" title="代码块">
            <el-icon><Document /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="insertMarkdown('quote')" title="引用">
            <el-icon><ChatDotRound /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('table')" title="表格">
            <el-icon><Grid /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('hr')" title="分隔线">
            <el-icon><Minus /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-switch
          v-model="previewMode"
          active-text="预览"
          inactive-text="编辑"
          inline-prompt
        />
      </div>
    </div>
    
    <div class="editor-container" :class="{ 'preview-mode': previewMode }">
      <div v-show="!previewMode || !readOnly" class="editor-content">
        <textarea
          ref="editorRef"
          v-model="markdownContent"
          :placeholder="readOnly ? '' : '开始编辑Markdown文档...'"
          :readonly="readOnly"
          @input="handleInput"
          @keydown="handleKeydown"
          @scroll="handleScroll"
          @select="handleSelect"
        ></textarea>
      </div>
      
      <div v-show="previewMode || readOnly" class="preview-content" ref="previewRef">
        <div v-html="renderedContent"></div>
      </div>
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
        <el-form-item label="替代文本">
          <el-input v-model="imageForm.alt" placeholder="图片描述" />
        </el-form-item>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Bold, Italic, TextStrikethrough, List, ListNumbers, Check,
  Link, Picture, Terminal, Document, ChatDotRound, Grid, Minus
} from '@element-plus/icons-vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { uploadImage } from '@/api/document'

// 配置marked
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
  gfm: true,
  breaks: true,
  sanitize: false
});

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
const editorRef = ref<HTMLTextAreaElement | null>(null)
const previewRef = ref<HTMLElement | null>(null)
const markdownContent = ref('')
const previewMode = ref(false)
const selection = ref({ start: 0, end: 0 })
const scrollSync = ref(true)

// 对话框状态
const showLinkDialog = ref(false)
const linkForm = ref({ text: '', url: '' })
const showImageDialog = ref(false)
const imageForm = ref({ alt: '', url: '', file: null as File | null })

// 计算属性
const renderedContent = computed(() => {
  return marked(markdownContent.value)
})

// 监听内容变化
watch(() => props.content, () => {
  if (props.content) {
    loadContent()
  }
}, { deep: true })

// 监听只读状态变化
watch(() => props.readOnly, (newValue) => {
  if (newValue) {
    previewMode.value = true
  }
})

// 初始化编辑器
onMounted(() => {
  // 如果有内容，加载内容
  if (props.content) {
    loadContent()
  }
  
  // 如果是只读模式，默认显示预览
  if (props.readOnly) {
    previewMode.value = true
  }
})

// 加载内容
function loadContent() {
  if (!props.content) return
  
  try {
    if (typeof props.content === 'string') {
      markdownContent.value = props.content
    } else if (props.content.text) {
      markdownContent.value = props.content.text
    } else {
      markdownContent.value = JSON.stringify(props.content)
    }
  } catch (error) {
    console.error('Failed to load content', error)
    ElMessage.error('加载文档内容失败')
  }
}

// 处理输入
function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  markdownContent.value = target.value
  
  // 保存选择位置
  selection.value = {
    start: target.selectionStart,
    end: target.selectionEnd
  }
  
  // 触发变更事件
  emit('change', { text: markdownContent.value })
}

// 处理按键
function handleKeydown(event: KeyboardEvent) {
  // Tab键处理
  if (event.key === 'Tab') {
    event.preventDefault()
    
    const target = event.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd
    
    // 插入制表符
    const newValue = markdownContent.value.substring(0, start) + '    ' + markdownContent.value.substring(end)
    markdownContent.value = newValue
    
    // 设置光标位置
    nextTick(() => {
      target.selectionStart = target.selectionEnd = start + 4
      
      // 保存选择位置
      selection.value = {
        start: target.selectionStart,
        end: target.selectionEnd
      }
      
      // 触发变更事件
      emit('change', { text: markdownContent.value })
    })
  }
}

// 处理滚动同步
function handleScroll(event: Event) {
  if (!scrollSync.value || !previewRef.value) return
  
  const target = event.target as HTMLTextAreaElement
  const percentage = target.scrollTop / (target.scrollHeight - target.clientHeight)
  const previewScrollTop = percentage * (previewRef.value.scrollHeight - previewRef.value.clientHeight)
  
  previewRef.value.scrollTop = previewScrollTop
}

// 处理选择
function handleSelect(event: Event) {
  const target = event.target as HTMLTextAreaElement
  
  // 保存选择位置
  selection.value = {
    start: target.selectionStart,
    end: target.selectionEnd
  }
  
  // 发送光标位置
  emit('cursor-change', {
    selection: selection.value
  })
}

// 插入Markdown语法
function insertMarkdown(type: string, subType?: any) {
  if (!editorRef.value) return
  
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = markdownContent.value.substring(start, end)
  
  let insertText = ''
  
  switch (type) {
    case 'heading':
      const level = subType || 1
      const prefix = '#'.repeat(level) + ' '
      insertText = prefix + selectedText
      break
      
    case 'bold':
      insertText = `**${selectedText || '粗体文本'}**`
      break
      
    case 'italic':
      insertText = `*${selectedText || '斜体文本'}*`
      break
      
    case 'strikethrough':
      insertText = `~~${selectedText || '删除线文本'}~~`
      break
      
    case 'list':
      if (subType === 'unordered') {
        if (selectedText) {
          insertText = selectedText.split('\n').map(line => `- ${line}`).join('\n')
        } else {
          insertText = '- 列表项\n- 列表项\n- 列表项'
        }
      } else if (subType === 'ordered') {
        if (selectedText) {
          insertText = selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n')
        } else {
          insertText = '1. 列表项\n2. 列表项\n3. 列表项'
        }
      } else if (subType === 'task') {
        if (selectedText) {
          insertText = selectedText.split('\n').map(line => `- [ ] ${line}`).join('\n')
        } else {
          insertText = '- [ ] 任务\n- [ ] 任务\n- [x] 已完成任务'
        }
      }
      break
      
    case 'link':
      if (selectedText) {
        linkForm.value = { text: selectedText, url: '' }
      } else {
        linkForm.value = { text: '链接文本', url: 'https://' }
      }
      showLinkDialog.value = true
      return
      
    case 'image':
      if (selectedText) {
        imageForm.value = { alt: selectedText, url: '', file: null }
      } else {
        imageForm.value = { alt: '图片描述', url: '', file: null }
      }
      showImageDialog.value = true
      return
      
    case 'code':
      insertText = `\`${selectedText || '代码'}\``
      break
      
    case 'codeblock':
      insertText = `\`\`\`\n${selectedText || '// 代码块'}\n\`\`\``
      break
      
    case 'quote':
      if (selectedText) {
        insertText = selectedText.split('\n').map(line => `> ${line}`).join('\n')
      } else {
        insertText = '> 引用文本'
      }
      break
      
    case 'table':
      insertText = `| 标题1 | 标题2 | 标题3 |\n| --- | --- | --- |\n| 单元格1 | 单元格2 | 单元格3 |\n| 单元格4 | 单元格5 | 单元格6 |`
      break
      
    case 'hr':
      insertText = '\n---\n'
      break
  }
  
  // 插入文本
  const newValue = markdownContent.value.substring(0, start) + insertText + markdownContent.value.substring(end)
  markdownContent.value = newValue
  
  // 设置光标位置
  nextTick(() => {
    textarea.focus()
    
    if (type === 'link' || type === 'image') {
      // 这些类型在对话框中处理
      return
    }
    
    // 设置新的选择范围
    const newCursorPos = start + insertText.length
    textarea.selectionStart = textarea.selectionEnd = newCursorPos
    
    // 保存选择位置
    selection.value = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd
    }
    
    // 触发变更事件
    emit('change', { text: markdownContent.value })
  })
}

// 确认插入链接
function confirmInsertLink() {
  if (!editorRef.value) return
  
  const textarea = editorRef.value
  const start = selection.value.start
  const end = selection.value.end
  
  // 创建Markdown链接
  const linkMarkdown = `[${linkForm.value.text}](${linkForm.value.url})`
  
  // 插入链接
  const newValue = markdownContent.value.substring(0, start) + linkMarkdown + markdownContent.value.substring(end)
  markdownContent.value = newValue
  
  // 设置光标位置
  nextTick(() => {
    textarea.focus()
    const newCursorPos = start + linkMarkdown.length
    textarea.selectionStart = textarea.selectionEnd = newCursorPos
    
    // 保存选择位置
    selection.value = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd
    }
    
    // 触发变更事件
    emit('change', { text: markdownContent.value })
  })
  
  // 关闭对话框
  showLinkDialog.value = false
}

// 处理图片上传
function handleImageUpload(file: any) {
  imageForm.value.file = file.raw
}

// 确认插入图片
async function confirmInsertImage() {
  if (!editorRef.value) return
  
  try {
    let imageUrl = imageForm.value.url
    
    // 如果有文件，上传文件
    if (imageForm.value.file) {
      const formData = new FormData()
      formData.append('file', imageForm.value.file)
      
      const response = await uploadImage(props.documentId, formData)
      imageUrl = response.data.url
    }
    
    if (!imageUrl) {
      ElMessage.warning('请提供图片URL或上传图片')
      return
    }
    
    const textarea = editorRef.value
    const start = selection.value.start
    const end = selection.value.end
    
    // 创建Markdown图片
    const imageMarkdown = `![${imageForm.value.alt}](${imageUrl})`
    
    // 插入图片
    const newValue = markdownContent.value.substring(0, start) + imageMarkdown + markdownContent.value.substring(end)
    markdownContent.value = newValue
    
    // 设置光标位置
    nextTick(() => {
      textarea.focus()
      const newCursorPos = start + imageMarkdown.length
      textarea.selectionStart = textarea.selectionEnd = newCursorPos
      
      // 保存选择位置
      selection.value = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd
      }
      
      // 触发变更事件
      emit('change', { text: markdownContent.value })
    })
    
    // 关闭对话框
    showImageDialog.value = false
  } catch (error) {
    console.error('Failed to upload image', error)
    ElMessage.error('上传图片失败')
  }
}

// 获取内容
function getContent() {
  return { text: markdownContent.value }
}

// 应用远程更改
function applyRemoteChanges(content: any, user: any) {
  if (!content) return
  
  try {
    if (typeof content === 'string') {
      markdownContent.value = content
    } else if (content.text) {
      markdownContent.value = content.text
    } else {
      markdownContent.value = JSON.stringify(content)
    }
  } catch (error) {
    console.error('Failed to apply remote changes', error)
    ElMessage.error('应用远程更改失败')
  }
}

// 跳转到光标位置
function jumpToCursor(cursor: any) {
  if (!editorRef.value || !cursor || !cursor.selection) return
  
  // 设置光标位置
  editorRef.value.focus()
  editorRef.value.selectionStart = cursor.selection.start
  editorRef.value.selectionEnd = cursor.selection.end
  
  // 滚动到光标位置
  const lineHeight = 20 // 估计的行高
  const lines = markdownContent.value.substring(0, cursor.selection.start).split('\n').length
  const scrollPosition = lines * lineHeight
  
  editorRef.value.scrollTop = scrollPosition - editorRef.value.clientHeight / 2
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
</script>

<style scoped>
.markdown-editor {
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

.toolbar-text {
  font-weight: bold;
  font-size: 14px;
}

.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-container.preview-mode .editor-content {
  display: none;
}

.editor-container.preview-mode .preview-content {
  flex: 1;
}

.editor-content {
  flex: 1;
  overflow: auto;
}

.editor-content textarea {
  width: 100%;
  height: 100%;
  padding: 20px;
  border: none;
  resize: none;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
}

.preview-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background-color: #fff;
}

/* Markdown 样式 */
.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3),
.preview-content :deep(h4),
.preview-content :deep(h5),
.preview-content :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.preview-content :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.preview-content :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.preview-content :deep(h3) {
  font-size: 1.25em;
}

.preview-content :deep(h4) {
  font-size: 1em;
}

.preview-content :deep(p) {
  margin-top: 0;
  margin-bottom: 16px;
}

.preview-content :deep(blockquote) {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 0 0 16px 0;
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.preview-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.preview-content :deep(table th),
.preview-content :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.preview-content :deep(table tr) {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.preview-content :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

.preview-content :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.preview-content :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
  margin-bottom: 16px;
}

.preview-content :deep(pre code) {
  padding: 0;
  margin: 0;
  background-color: transparent;
  border: 0;
  word-break: normal;
  white-space: pre;
}

.preview-content :deep(img) {
  max-width: 100%;
  box-sizing: content-box;
}

.preview-content :deep(hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #e1e4e8;
  border: 0;
}

.preview-content :deep(input[type="checkbox"]) {
  margin-right: 0.5em;
}
</style>
