<template>
  <div class="document-view">
    <collaborative-editor
      :document-id="documentId"
      :read-only="isReadOnly"
      @saved="handleDocumentSaved"
      @version-restored="handleVersionRestored"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import CollaborativeEditor from '@/components/document/CollaborativeEditor.vue'
import { getDocument } from '@/api/document'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// 状态
const documentId = computed(() => route.params.id as string)
const document = ref<any>(null)
const loading = ref(true)

// 计算属性
const isReadOnly = computed(() => {
  // 如果是分享链接访问，根据分享权限判断
  if (route.query.shared === 'true') {
    return route.query.permission !== 'WRITE'
  }
  
  // 如果是文档所有者，可以编辑
  if (document.value?.owner_id === authStore.user?.id) {
    return false
  }
  
  // 如果是协作者，根据协作权限判断
  if (document.value?.collaborators) {
    const collaborator = document.value.collaborators.find(
      (c: any) => c.user_id === authStore.user?.id
    )
    
    if (collaborator) {
      return collaborator.permission === 'read'
    }
  }
  
  // 默认只读
  return true
})

// 生命周期钩子
onMounted(async () => {
  await loadDocument()
})

// 方法
async function loadDocument() {
  loading.value = true
  
  try {
    const response = await getDocument(documentId.value)
    document.value = response.data
  } catch (error) {
    console.error('Failed to load document', error)
    ElMessage.error('加载文档失败')
  } finally {
    loading.value = false
  }
}

function handleDocumentSaved() {
  console.log('Document saved')
}

function handleVersionRestored(version: any) {
  console.log('Version restored', version)
  loadDocument()
}
</script>

<style scoped>
.document-view {
  height: 100%;
}
</style>
