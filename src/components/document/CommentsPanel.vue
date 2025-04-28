<template>
  <div class="comments-panel">
    <div class="comments-header">
      <h3>评论 ({{ comments.length }})</h3>
      <el-button type="primary" size="small" @click="showAddComment = true">添加评论</el-button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="comments.length === 0" class="empty-comments">
      <el-empty description="暂无评论" :image-size="80" />
    </div>
    
    <div v-else class="comments-list">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-header">
          <div class="comment-author">
            <el-avatar :size="32" :src="comment.user?.avatar_url">
              {{ comment.user?.username.substring(0, 2).toUpperCase() }}
            </el-avatar>
            <div class="author-info">
              <div class="author-name">{{ comment.user?.username }}</div>
              <div class="comment-time">{{ formatDate(comment.created_at) }}</div>
            </div>
          </div>
          
          <div class="comment-actions">
            <el-dropdown v-if="canManageComment(comment)" trigger="click" @command="(cmd) => handleCommentAction(cmd, comment)">
              <el-button type="text" :icon="MoreFilled" />
              
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <div class="comment-content">
          <div v-if="comment.id === editingCommentId">
            <el-input
              v-model="editingContent"
              type="textarea"
              :rows="3"
              placeholder="编辑评论..."
            />
            <div class="edit-actions">
              <el-button size="small" @click="cancelEdit">取消</el-button>
              <el-button type="primary" size="small" @click="saveEdit(comment)">保存</el-button>
            </div>
          </div>
          <div v-else>
            {{ comment.content }}
          </div>
        </div>
        
        <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
          <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
            <div class="reply-header">
              <div class="reply-author">
                <el-avatar :size="24" :src="reply.user?.avatar_url">
                  {{ reply.user?.username.substring(0, 2).toUpperCase() }}
                </el-avatar>
                <div class="author-info">
                  <div class="author-name">{{ reply.user?.username }}</div>
                  <div class="reply-time">{{ formatDate(reply.created_at) }}</div>
                </div>
              </div>
              
              <div class="reply-actions">
                <el-dropdown v-if="canManageComment(reply)" trigger="click" @command="(cmd) => handleReplyAction(cmd, reply, comment)">
                  <el-button type="text" :icon="MoreFilled" />
                  
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            
            <div class="reply-content">
              <div v-if="reply.id === editingCommentId">
                <el-input
                  v-model="editingContent"
                  type="textarea"
                  :rows="2"
                  placeholder="编辑回复..."
                />
                <div class="edit-actions">
                  <el-button size="small" @click="cancelEdit">取消</el-button>
                  <el-button type="primary" size="small" @click="saveEdit(reply, comment)">保存</el-button>
                </div>
              </div>
              <div v-else>
                {{ reply.content }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="reply-form" v-if="comment.id === replyingToId">
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="2"
            placeholder="回复评论..."
          />
          <div class="reply-actions">
            <el-button size="small" @click="cancelReply">取消</el-button>
            <el-button type="primary" size="small" @click="submitReply(comment)">回复</el-button>
          </div>
        </div>
        
        <div class="comment-footer" v-else>
          <el-button type="text" @click="startReply(comment)">回复</el-button>
        </div>
      </div>
    </div>
    
    <!-- 添加评论对话框 -->
    <el-dialog
      v-model="showAddComment"
      title="添加评论"
      width="500px"
    >
      <el-form :model="commentForm">
        <el-form-item>
          <el-input
            v-model="commentForm.content"
            type="textarea"
            :rows="4"
            placeholder="输入评论内容..."
          />
        </el-form-item>
        
        <el-form-item label="位置" v-if="canSelectPosition">
          <el-radio-group v-model="commentForm.positionType">
            <el-radio label="document">整个文档</el-radio>
            <el-radio label="selection">选中内容</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddComment = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitComment"
          :loading="isSubmitting"
          :disabled="!commentForm.content"
        >
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, MoreFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { formatDate as formatDateUtil } from '@/utils/date'
import { 
  getDocumentComments, 
  addDocumentComment, 
  updateDocumentComment, 
  deleteDocumentComment,
  addCommentReply,
  updateCommentReply,
  deleteCommentReply
} from '@/api/document'

const props = defineProps({
  documentId: {
    type: String,
    required: true
  },
  canSelectPosition: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-comment'])

// 状态
const loading = ref(true)
const comments = ref<any[]>([])
const showAddComment = ref(false)
const isSubmitting = ref(false)
const commentForm = ref({
  content: '',
  positionType: 'document',
  position: null as any
})
const replyingToId = ref<string | null>(null)
const replyContent = ref('')
const editingCommentId = ref<string | null>(null)
const editingContent = ref('')

// 认证存储
const authStore = useAuthStore()

// 生命周期钩子
onMounted(async () => {
  await loadComments()
})

// 方法
async function loadComments() {
  loading.value = true
  
  try {
    const response = await getDocumentComments(props.documentId)
    comments.value = response.data.items
  } catch (error) {
    console.error('Failed to load comments', error)
    ElMessage.error('加载评论失败')
  } finally {
    loading.value = false
  }
}

function canManageComment(comment: any) {
  return comment.user_id === authStore.user?.id || authStore.isAdmin
}

async function submitComment() {
  if (!commentForm.value.content) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const data: Record<string, any> = {
      content: commentForm.value.content
    }
    
    if (commentForm.value.positionType === 'selection' && commentForm.value.position) {
      data.position = commentForm.value.position
    }
    
    const response = await addDocumentComment(props.documentId, data)
    
    // 添加到评论列表
    comments.value.unshift(response.data)
    
    // 重置表单
    commentForm.value = {
      content: '',
      positionType: 'document',
      position: null
    }
    
    showAddComment.value = false
    ElMessage.success('评论已添加')
    
    // 触发事件
    emit('add-comment', response.data)
  } catch (error) {
    console.error('Failed to add comment', error)
    ElMessage.error('添加评论失败')
  } finally {
    isSubmitting.value = false
  }
}

function startReply(comment: any) {
  replyingToId.value = comment.id
  replyContent.value = ''
}

function cancelReply() {
  replyingToId.value = null
  replyContent.value = ''
}

async function submitReply(comment: any) {
  if (!replyContent.value) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  try {
    const response = await addCommentReply(props.documentId, comment.id, {
      content: replyContent.value
    })
    
    // 添加到回复列表
    if (!comment.replies) {
      comment.replies = []
    }
    
    comment.replies.push(response.data)
    
    // 重置表单
    replyingToId.value = null
    replyContent.value = ''
    
    ElMessage.success('回复已添加')
  } catch (error) {
    console.error('Failed to add reply', error)
    ElMessage.error('添加回复失败')
  }
}

function handleCommentAction(action: string, comment: any) {
  if (action === 'edit') {
    startEdit(comment)
  } else if (action === 'delete') {
    confirmDeleteComment(comment)
  }
}

function handleReplyAction(action: string, reply: any, parentComment: any) {
  if (action === 'edit') {
    startEdit(reply)
  } else if (action === 'delete') {
    confirmDeleteReply(reply, parentComment)
  }
}

function startEdit(comment: any) {
  editingCommentId.value = comment.id
  editingContent.value = comment.content
}

function cancelEdit() {
  editingCommentId.value = null
  editingContent.value = ''
}

async function saveEdit(comment: any, parentComment?: any) {
  if (!editingContent.value) {
    ElMessage.warning('内容不能为空')
    return
  }
  
  try {
    if (parentComment) {
      // 更新回复
      await updateCommentReply(props.documentId, parentComment.id, comment.id, {
        content: editingContent.value
      })
    } else {
      // 更新评论
      await updateDocumentComment(props.documentId, comment.id, {
        content: editingContent.value
      })
    }
    
    // 更新本地数据
    comment.content = editingContent.value
    
    // 重置编辑状态
    editingCommentId.value = null
    editingContent.value = ''
    
    ElMessage.success('更新成功')
  } catch (error) {
    console.error('Failed to update comment', error)
    ElMessage.error('更新失败')
  }
}

function confirmDeleteComment(comment: any) {
  ElMessageBox.confirm(
    '确定要删除此评论吗？此操作不可撤销。',
    '删除评论',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteDocumentComment(props.documentId, comment.id)
      
      // 从列表中移除
      comments.value = comments.value.filter(c => c.id !== comment.id)
      
      ElMessage.success('评论已删除')
    } catch (error) {
      console.error('Failed to delete comment', error)
      ElMessage.error('删除评论失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

function confirmDeleteReply(reply: any, parentComment: any) {
  ElMessageBox.confirm(
    '确定要删除此回复吗？此操作不可撤销。',
    '删除回复',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteCommentReply(props.documentId, parentComment.id, reply.id)
      
      // 从列表中移除
      if (parentComment.replies) {
        parentComment.replies = parentComment.replies.filter((r: any) => r.id !== reply.id)
      }
      
      ElMessage.success('回复已删除')
    } catch (error) {
      console.error('Failed to delete reply', error)
      ElMessage.error('删除回复失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

function formatDate(dateString: string) {
  return formatDateUtil(dateString)
}
</script>

<style scoped>
.comments-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.comments-header h3 {
  margin: 0;
}

.loading-container,
.empty-comments {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-icon {
  font-size: 32px;
  margin-bottom: 16px;
}

.comments-list {
  flex: 1;
  overflow-y: auto;
}

.comment-item {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.comment-author,
.reply-author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 500;
  font-size: 14px;
}

.comment-time,
.reply-time {
  font-size: 12px;
  color: #909399;
}

.comment-content,
.reply-content {
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
}

.comment-replies {
  margin-top: 12px;
  margin-left: 24px;
}

.reply-item {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.reply-form,
.edit-actions {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
