<template>
  <div class="shared-document-container">
    <div class="shared-header">
      <div class="header-left">
        <h2>{{ document?.title || '共享文档' }}</h2>
        <el-tag v-if="permissionLevel" :type="permissionLevel === 'READ' ? 'info' : 'success'">
          {{ permissionLevel === 'READ' ? '只读' : '可编辑' }}
        </el-tag>
      </div>

      <div class="header-right">
        <el-button @click="goToHome">返回首页</el-button>
        <el-button v-if="isAuthenticated" type="primary" @click="saveToMyDocs">保存到我的文档</el-button>
      </div>
    </div>

    <div class="shared-content">
      <div v-if="isLoading" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="loadError" class="error-container">
        <el-empty description="加载文档失败">
          <template #description>
            <p>{{ loadError }}</p>
          </template>
          <el-button @click="loadSharedDocument">重试</el-button>
        </el-empty>
      </div>

      <div v-else class="document-container">
        <collaborative-editor
          :document-id="document?.id"
          :read-only="permissionLevel === 'READ'"
        />
      </div>
    </div>

    <!-- 登录提示对话框 -->
    <el-dialog
      v-model="showLoginDialog"
      title="需要登录"
      width="400px"
    >
      <p>保存到我的文档需要先登录。</p>
      <template #footer>
        <el-button @click="showLoginDialog = false">取消</el-button>
        <el-button type="primary" @click="goToLogin">去登录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getShareInfo, saveDocumentCopy } from '@/api/document'
import type { Document } from '@/types/document'
import { useAuthStore } from '@/stores/auth'
import CollaborativeEditor from '@/components/document/CollaborativeEditor.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 状态
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const document = ref<Document | null>(null)
const documentUrl = ref<string | null>(null)
const permissionLevel = ref<'READ' | 'WRITE' | null>(null)
const markdownContent = ref('')
const showLoginDialog = ref(false)

// 计算属性
const isAuthenticated = computed(() => authStore.isAuthenticated())

// 生命周期钩子
onMounted(async () => {
  const accessCode = route.params.code as string
  if (!accessCode) {
    router.push('/')
    return
  }

  await loadSharedDocument()
})

// 方法
async function loadSharedDocument() {
  const accessCode = route.params.code as string
  isLoading.value = true
  loadError.value = null

  try {
    const response = await getShareInfo(accessCode)
    document.value = response.data.document
    permissionLevel.value = response.data.permission_level as 'READ' | 'WRITE'

    // 设置文档URL
    // 在实际应用中，这应该是从API获取的URL
    documentUrl.value = `/api/v1/share/${accessCode}/content`

    // 如果是Markdown文档，加载内容
    if (document.value.type === 'MARKDOWN') {
      // 这里应该有一个API来获取Markdown内容
      // 暂时使用模拟数据
      const markdownText = '# 共享的Markdown文档\n\n这是一个共享的Markdown文档示例。\n\n## 功能列表\n\n- 支持基本Markdown语法\n- 实时预览\n- 协同编辑'
      markdownContent.value = DOMPurify.sanitize(marked(markdownText))
    }
  } catch (error: any) {
    console.error('Failed to load shared document', error)
    loadError.value = error.message || '加载共享文档失败'
  } finally {
    isLoading.value = false
  }
}

function handleDocRendered() {
  ElMessage.success('文档已加载')
}

function goToHome() {
  router.push('/')
}

function goToLogin() {
  showLoginDialog.value = false
  router.push('/login')
}

async function saveToMyDocs() {
  if (!isAuthenticated.value) {
    showLoginDialog.value = true
    return
  }

  if (!document.value) return

  try {
    const response = await saveDocumentCopy(document.value.id)
    ElMessage.success('文档已保存到我的文档')

    // 导航到保存的文档
    router.push(`/dashboard/document/${response.data.id}`)
  } catch (error) {
    console.error('Failed to save document copy', error)
    ElMessage.error('保存文档失败')
  }
}
</script>

<style scoped>
.shared-document-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.shared-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.shared-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
  background-color: var(--background-color-base);
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

.document-container {
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.word-viewer,
.excel-viewer,
.ppt-viewer,
.pdf-viewer,
.default-viewer {
  height: 100%;
}

.markdown-viewer {
  height: 100%;
  padding: 24px;
  overflow: auto;
}
</style>
