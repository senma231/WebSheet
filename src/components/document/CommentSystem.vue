<template>
  <div class="comment-system">
    <div class="comment-header">
      <h3>评论 ({{ comments.length }})</h3>
      <el-button v-if="showRefreshButton" :icon="Refresh" circle plain @click="loadComments" />
    </div>
    
    <div v-if="loading" class="comment-loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <el-empty v-else-if="comments.length === 0" description="暂无评论">
      <template #description>
        <p>成为第一个评论的人</p>
      </template>
    </el-empty>
    
    <div v-else class="comment-list">
      <div
        v-for="comment in sortedComments"
        :key="comment.id"
        :class="['comment-item', { 'comment-highlight': comment.id === highlightedCommentId }]"
        :id="`comment-${comment.id}`"
      >
        <div class="comment-avatar">
          <el-avatar :size="40" :src="comment.user.avatar_url">
            {{ comment.user.initials }}
          </el-avatar>
        </div>
        
        <div class="comment-content">
          <div class="comment-header">
            <div class="comment-author">{{ comment.user.username }}</div>
            <div class="comment-time">{{ formatTime(comment.created_at) }}</div>
          </div>
          
          <div v-if="editingCommentId === comment.id" class="comment-edit">
            <el-input
              v-model="editCommentText"
              type="textarea"
              :rows="3"
              placeholder="编辑评论..."
              resize="none"
            />
            <div class="comment-edit-actions">
              <el-button size="small" @click="cancelEdit">取消</el-button>
              <el-button type="primary" size="small" @click="updateComment(comment)">保存</el-button>
            </div>
          </div>
          
          <div v-else class="comment-text">{{ comment.content }}</div>
          
          <div class="comment-actions">
            <el-button
              type="text"
              size="small"
              @click="replyToComment(comment)"
            >
              回复
            </el-button>
            
            <template v-if="canEditComment(comment)">
              <el-button
                type="text"
                size="small"
                @click="editComment(comment)"
              >
                编辑
              </el-button>
              
              <el-button
                type="text"
                size="small"
                @click="deleteComment(comment)"
              >
                删除
              </el-button>
            </template>
          </div>
          
          <!-- 回复列表 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="reply-list">
            <div
              v-for="reply in comment.replies"
              :key="reply.id"
              class="reply-item"
            >
              <div class="reply-avatar">
                <el-avatar :size="32" :src="reply.user.avatar_url">
                  {{ reply.user.initials }}
                </el-avatar>
              </div>
              
              <div class="reply-content">
                <div class="reply-header">
                  <div class="reply-author">{{ reply.user.username }}</div>
                  <div class="reply-time">{{ formatTime(reply.created_at) }}</div>
                </div>
                
                <div v-if="editingCommentId === reply.id" class="reply-edit">
                  <el-input
                    v-model="editCommentText"
                    type="textarea"
                    :rows="2"
                    placeholder="编辑回复..."
                    resize="none"
                  />
                  <div class="reply-edit-actions">
                    <el-button size="small" @click="cancelEdit">取消</el-button>
                    <el-button type="primary" size="small" @click="updateComment(reply)">保存</el-button>
                  </div>
                </div>
                
                <div v-else class="reply-text">{{ reply.content }}</div>
                
                <div class="reply-actions">
                  <el-button
                    type="text"
                    size="small"
                    @click="replyToComment(comment)"
                  >
                    回复
                  </el-button>
                  
                  <template v-if="canEditComment(reply)">
                    <el-button
                      type="text"
                      size="small"
                      @click="editComment(reply)"
                    >
                      编辑
                    </el-button>
                    
                    <el-button
                      type="text"
                      size="small"
                      @click="deleteComment(reply)"
                    >
                      删除
                    </el-button>
                  </template>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 回复输入框 -->
          <div v-if="replyingToCommentId === comment.id" class="reply-input">
            <el-input
              v-model="replyText"
              type="textarea"
              :rows="2"
              placeholder="写下你的回复..."
              resize="none"
            />
            <div class="reply-input-actions">
              <el-button size="small" @click="cancelReply">取消</el-button>
              <el-button type="primary" size="small" @click="submitReply(comment)">回复</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="comment-input">
      <el-input
        v-model="commentText"
        type="textarea"
        :rows="3"
        placeholder="写下你的评论..."
        resize="none"
      />
      <div class="comment-input-actions">
        <el-button type="primary" @click="submitComment" :disabled="!commentText.trim()">
          发表评论
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineProps, defineEmits, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Refresh } from '@element-plus/icons-vue'
import { formatRelativeTime } from '@/utils/date'
import { useAuthStore } from '@/stores/auth'

// 定义属性
const props = defineProps({
  documentId: {
    type: String,
    required: true
  },
  highlightedCommentId: {
    type: String,
    default: ''
  },
  showRefreshButton: {
    type: Boolean,
    default: true
  }
})

// 定义事件
const emit = defineEmits(['comment-added', 'comment-updated', 'comment-deleted'])

// 状态
const authStore = useAuthStore()
const loading = ref(true)
const comments = ref<any[]>([])
const commentText = ref('')
const replyText = ref('')
const editCommentText = ref('')
const replyingToCommentId = ref('')
const editingCommentId = ref('')

// 计算属性
const sortedComments = computed(() => {
  return [...comments.value].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

// 监听高亮评论ID变化
watch(() => props.highlightedCommentId, (newValue) => {
  if (newValue) {
    scrollToComment(newValue)
  }
})

// 生命周期钩子
onMounted(() => {
  loadComments()
})

// 方法
async function loadComments() {
  loading.value = true
  
  try {
    // 这里应该调用API获取评论列表
    // const response = await getDocumentComments(props.documentId)
    
    // 模拟数据
    comments.value = [
      {
        id: '1',
        content: '这是一个很好的文档，内容非常详细。',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: {
          id: '101',
          username: 'user1',
          avatar_url: '',
          initials: 'U1'
        },
        replies: [
          {
            id: '3',
            content: '我同意，这个文档写得很好。',
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            parent_id: '1',
            user: {
              id: '102',
              username: 'user2',
              avatar_url: '',
              initials: 'U2'
            }
          }
        ]
      },
      {
        id: '2',
        content: '我有一些建议，可以在第二部分添加更多的例子。',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: '103',
          username: 'user3',
          avatar_url: '',
          initials: 'U3'
        },
        replies: []
      }
    ]
    
    // 如果有高亮评论ID，滚动到该评论
    if (props.highlightedCommentId) {
      scrollToComment(props.highlightedCommentId)
    }
  } catch (error) {
    console.error('Failed to load comments', error)
    ElMessage.error('加载评论失败')
  } finally {
    loading.value = false
  }
}

function scrollToComment(commentId: string) {
  // 等待DOM更新
  setTimeout(() => {
    const commentElement = document.getElementById(`comment-${commentId}`)
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

async function submitComment() {
  if (!commentText.value.trim()) return
  
  try {
    // 这里应该调用API添加评论
    // const response = await addDocumentComment(props.documentId, {
    //   content: commentText.value
    // })
    
    // 模拟响应
    const newComment = {
      id: Date.now().toString(),
      content: commentText.value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: authStore.user?.id || 'current-user',
        username: authStore.user?.username || '当前用户',
        avatar_url: authStore.user?.avatar_url || '',
        initials: (authStore.user?.username || 'CU').substring(0, 2).toUpperCase()
      },
      replies: []
    }
    
    // 添加到列表
    comments.value.unshift(newComment)
    
    // 清空输入框
    commentText.value = ''
    
    ElMessage.success('评论已发表')
    
    emit('comment-added', newComment)
  } catch (error) {
    console.error('Failed to add comment', error)
    ElMessage.error('发表评论失败')
  }
}

function replyToComment(comment: any) {
  replyingToCommentId.value = comment.id
  replyText.value = ''
  
  // 取消编辑状态
  editingCommentId.value = ''
}

function cancelReply() {
  replyingToCommentId.value = ''
  replyText.value = ''
}

async function submitReply(parentComment: any) {
  if (!replyText.value.trim()) return
  
  try {
    // 这里应该调用API添加回复
    // const response = await addDocumentComment(props.documentId, {
    //   content: replyText.value,
    //   parent_id: parentComment.id
    // })
    
    // 模拟响应
    const newReply = {
      id: Date.now().toString(),
      content: replyText.value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_id: parentComment.id,
      user: {
        id: authStore.user?.id || 'current-user',
        username: authStore.user?.username || '当前用户',
        avatar_url: authStore.user?.avatar_url || '',
        initials: (authStore.user?.username || 'CU').substring(0, 2).toUpperCase()
      }
    }
    
    // 添加到回复列表
    if (!parentComment.replies) {
      parentComment.replies = []
    }
    parentComment.replies.push(newReply)
    
    // 清空输入框并取消回复状态
    replyText.value = ''
    replyingToCommentId.value = ''
    
    ElMessage.success('回复已发表')
    
    emit('comment-added', newReply)
  } catch (error) {
    console.error('Failed to add reply', error)
    ElMessage.error('发表回复失败')
  }
}

function editComment(comment: any) {
  editingCommentId.value = comment.id
  editCommentText.value = comment.content
  
  // 取消回复状态
  replyingToCommentId.value = ''
}

function cancelEdit() {
  editingCommentId.value = ''
  editCommentText.value = ''
}

async function updateComment(comment: any) {
  if (!editCommentText.value.trim()) return
  
  try {
    // 这里应该调用API更新评论
    // const response = await updateDocumentComment(props.documentId, comment.id, {
    //   content: editCommentText.value
    // })
    
    // 更新本地数据
    comment.content = editCommentText.value
    comment.updated_at = new Date().toISOString()
    
    // 清空输入框并取消编辑状态
    editCommentText.value = ''
    editingCommentId.value = ''
    
    ElMessage.success('评论已更新')
    
    emit('comment-updated', comment)
  } catch (error) {
    console.error('Failed to update comment', error)
    ElMessage.error('更新评论失败')
  }
}

function deleteComment(comment: any) {
  ElMessageBox.confirm(
    '确定要删除这条评论吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 这里应该调用API删除评论
      // await deleteDocumentComment(props.documentId, comment.id)
      
      // 从列表中移除
      if (comment.parent_id) {
        // 如果是回复，从父评论的回复列表中移除
        const parentComment = comments.value.find(c => c.id === comment.parent_id)
        if (parentComment && parentComment.replies) {
          parentComment.replies = parentComment.replies.filter(r => r.id !== comment.id)
        }
      } else {
        // 如果是主评论，从评论列表中移除
        comments.value = comments.value.filter(c => c.id !== comment.id)
      }
      
      ElMessage.success('评论已删除')
      
      emit('comment-deleted', comment)
    } catch (error) {
      console.error('Failed to delete comment', error)
      ElMessage.error('删除评论失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

function canEditComment(comment: any) {
  // 检查当前用户是否是评论作者
  return comment.user.id === authStore.user?.id || authStore.isAdmin()
}

function formatTime(dateString: string) {
  return formatRelativeTime(dateString)
}
</script>

<style scoped>
.comment-system {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.comment-header h3 {
  margin: 0;
}

.comment-loading {
  flex: 1;
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

.comment-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
}

.comment-item {
  display: flex;
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  background-color: #fff;
  transition: background-color 0.3s;
}

.comment-highlight {
  background-color: rgba(64, 158, 255, 0.1);
}

.comment-avatar {
  margin-right: 16px;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 500;
}

.comment-time {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.comment-text {
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 8px;
}

.comment-edit,
.reply-edit {
  margin-bottom: 8px;
}

.comment-edit-actions,
.reply-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.reply-list {
  margin-top: 16px;
  margin-left: 24px;
}

.reply-item {
  display: flex;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--background-color-base);
}

.reply-avatar {
  margin-right: 12px;
}

.reply-content {
  flex: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reply-author {
  font-weight: 500;
}

.reply-time {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.reply-text {
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-actions {
  display: flex;
  gap: 8px;
}

.reply-input {
  margin-top: 16px;
  margin-left: 24px;
}

.reply-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.comment-input {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border-color-light);
}

.comment-input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
