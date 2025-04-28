<template>
  <div class="collaborative-editor">
    <div class="editor-header">
      <div class="document-info">
        <h2 class="document-title">{{ document?.title || '无标题文档' }}</h2>
        <div class="document-status">
          <el-tag v-if="isConnected" type="success" size="small">已连接</el-tag>
          <el-tag v-else type="danger" size="small">未连接</el-tag>

          <el-tag v-if="isSaving" type="warning" size="small">保存中...</el-tag>
          <el-tag v-else-if="lastSaved" type="info" size="small">
            {{ lastSavedText }}
          </el-tag>
        </div>
      </div>

      <div class="editor-actions">
        <el-button-group>
          <el-button
            type="primary"
            :icon="Save"
            @click="saveDocument"
            :loading="isSaving"
            :disabled="!hasChanges"
          >
            保存
          </el-button>

          <el-button
            :icon="View"
            @click="showVersionHistory = true"
          >
            版本历史
          </el-button>
        </el-button-group>

        <el-dropdown trigger="click" @command="handleCommand">
          <el-button :icon="MoreFilled" />

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="share">分享文档</el-dropdown-item>
              <el-dropdown-item command="download">下载文档</el-dropdown-item>
              <el-dropdown-item command="print">打印文档</el-dropdown-item>
              <el-dropdown-item divided command="lock" v-if="!isLocked">锁定文档</el-dropdown-item>
              <el-dropdown-item command="unlock" v-if="isLocked && canUnlock">解锁文档</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="editor-container">
      <div class="editor-main">
        <div v-if="isLocked && !canUnlock" class="locked-overlay">
          <el-alert
            title="文档已锁定"
            type="warning"
            description="此文档已被其他用户锁定，暂时无法编辑。"
            show-icon
            :closable="false"
          />
        </div>

        <div v-if="showConflict" class="conflict-overlay">
          <conflict-resolver
            :conflict="currentConflict"
            :users="onlineUsers"
            @resolve="resolveConflict"
            @cancel="cancelConflict"
          />
        </div>

        <!-- 编辑器组件，根据文档类型加载不同的编辑器 -->
        <component
          :is="editorComponent"
          v-if="editorComponent"
          ref="editorRef"
          :document-id="documentId"
          :content="content"
          :read-only="isReadOnly"
          @change="handleContentChange"
          @cursor-change="handleCursorChange"
        />

        <div v-else class="editor-placeholder">
          <el-empty description="不支持的文档类型" />
        </div>
      </div>

      <div class="editor-sidebar" v-if="showSidebar">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="协作者" name="collaborators">
            <collaborators-list
              :document-id="documentId"
              :online-users="onlineUsers"
              :can-invite="canInvite"
              @jump-to-cursor="jumpToCursor"
            />
          </el-tab-pane>

          <el-tab-pane label="评论" name="comments">
            <comments-panel
              :document-id="documentId"
              @add-comment="addComment"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 版本历史对话框 -->
    <el-drawer
      v-model="showVersionHistory"
      title="版本历史"
      direction="rtl"
      size="500px"
    >
      <version-history
        :document-id="documentId"
        :document-type="document?.type"
        @version-selected="previewVersion"
        @version-restored="handleVersionRestored"
      />
    </el-drawer>

    <!-- 分享对话框 -->
    <el-dialog
      v-model="showShareDialog"
      title="分享文档"
      width="500px"
    >
      <el-form :model="shareForm" label-position="top">
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

      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="createShareLink"
          :loading="isCreatingShare"
        >
          创建链接
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, shallowRef, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Save, View, MoreFilled } from '@element-plus/icons-vue'
import { useCollaborationService } from '@/composables/useCollaborationService'
import { useAuthStore } from '@/stores/auth'
import { getDocument, getDocumentContent, saveDocumentContent, shareDocument, lockDocument, unlockDocument, getDocumentLockStatus } from '@/api/document'
import { formatDate } from '@/utils/date'
import CollaboratorsList from './CollaboratorsList.vue'
import VersionHistory from './VersionHistory.vue'
import ConflictResolver from './ConflictResolver.vue'
import CommentsPanel from './CommentsPanel.vue'

// 动态导入编辑器组件
const TextEditor = defineAsyncComponent(() => import('./editors/TextEditor.vue'))
const MarkdownEditor = defineAsyncComponent(() => import('./editors/MarkdownEditor.vue'))
const SpreadsheetEditor = defineAsyncComponent(() => import('./editors/SpreadsheetEditor.vue'))
const PdfViewer = defineAsyncComponent(() => import('./editors/PdfViewer.vue'))

const props = defineProps({
  documentId: {
    type: String,
    required: true
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['saved', 'version-restored'])

// 状态
const document = ref<any>(null)
const content = ref<any>(null)
const editorRef = shallowRef<any>(null)
const isSaving = ref(false)
const lastSaved = ref<Date | null>(null)
const hasChanges = ref(false)
const showSidebar = ref(true)
const activeTab = ref('collaborators')
const showVersionHistory = ref(false)
const showShareDialog = ref(false)
const shareForm = ref({
  permissionLevel: 'READ',
  expiration: 'never',
  expirationDate: null as Date | null
})
const shareLink = ref('')
const isCreatingShare = ref(false)
const isLocked = ref(false)
const lockedBy = ref<string | null>(null)
const autoSaveInterval = ref<number | null>(null)
const AUTO_SAVE_INTERVAL = 60000 // 60秒自动保存一次

// 协同编辑服务
const {
  isConnected,
  onlineUsers,
  connect,
  disconnect,
  sendOperation,
  sendCursorPosition,
  onOperationReceived,
  onConflictDetected,
  resolveConflictById
} = useCollaborationService()

// 冲突处理
const showConflict = ref(false)
const currentConflict = ref<any>(null)

// 认证存储
const authStore = useAuthStore()

// 计算属性
const editorComponent = computed(() => {
  if (!document.value) return null

  switch (document.value.type) {
    case 'MARKDOWN':
      return MarkdownEditor
    case 'EXCEL':
      return SpreadsheetEditor
    case 'PPT':
      // PPT只支持预览，不支持编辑
      return null
    case 'PDF':
      return PdfViewer
    case 'WORD':
    case 'TEXT':
    default:
      return TextEditor
  }
})

const isReadOnly = computed(() => {
  return props.readOnly || (isLocked.value && !canUnlock.value)
})

const canUnlock = computed(() => {
  return lockedBy.value === authStore.user?.id
})

const canInvite = computed(() => {
  return document.value?.owner_id === authStore.user?.id
})

const lastSavedText = computed(() => {
  if (!lastSaved.value) return '未保存'
  return `上次保存: ${formatDate(lastSaved.value.toISOString())}`
})

// 生命周期钩子
onMounted(async () => {
  await loadDocument()
  await loadDocumentContent()
  await checkLockStatus()

  // 连接协同编辑服务
  connect(props.documentId)

  // 监听操作
  onOperationReceived(handleRemoteOperation)

  // 监听冲突
  onConflictDetected(handleConflict)

  // 设置自动保存
  if (!props.readOnly) {
    autoSaveInterval.value = window.setInterval(() => {
      if (hasChanges.value) {
        saveDocument(true)
      }
    }, AUTO_SAVE_INTERVAL)
  }
})

onBeforeUnmount(() => {
  // 断开协同编辑服务
  disconnect()

  // 清除自动保存定时器
  if (autoSaveInterval.value !== null) {
    window.clearInterval(autoSaveInterval.value)
  }
})

// 方法
async function loadDocument() {
  try {
    const response = await getDocument(props.documentId)
    document.value = response.data
  } catch (error) {
    console.error('Failed to load document', error)
    ElMessage.error('加载文档失败')
  }
}

async function loadDocumentContent() {
  try {
    const response = await getDocumentContent(props.documentId)
    content.value = response.data.content
  } catch (error) {
    console.error('Failed to load document content', error)
    ElMessage.error('加载文档内容失败')
  }
}

async function checkLockStatus() {
  try {
    const response = await getDocumentLockStatus(props.documentId)
    isLocked.value = response.data.locked
    lockedBy.value = response.data.locked_by || null
  } catch (error) {
    console.error('Failed to check lock status', error)
  }
}

async function saveDocument(autoSave = false) {
  if (isReadOnly.value || !hasChanges.value) return

  isSaving.value = true

  try {
    // 获取当前内容
    const currentContent = editorRef.value?.getContent() || content.value

    // 保存到服务器
    await saveDocumentContent(props.documentId, currentContent, autoSave)

    // 更新状态
    lastSaved.value = new Date()
    hasChanges.value = false

    if (!autoSave) {
      ElMessage.success('文档已保存')
    }

    // 触发事件
    emit('saved')
  } catch (error) {
    console.error('Failed to save document', error)
    ElMessage.error('保存文档失败')
  } finally {
    isSaving.value = false
  }
}

function handleContentChange(newContent: any) {
  // 标记有更改
  hasChanges.value = true

  // 发送操作到协同编辑服务
  if (isConnected.value) {
    sendOperation({
      type: 'content_change',
      data: {
        content: newContent
      }
    })
  }
}

function handleCursorChange(position: any) {
  // 发送光标位置到协同编辑服务
  if (isConnected.value) {
    sendCursorPosition(position)
  }
}

function handleRemoteOperation(operation: any, user: any) {
  console.log('Received remote operation', operation, 'from user', user)

  // 处理不同类型的操作
  if (operation.type === 'content_change') {
    // 更新编辑器内容
    if (editorRef.value) {
      editorRef.value.applyRemoteChanges(operation.data.content, user)
    }
  }
}

function handleConflict(conflict: any) {
  console.log('Conflict detected', conflict)

  // 显示冲突解决界面
  currentConflict.value = conflict
  showConflict.value = true
}

function resolveConflict(resolution: { conflictId: string; resolution: 'local' | 'remote' | 'merge' }) {
  // 解决冲突
  const resolvedOperation = resolveConflictById(resolution.conflictId, resolution.resolution)

  if (resolvedOperation) {
    // 应用解决后的操作
    if (editorRef.value) {
      editorRef.value.applyResolvedConflict(resolvedOperation)
    }

    // 隐藏冲突界面
    showConflict.value = false
    currentConflict.value = null

    ElMessage.success('冲突已解决')
  }
}

function cancelConflict() {
  // 取消冲突解决
  showConflict.value = false
  currentConflict.value = null
}

function jumpToCursor(user: any) {
  if (user.cursor && editorRef.value) {
    editorRef.value.jumpToCursor(user.cursor)
  }
}

function addComment(comment: any) {
  console.log('Add comment', comment)
  // 实现添加评论的逻辑
}

function previewVersion(version: any) {
  console.log('Preview version', version)
  // 实现预览版本的逻辑
}

function handleVersionRestored(version: any) {
  // 重新加载文档内容
  loadDocumentContent()

  // 触发事件
  emit('version-restored', version)

  ElMessage.success(`已恢复到版本 ${version.version}`)
}

async function handleCommand(command: string) {
  switch (command) {
    case 'share':
      showShareDialog.value = true
      shareLink.value = ''
      break

    case 'download':
      // 实现下载逻辑
      window.open(`/api/documents/${props.documentId}/download`, '_blank')
      break

    case 'print':
      // 实现打印逻辑
      window.print()
      break

    case 'lock':
      await lockDocument(props.documentId)
      isLocked.value = true
      lockedBy.value = authStore.user?.id
      ElMessage.success('文档已锁定')
      break

    case 'unlock':
      await unlockDocument(props.documentId)
      isLocked.value = false
      lockedBy.value = null
      ElMessage.success('文档已解锁')
      break
  }
}

async function createShareLink() {
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
    const response = await shareDocument(
      props.documentId,
      shareForm.value.permissionLevel,
      expiresAt
    )

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
</script>

<style scoped>
.collaborative-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.document-info {
  display: flex;
  flex-direction: column;
}

.document-title {
  margin: 0;
  font-size: 18px;
  margin-bottom: 4px;
}

.document-status {
  display: flex;
  gap: 8px;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.editor-sidebar {
  width: 300px;
  border-left: 1px solid #e4e7ed;
  overflow: auto;
}

.locked-overlay,
.conflict-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: auto;
}

.editor-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-link {
  margin: 16px 0;
}
</style>
