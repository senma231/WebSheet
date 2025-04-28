<template>
  <div class="comment-list">
    <div class="comment-header">
      <h3>评论 ({{ comments.length }})</h3>
      <el-button v-if="showRefreshButton" :icon="Refresh" circle plain @click="loadComments" />
    </div>
    
    <div class="comment-input">
      <el-input
        v-model="commentText"
        type="textarea"
        :rows="3"
        placeholder="添加评论..."
        resize="none"
      />
      <div class="comment-actions">
        <el-button type="primary" :disabled="!commentText.trim()" @click="addComment">
          发表评论
        </el-button>
      </div>
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
    
    <div v-else class="comment-items">
      <div
        v-for="comment in sortedComments"
        :key="comment.id"
        :id="`comment-${comment.id}`"
        :class="['comment-item', { 'comment-highlighted': comment.id === highlightedCommentId }]"
      >
        <div class="comment-avatar">
          <el-avatar :size="40" :src="comment.user?.avatar_url">
            {{ getUserInitials(comment.user) }}
          </el-avatar>
        </div>
        
        <div class="comment-content">
          <div class="comment-header">
            <div class="comment-author">{{ comment.user?.username || '未知用户' }}</div>
            <div class="comment-time">{{ formatRelativeTime(comment.created_at) }}</div>
          </div>
          
          <div v-if="editingCommentId === comment.id" class="comment-edit">
            <el-input
              v-model="editCommentText"
              type="textarea"
              :rows="3"
              resize="none"
            />
            <div class="edit-actions">
              <el-button size="small" @click="cancelEdit">取消</el-button>
              <el-button size="small" type="primary" @click="updateComment(comment)">保存</el-button>
            </div>
          </div>
          
          <div v-else class="comment-text">
            {{ comment.content }}
          </div>
          
          <div class="comment-actions">
            <el-button type="text" size="small" @click="startReply(comment.id)">
              回复
            </el-button>
            
            <template v-if="canEditComment(comment)">
              <el-button type="text" size="small" @click="startEdit(comment)">
                编辑
              </el-button>
              <el-button type="text" size="small" @click="deleteComment(comment)">
                删除
              </el-button>
            </template>
          </div>
          
          <!-- 回复输入框 -->
          <div v-if="replyingToCommentId === comment.id" class="reply-input">
            <el-input
              v-model="replyText"
              type="textarea"
              :rows="2"
              placeholder="添加回复..."
              resize="none"
            />
            <div class="reply-actions">
              <el-button size="small" @click="cancelReply">取消</el-button>
              <el-button
                size="small"
                type="primary"
                :disabled="!replyText.trim()"
                @click="addReply(comment)"
              >
                回复
              </el-button>
            </div>
          </div>
          
          <!-- 回复列表 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="reply-list">
            <div
              v-for="reply in comment.replies"
              :key="reply.id"
              :id="`comment-${reply.id}`"
              :class="['reply-item', { 'comment-highlighted': reply.id === highlightedCommentId }]"
            >
              <div class="reply-avatar">
                <el-avatar :size="32" :src="reply.user?.avatar_url">
                  {{ getUserInitials(reply.user) }}
                </el-avatar>
              </div>
              
              <div class="reply-content">
                <div class="reply-header">
                  <div class="reply-author">{{ reply.user?.username || '未知用户' }}</div>
                  <div class="reply-time">{{ formatRelativeTime(reply.created_at) }}</div>
                </div>
                
                <div v-if="editingCommentId === reply.id" class="reply-edit">
                  <el-input
                    v-model="editCommentText"
                    type="textarea"
                    :rows="2"
                    resize="none"
                  />
                  <div class="edit-actions">
                    <el-button size="small" @click="cancelEdit">取消</el-button>
                    <el-button size="small" type="primary" @click="updateComment(reply)">保存</el-button>
                  </div>
                </div>
                
                <div v-else class="reply-text">
                  {{ reply.content }}
                </div>
                
                <div class="reply-actions">
                  <template v-if="canEditComment(reply)">
                    <el-button type="text" size="small" @click="startEdit(reply)">
                      编辑
                    </el-button>
                    <el-button type="text" size="small" @click="deleteComment(reply)">
                      删除
                    </el-button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
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
import type { Comment } from '@/types/comment'
import {
  getDocumentComments,
  addDocumentComment,
  updateDocumentComment,
  deleteDocumentComment,
  replyToComment
} from '@/api/comment'

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
const comments = ref<Comment[]>([])
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
    const response = await getDocumentComments(props.documentId)
    
    // 处理评论和回复的层级结构
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []
    
    // 首先将所有评论放入Map中
    response.data.items.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })
    
    // 然后处理回复关系
    response.data.items.forEach(comment => {
      if (comment.parent_id) {
        const parentComment = commentMap.get(comment.parent_id)
        if (parentComment) {
          if (!parentComment.replies) {
            parentComment.replies = []
          }
          parentComment.replies.push(commentMap.get(comment.id) as Comment)
        }
      } else {
        rootComments.push(commentMap.get(comment.id) as Comment)
      }
    })
    
    comments.value = rootComments
    
    // 如果有高亮评论ID，滚动到该评论
    if (props.highlightedCommentId) {
      scrollToComment(props.highlightedCommentId)
    }
  } catch (error) {
    console.error('Failed to load comments', error)
    ElMessage.error('加载评论失败')
    
    // 模拟数据
    comments.value = [
      {
        id: '1',
        document_id: props.documentId,
        user_id: '101',
        content: '这是一条测试评论',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        user: {
          id: '101',
          username: 'user1',
          avatar_url: ''
        },
        replies: [
          {
            id: '2',
            document_id: props.documentId,
            user_id: '102',
            parent_id: '1',
            content: '这是一条回复',
            created_at: new Date(Date.now() - 1800000).toISOString(),
            updated_at: new Date(Date.now() - 1800000).toISOString(),
            user: {
              id: '102',
              username: 'user2',
              avatar_url: ''
            }
          }
        ]
      }
    ]
  } finally {
    loading.value = false
  }
}

async function addComment() {
  if (!commentText.value.trim()) return
  
  try {
    const response = await addDocumentComment(props.documentId, {
      content: commentText.value
    })
    
    // 添加到列表
    const newComment = {
      ...response.data,
      replies: []
    }
    
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

function startReply(commentId: string) {
  replyingToCommentId.value = commentId
  replyText.value = ''
}

function cancelReply() {
  replyingToCommentId.value = ''
  replyText.value = ''
}

async function addReply(parentComment: Comment) {
  if (!replyText.value.trim()) return
  
  try {
    const response = await replyToComment(props.documentId, parentComment.id, {
      content: replyText.value
    })
    
    // 添加到回复列表
    if (!parentComment.replies) {
      parentComment.replies = []
    }
    
    parentComment.replies.push(response.data)
    
    // 清空输入框并关闭回复框
    replyText.value = ''
    replyingToCommentId.value = ''
    
    ElMessage.success('回复已发表')
    
    emit('comment-added', response.data)
  } catch (error) {
    console.error('Failed to add reply', error)
    ElMessage.error('发表回复失败')
  }
}

function startEdit(comment: Comment) {
  editingCommentId.value = comment.id
  editCommentText.value = comment.content
}

function cancelEdit() {
  editingCommentId.value = ''
  editCommentText.value = ''
}

async function updateComment(comment: Comment) {
  if (!editCommentText.value.trim()) return
  
  try {
    const response = await updateDocumentComment(props.documentId, comment.id, {
      content: editCommentText.value
    })
    
    // 更新评论内容
    comment.content = response.data.content
    comment.updated_at = response.data.updated_at
    
    // 关闭编辑框
    editingCommentId.value = ''
    editCommentText.value = ''
    
    ElMessage.success('评论已更新')
    
    emit('comment-updated', response.data)
  } catch (error) {
    console.error('Failed to update comment', error)
    ElMessage.error('更新评论失败')
  }
}

function deleteComment(comment: Comment) {
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
      await deleteDocumentComment(props.documentId, comment.id)
      
      // 如果是回复，从父评论的回复列表中移除
      if (comment.parent_id) {
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

function canEditComment(comment: Comment): boolean {
  if (!authStore.user) return false
  
  // 用户可以编辑自己的评论，管理员可以编辑所有评论
  return comment.user_id === authStore.user.id || authStore.isAdmin()
}

function getUserInitials(user: any): string {
  if (!user) return '?'
  
  if (user.full_name) {
    return user.full_name.split(' ').map(name => name[0]).join('').toUpperCase().substring(0, 2)
  }
  
  return user.username.substring(0, 2).toUpperCase()
}

function scrollToComment(commentId: string) {
  setTimeout(() => {
    const element = document.getElementById(`comment-${commentId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      // 添加闪烁效果
      element.classList.add('comment-highlight-animation')
      setTimeout(() => {
        element.classList.remove('comment-highlight-animation')
      }, 2000)
    }
  }, 100)
}
</script>

<style scoped>
.comment-list {
  padding: 16px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.comment-header h3 {
  margin: 0;
  font-size: 18px;
}

.comment-input {
  margin-bottom: 24px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.comment-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.comment-items {
  margin-top: 24px;
}

.comment-item {
  display: flex;
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
  transition: background-color 0.3s;
}

.comment-highlighted {
  background-color: var(--el-color-primary-light-9);
}

.comment-highlight-animation {
  animation: highlight-pulse 2s;
}

@keyframes highlight-pulse {
  0% { background-color: var(--el-color-primary-light-7); }
  100% { background-color: var(--el-color-primary-light-9); }
}

.comment-avatar {
  margin-right: 16px;
}

.comment-content {
  flex: 1;
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
  color: var(--el-text-color-secondary);
}

.comment-text {
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.comment-edit,
.reply-edit {
  margin-bottom: 8px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  gap: 8px;
}

.reply-input {
  margin-top: 16px;
  margin-bottom: 16px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  gap: 8px;
}

.reply-list {
  margin-top: 16px;
  padding-left: 16px;
  border-left: 2px solid var(--el-border-color-lighter);
}

.reply-item {
  display: flex;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--el-fill-color-lighter);
  transition: background-color 0.3s;
}

.reply-avatar {
  margin-right: 12px;
}

.reply-content {
  flex: 1;
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
  color: var(--el-text-color-secondary);
}

.reply-text {
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.reply-actions {
  display: flex;
  gap: 8px;
}
</style>
