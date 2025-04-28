<template>
  <div class="document-edit-container">
    <div class="document-header">
      <div class="header-left">
        <el-button :icon="Back" @click="goBack">返回</el-button>
        <div class="document-title">
          <h3 v-if="!isEditingTitle" @click="startEditTitle">
            {{ document?.title || '无标题文档' }}
            <el-icon><Edit /></el-icon>
          </h3>
          <el-input
            v-else
            v-model="editingTitle"
            size="small"
            @blur="saveTitle"
            @keyup.enter="saveTitle"
            ref="titleInputRef"
          />
        </div>
      </div>

      <div class="header-right">
        <div class="collaborators" @click="showCollaborationPanel = true">
          <el-avatar
            v-for="user in onlineUsers"
            :key="user.id"
            :size="32"
            :src="user.avatar"
            :title="getUserTitle(user)"
            :class="['user-avatar', { 'user-editing': user.status === 'editing', 'user-idle': user.status === 'idle' }]"
          >
            {{ user.initials }}
          </el-avatar>
          <el-button v-if="onlineUsers.length > 0" size="small" circle :icon="ArrowRight" class="show-panel-button" />
        </div>

        <el-dropdown trigger="click" @command="handleCommand">
          <el-button>
            更多操作
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="share">分享</el-dropdown-item>
              <el-dropdown-item command="permissions">权限管理</el-dropdown-item>
              <el-dropdown-item command="comments">评论</el-dropdown-item>
              <el-dropdown-item command="history">历史版本</el-dropdown-item>
              <el-dropdown-item command="download">下载</el-dropdown-item>
              <el-dropdown-item command="print">打印</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button type="primary" @click="saveDocument">保存</el-button>
      </div>
    </div>

    <div class="document-content">
      <div v-if="isLoading" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="loadError" class="error-container">
        <el-empty description="加载文档失败">
          <template #description>
            <p>{{ loadError }}</p>
          </template>
          <el-button @click="loadDocument">重试</el-button>
        </el-empty>
      </div>

      <div v-else class="editor-container">
        <!-- Word文档编辑器 -->
        <div v-if="document?.type === 'WORD'" class="word-editor">
          <vue-office-docx
            v-if="documentUrl"
            :src="documentUrl"
            @rendered="handleDocRendered"
          />
        </div>

        <!-- Excel表格编辑器 -->
        <div v-else-if="document?.type === 'EXCEL'" class="excel-editor">
          <vue-office-xlsx
            v-if="documentUrl"
            :src="documentUrl"
            @rendered="handleDocRendered"
          />
        </div>

        <!-- PPT演示文稿编辑器 -->
        <div v-else-if="document?.type === 'PPT'" class="ppt-editor">
          <vue-office-pptx
            v-if="documentUrl"
            :src="documentUrl"
            @rendered="handleDocRendered"
          />
        </div>

        <!-- PDF查看器 -->
        <div v-else-if="document?.type === 'PDF'" class="pdf-viewer">
          <vue-office-pdf
            v-if="documentUrl"
            :src="documentUrl"
            @rendered="handleDocRendered"
          />
        </div>

        <!-- Markdown编辑器 -->
        <div v-else-if="document?.type === 'MARKDOWN'" class="markdown-editor">
          <div class="markdown-toolbar">
            <el-button-group>
              <el-button :icon="Bold" title="加粗" @click="applyMarkdown('**', '**')" />
              <el-button :icon="Italic" title="斜体" @click="applyMarkdown('*', '*')" />
              <el-button :icon="List" title="无序列表" @click="applyMarkdown('- ', '')" />
              <el-button :icon="Tickets" title="有序列表" @click="applyMarkdown('1. ', '')" />
              <el-button :icon="Link" title="链接" @click="applyMarkdown('[', '](url)')" />
              <el-button :icon="PictureFilled" title="图片" @click="applyMarkdown('![alt](', ')')" />
              <el-button :icon="Headings" title="标题" @click="applyMarkdown('# ', '')" />
              <el-button :icon="Memo" title="引用" @click="applyMarkdown('> ', '')" />
              <el-button :icon="Histogram" title="代码块" @click="applyMarkdown('```\n', '\n```')" />
            </el-button-group>
          </div>

          <div class="markdown-content">
            <el-input
              v-model="markdownContent"
              type="textarea"
              :rows="20"
              resize="none"
              @input="handleMarkdownChange"
              ref="markdownEditorRef"
            />

            <div class="markdown-preview" v-html="markdownPreview"></div>
          </div>
        </div>

        <!-- 默认编辑器 -->
        <div v-else class="default-editor">
          <el-empty description="不支持的文档类型" />
        </div>
      </div>
    </div>

    <!-- 历史版本对话框 -->
    <el-dialog
      v-model="showHistoryDialog"
      title="历史版本"
      width="600px"
    >
      <div v-if="isLoadingVersions" class="loading-versions">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <el-empty v-else-if="documentVersions.length === 0" description="没有历史版本" />

      <el-timeline v-else>
        <el-timeline-item
          v-for="version in documentVersions"
          :key="version.id"
          :timestamp="formatDate(version.created_at)"
          placement="top"
        >
          <el-card>
            <div class="version-item">
              <div class="version-info">
                <h4>版本 {{ version.version }}</h4>
                <p v-if="version.comment">{{ version.comment }}</p>
                <p class="version-meta">
                  大小: {{ formatFileSize(version.size) }}
                </p>
              </div>

              <div class="version-actions">
                <el-button size="small" @click="previewVersion(version)">预览</el-button>
                <el-button size="small" type="primary" @click="restoreVersion(version)">恢复</el-button>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>

    <!-- 分享文档对话框 -->
    <el-dialog
      v-model="showShareDialog"
      title="分享文档"
      width="500px"
    >
      <template v-if="document">
        <p>您正在分享文档：{{ document.title }}</p>

        <el-form :model="shareForm" label-position="top">
          <el-form-item label="权限设置">
            <el-radio-group v-model="shareForm.permissionLevel">
              <el-radio label="READ">只读</el-radio>
              <el-radio label="WRITE">可编辑</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="过期时间">
            <el-date-picker
              v-model="shareForm.expiresAt"
              type="datetime"
              placeholder="选择过期时间（可选）"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
        </el-form>

        <div v-if="shareLink" class="share-link-container">
          <p>分享链接：</p>
          <el-input
            v-model="shareLink"
            readonly
          >
            <template #append>
              <el-button @click="copyShareLink">复制</el-button>
            </template>
          </el-input>
        </div>
      </template>

      <template #footer>
        <el-button @click="showShareDialog = false">关闭</el-button>
        <el-button v-if="!shareLink" type="primary" @click="handleShare">生成链接</el-button>
      </template>
    </el-dialog>

    <!-- 评论对话框 -->
    <el-dialog
      v-model="showCommentsDialog"
      title="文档评论"
      width="800px"
      destroy-on-close
    >
      <comment-list
        v-if="document"
        :document-id="document.id"
        :highlighted-comment-id="highlightedCommentId"
        @comment-added="handleCommentAdded"
        @comment-updated="handleCommentUpdated"
        @comment-deleted="handleCommentDeleted"
      />
    </el-dialog>

    <!-- 协作面板 -->
    <div class="collaboration-container" :class="{ 'panel-open': showCollaborationPanel }">
      <div class="editor-area">
        <cursor-overlay
          v-if="document"
          :online-users="onlineUsers"
          :current-user-id="currentUserId"
        />
      </div>

      <div v-if="showCollaborationPanel" class="panel-area">
        <collaboration-panel
          :online-users="onlineUsers"
          :is-connected="isConnected"
          @close="showCollaborationPanel = false"
          @jump-to-cursor="handleJumpToCursor"
          @resolve-conflict="handleResolveConflict"
          @change-conflict-mode="handleChangeConflictMode"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Edit, ArrowDown, ArrowRight, Loading, Bold, Italic, List, Tickets, Link, PictureFilled, Headings, Memo, Histogram, Aim } from '@element-plus/icons-vue'
import { getDocument, getDocumentVersions, shareDocument, updateDocument } from '@/api/document'
import type { Document, DocumentVersion } from '@/types/document'
import type { Comment } from '@/types/comment'
import { formatDate as formatDateUtil } from '@/utils/date'
import { useCollaborationService } from '@/composables/useCollaborationService'
import { useAuthStore } from '@/stores/auth'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import CommentList from '@/components/document/CommentList.vue'
import CollaborationPanel from '@/components/document/CollaborationPanel.vue'
import CursorOverlay from '@/components/document/CursorOverlay.vue'

// 导入Vue-Office组件
// 注意：这些组件需要安装并在main.ts中全局注册，或者在这里局部导入
// import { VueOfficeDocx, VueOfficeXlsx, VueOfficePptx, VueOfficePdf } from 'vue-office'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 状态
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const document = ref<Document | null>(null)
const documentUrl = ref<string | null>(null)
const isEditingTitle = ref(false)
const editingTitle = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)
const markdownContent = ref('')
const markdownEditorRef = ref<HTMLTextAreaElement | null>(null)
const isLoadingVersions = ref(false)
const documentVersions = ref<DocumentVersion[]>([])
const showHistoryDialog = ref(false)
const showShareDialog = ref(false)
const shareLink = ref('')
const shareForm = ref({
  permissionLevel: 'READ' as 'READ' | 'WRITE',
  expiresAt: ''
})

// 评论相关
const showCommentsDialog = ref(false)
const highlightedCommentId = ref('')

// 协同编辑
const showCollaborationPanel = ref(false)
const currentUserId = ref(authStore.user?.id || '')
const conflictResolutionMode = ref<'auto' | 'manual'>('auto')
const { onlineUsers, isConnected, connect, disconnect, sendOperation, sendCursorPosition, onOperationReceived } = useCollaborationService()

// 计算属性
const markdownPreview = computed(() => {
  if (!markdownContent.value) return ''
  const html = marked(markdownContent.value)
  return DOMPurify.sanitize(html)
})

// 生命周期钩子
onMounted(async () => {
  const documentId = route.params.id as string
  if (!documentId) {
    router.push('/dashboard')
    return
  }

  await loadDocument()

  // 连接协同编辑服务
  if (document.value) {
    connect(document.value.id)
  }
})

onBeforeUnmount(() => {
  // 断开协同编辑服务
  disconnect()
})

// 方法
async function loadDocument() {
  const documentId = route.params.id as string
  isLoading.value = true
  loadError.value = null

  try {
    const response = await getDocument(documentId)
    document.value = response.data

    // 设置文档URL
    // 在实际应用中，这应该是从API获取的URL
    documentUrl.value = `/api/v1/documents/${documentId}/content`

    // 如果是Markdown文档，加载内容
    if (document.value.type === 'MARKDOWN') {
      // 这里应该有一个API来获取Markdown内容
      // 暂时使用模拟数据
      markdownContent.value = '# 示例Markdown文档\n\n这是一个示例Markdown文档。\n\n## 功能列表\n\n- 支持基本Markdown语法\n- 实时预览\n- 协同编辑'
    }

    // 设置标题
    editingTitle.value = document.value.title
  } catch (error: any) {
    console.error('Failed to load document', error)
    loadError.value = error.message || '加载文档失败'
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push('/dashboard')
}

function startEditTitle() {
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
  })
}

async function saveTitle() {
  if (!document.value) return

  if (editingTitle.value !== document.value.title) {
    try {
      await updateDocument(document.value.id, { title: editingTitle.value })
      document.value.title = editingTitle.value
      ElMessage.success('标题已更新')
    } catch (error) {
      console.error('Failed to update title', error)
      ElMessage.error('更新标题失败')
      editingTitle.value = document.value.title
    }
  }

  isEditingTitle.value = false
}

function handleCommand(command: string) {
  switch (command) {
    case 'share':
      showShareDialog.value = true
      break

    case 'permissions':
      navigateToPermissions()
      break

    case 'comments':
      showCommentsDialog.value = true
      break

    case 'history':
      loadDocumentVersions()
      showHistoryDialog.value = true
      break

    case 'download':
      downloadDocument()
      break

    case 'print':
      printDocument()
      break
  }
}

function navigateToPermissions() {
  if (!document.value) return
  router.push(`/dashboard/document/${document.value.id}/permissions`)
}

async function saveDocument() {
  if (!document.value) return

  try {
    // 保存文档内容
    // 这里应该有一个API来保存文档内容
    ElMessage.success('文档已保存')
  } catch (error) {
    console.error('Failed to save document', error)
    ElMessage.error('保存失败')
  }
}

function handleDocRendered() {
  ElMessage.success('文档已加载')
}

function applyMarkdown(prefix: string, suffix: string) {
  if (!markdownEditorRef.value) return

  const textarea = markdownEditorRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = markdownContent.value.substring(start, end)

  const beforeText = markdownContent.value.substring(0, start)
  const afterText = markdownContent.value.substring(end)

  markdownContent.value = beforeText + prefix + selectedText + suffix + afterText

  // 设置光标位置
  nextTick(() => {
    textarea.focus()
    if (selectedText) {
      textarea.selectionStart = start + prefix.length
      textarea.selectionEnd = end + prefix.length
    } else {
      textarea.selectionStart = start + prefix.length
      textarea.selectionEnd = start + prefix.length
    }
  })

  // 发送操作到协同编辑服务
  if (document.value) {
    sendOperation({
      type: 'markdown',
      data: {
        content: markdownContent.value
      }
    })
  }
}

function handleMarkdownChange() {
  // 发送操作到协同编辑服务
  if (document.value) {
    sendOperation({
      type: 'markdown',
      data: {
        content: markdownContent.value
      }
    })
  }
}

async function loadDocumentVersions() {
  if (!document.value) return

  isLoadingVersions.value = true

  try {
    const response = await getDocumentVersions(document.value.id)
    documentVersions.value = response.data.items
  } catch (error) {
    console.error('Failed to load document versions', error)
    ElMessage.error('加载历史版本失败')
  } finally {
    isLoadingVersions.value = false
  }
}

function previewVersion(version: DocumentVersion) {
  // 在新窗口中预览版本
  const previewUrl = `/api/v1/documents/${document.value?.id}/versions/${version.version}/preview`
  window.open(previewUrl, '_blank')
}

function restoreVersion(version: DocumentVersion) {
  ElMessageBox.confirm(
    `确定要恢复到版本 ${version.version} 吗？当前未保存的更改将丢失。`,
    '恢复确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 调用恢复API
      // await restoreDocumentVersion(document.value.id, version.version)
      ElMessage.success('版本已恢复')
      await loadDocument()
      showHistoryDialog.value = false
    } catch (error) {
      console.error('Failed to restore version', error)
      ElMessage.error('恢复失败')
    }
  }).catch(() => {
    // 用户取消恢复
  })
}

function downloadDocument() {
  if (!document.value) return

  // 创建下载链接
  const downloadUrl = `/api/v1/documents/${document.value.id}/download`

  // 创建临时链接并点击
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = document.value.title
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function printDocument() {
  window.print()
}

async function handleShare() {
  if (!document.value) return

  try {
    const response = await shareDocument(
      document.value.id,
      shareForm.value.permissionLevel,
      shareForm.value.expiresAt
    )

    // 构建分享链接
    const baseUrl = window.location.origin
    shareLink.value = `${baseUrl}/share/${response.data.access_code}`

    ElMessage.success('分享链接已生成')
  } catch (error) {
    console.error('Failed to share document', error)
    ElMessage.error('分享失败')
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

// 评论相关方法
function handleCommentAdded(comment: Comment) {
  ElMessage.success('评论已添加')
}

function handleCommentUpdated(comment: Comment) {
  ElMessage.success('评论已更新')
}

function handleCommentDeleted(comment: Comment) {
  ElMessage.success('评论已删除')
}

// 获取用户标题（显示状态）
function getUserTitle(user: any): string {
  let status = ''
  switch (user.status) {
    case 'editing':
      status = '(编辑中)'
      break
    case 'idle':
      status = '(空闲)'
      break
    default:
      status = '(在线)'
  }
  return `${user.username} ${status}`
}

// 跳转到用户光标位置
function handleJumpToCursor(user: any) {
  if (!user.cursor) return

  // 根据编辑器类型处理光标跳转
  if (document.value?.type === 'MARKDOWN' && markdownEditorRef.value) {
    // 对于Markdown编辑器，设置滚动位置和选择范围
    const editor = markdownEditorRef.value
    editor.scrollTop = user.cursor.y

    if (user.cursor.selection) {
      editor.setSelectionRange(user.cursor.selection.start, user.cursor.selection.end)
    }

    editor.focus()
  } else {
    // 对于其他编辑器，可能需要不同的处理方式
    // 这里只是简单地滚动到光标位置
    const editorContainer = document.querySelector('.editor-container')
    if (editorContainer) {
      editorContainer.scrollTo({
        top: user.cursor.y,
        behavior: 'smooth'
      })
    }
  }
}

// 处理冲突解决
function handleResolveConflict(conflict: any, resolution: 'mine' | 'theirs') {
  console.log(`Resolving conflict with ${resolution} content`, conflict)

  // 根据选择的解决方案应用内容
  if (resolution === 'mine') {
    // 保留本地内容，不做任何操作
    ElMessage.success('已保留您的更改')
  } else {
    // 应用他人的内容
    if (document.value?.type === 'MARKDOWN') {
      markdownContent.value = conflict.content.theirs

      // 发送操作通知其他用户
      sendOperation({
        type: 'markdown',
        data: {
          content: markdownContent.value
        }
      })
    }

    ElMessage.success('已接受他人的更改')
  }
}

// 更改冲突解决模式
function handleChangeConflictMode(mode: 'auto' | 'manual') {
  conflictResolutionMode.value = mode
  ElMessage.success(`已切换到${mode === 'auto' ? '自动' : '手动'}冲突解决模式`)
}

// 监听协同编辑操作
onOperationReceived((operation) => {
  if (operation.type === 'markdown' && operation.data.content) {
    // 如果是自动解决冲突模式，直接应用更改
    if (conflictResolutionMode.value === 'auto') {
      markdownContent.value = operation.data.content
    } else {
      // 手动解决冲突模式，检查是否有冲突
      if (markdownContent.value !== operation.data.content) {
        // 这里可以实现更复杂的冲突检测逻辑
        ElMessage.warning('检测到内容冲突，请在协作面板中解决')
      } else {
        markdownContent.value = operation.data.content
      }
    }
  }
})
</script>

<style scoped>
.document-edit-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.document-title {
  display: flex;
  align-items: center;
}

.document-title h3 {
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.document-title h3 .el-icon {
  opacity: 0;
  transition: opacity 0.3s;
}

.document-title h3:hover .el-icon {
  opacity: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collaborators {
  display: flex;
  gap: 4px;
}

.document-content {
  flex: 1;
  overflow: auto;
  padding: 20px 0;
}

.loading-container,
.error-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

.editor-container {
  height: 100%;
}

.word-editor,
.excel-editor,
.ppt-editor,
.pdf-viewer,
.default-editor {
  height: 100%;
}

.markdown-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.markdown-toolbar {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color-light);
}

.markdown-content {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow: hidden;
}

.markdown-content .el-textarea {
  flex: 1;
  height: 100%;
}

.markdown-content .el-textarea :deep(.el-textarea__inner) {
  height: 100%;
  font-family: monospace;
}

.markdown-preview {
  flex: 1;
  overflow: auto;
  padding: 10px;
  border: 1px solid var(--border-color-light);
  border-radius: 4px;
}

.loading-versions {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-info h4 {
  margin: 0 0 8px 0;
}

.version-info p {
  margin: 0 0 4px 0;
}

.version-meta {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.share-link-container {
  margin-top: 20px;
  padding: 10px;
  background-color: var(--background-color-base);
  border-radius: 4px;
}

/* 协作相关样式 */
.collaboration-container {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  pointer-events: none;
}

.collaboration-container.panel-open .editor-area {
  width: calc(100% - 300px);
}

.editor-area {
  position: relative;
  width: 100%;
  height: 100%;
  transition: width 0.3s;
}

.panel-area {
  width: 300px;
  height: 100%;
  pointer-events: auto;
  transition: transform 0.3s;
}

.collaborators {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-avatar {
  margin-right: 4px;
  transition: all 0.3s;
}

.user-editing {
  border: 2px solid var(--el-color-primary);
}

.user-idle {
  opacity: 0.6;
}

.show-panel-button {
  margin-left: 4px;
}
</style>
