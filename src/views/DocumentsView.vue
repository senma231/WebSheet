<template>
  <div class="documents-container">
    <div class="documents-header">
      <div class="header-title">
        <h2>我的文档</h2>
      </div>
      
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文档"
          prefix-icon="Search"
          clearable
          @clear="handleSearch"
          @input="handleSearch"
        />
        
        <el-button-group>
          <el-button
            :icon="viewMode === 'grid' ? 'Menu' : 'Grid'"
            @click="toggleViewMode"
          />
          <el-button :icon="Sort" @click="showSortOptions = true" />
        </el-button-group>
        
        <el-button type="primary" @click="showCreateDialog = true">
          新建文档
        </el-button>
      </div>
    </div>
    
    <div class="documents-breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">全部文档</el-breadcrumb-item>
        <el-breadcrumb-item v-for="(folder, index) in breadcrumbPath" :key="index">
          {{ folder.name }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="documents-content">
      <el-empty v-if="isLoading" description="加载中...">
        <template #image>
          <el-icon class="loading-icon"><Loading /></el-icon>
        </template>
      </el-empty>
      
      <el-empty v-else-if="filteredDocuments.length === 0 && filteredFolders.length === 0" description="没有文档">
        <el-button type="primary" @click="showCreateDialog = true">新建文档</el-button>
      </el-empty>
      
      <template v-else>
        <!-- 文件夹列表 -->
        <div v-if="filteredFolders.length > 0" class="folders-section">
          <h3>文件夹</h3>
          
          <div :class="['folders-list', viewMode === 'grid' ? 'grid-view' : 'list-view']">
            <div
              v-for="folder in filteredFolders"
              :key="folder.id"
              class="folder-item"
              @click="openFolder(folder.id)"
            >
              <el-icon class="folder-icon"><Folder /></el-icon>
              <div class="folder-info">
                <div class="folder-name">{{ folder.name }}</div>
                <div class="folder-meta">
                  {{ formatDate(folder.created_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 文档列表 -->
        <div v-if="filteredDocuments.length > 0" class="documents-section">
          <h3>文档</h3>
          
          <div :class="['documents-list', viewMode === 'grid' ? 'grid-view' : 'list-view']">
            <div
              v-for="document in filteredDocuments"
              :key="document.id"
              class="document-item"
              @click="openDocument(document.id)"
            >
              <div class="document-icon">
                <el-icon v-if="document.type === 'WORD'"><Document /></el-icon>
                <el-icon v-else-if="document.type === 'EXCEL'"><Grid /></el-icon>
                <el-icon v-else-if="document.type === 'PPT'"><PictureFilled /></el-icon>
                <el-icon v-else-if="document.type === 'PDF'"><Files /></el-icon>
                <el-icon v-else><Document /></el-icon>
              </div>
              
              <div class="document-info">
                <div class="document-name">{{ document.title }}</div>
                <div class="document-meta">
                  <span>{{ formatDocumentType(document.type) }}</span>
                  <span>{{ formatDate(document.updated_at) }}</span>
                </div>
              </div>
              
              <div class="document-actions">
                <el-dropdown trigger="click" @command="(command) => handleDocumentAction(command, document)">
                  <el-button type="text" :icon="MoreFilled" />
                  
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="share">分享</el-dropdown-item>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="move">移动</el-dropdown-item>
                      <el-dropdown-item command="download">下载</el-dropdown-item>
                      <el-dropdown-item divided command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <!-- 新建文档对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建文档"
      width="500px"
    >
      <el-tabs v-model="createTabActive">
        <el-tab-pane label="新建文档" name="document">
          <el-form :model="newDocumentForm" label-position="top">
            <el-form-item label="文档类型">
              <el-radio-group v-model="newDocumentForm.type">
                <el-radio-button label="WORD">Word文档</el-radio-button>
                <el-radio-button label="EXCEL">Excel表格</el-radio-button>
                <el-radio-button label="PPT">PPT演示文稿</el-radio-button>
                <el-radio-button label="MARKDOWN">Markdown</el-radio-button>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="文档名称">
              <el-input v-model="newDocumentForm.title" placeholder="请输入文档名称" />
            </el-form-item>
            
            <el-form-item label="文档描述">
              <el-input
                v-model="newDocumentForm.description"
                type="textarea"
                placeholder="请输入文档描述（可选）"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="上传文档" name="upload">
          <el-upload
            class="upload-area"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .docx, .xlsx, .pptx, .pdf, .md 格式文件
              </div>
            </template>
          </el-upload>
          
          <el-form v-if="uploadFile" :model="uploadForm" label-position="top">
            <el-form-item label="文档名称">
              <el-input v-model="uploadForm.title" placeholder="请输入文档名称" />
            </el-form-item>
            
            <el-form-item label="文档描述">
              <el-input
                v-model="uploadForm.description"
                type="textarea"
                placeholder="请输入文档描述（可选）"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="新建文件夹" name="folder">
          <el-form :model="newFolderForm" label-position="top">
            <el-form-item label="文件夹名称">
              <el-input v-model="newFolderForm.name" placeholder="请输入文件夹名称" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
    
    <!-- 分享文档对话框 -->
    <el-dialog
      v-model="showShareDialog"
      title="分享文档"
      width="500px"
    >
      <template v-if="selectedDocument">
        <p>您正在分享文档：{{ selectedDocument.title }}</p>
        
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Menu, Grid, Sort, Loading, Folder, Document, PictureFilled, Files, MoreFilled, Upload } from '@element-plus/icons-vue'
import type { Document as DocumentType, Folder as FolderType } from '@/types/document'
import { getDocuments, getFolders, createDocument, createFolder, shareDocument } from '@/api/document'
import { formatDate as formatDateUtil } from '@/utils/date'

const router = useRouter()
const route = useRoute()

// 状态
const isLoading = ref(true)
const documents = ref<DocumentType[]>([])
const folders = ref<FolderType[]>([])
const currentFolderId = ref<string | undefined>(undefined)
const breadcrumbPath = ref<FolderType[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')
const showSortOptions = ref(false)
const sortBy = ref<'name' | 'date'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 对话框状态
const showCreateDialog = ref(false)
const createTabActive = ref('document')
const showShareDialog = ref(false)
const selectedDocument = ref<DocumentType | null>(null)
const shareLink = ref('')

// 表单数据
const newDocumentForm = ref({
  type: 'WORD',
  title: '',
  description: ''
})

const uploadForm = ref({
  title: '',
  description: ''
})

const uploadFile = ref<File | null>(null)

const newFolderForm = ref({
  name: ''
})

const shareForm = ref({
  permissionLevel: 'READ',
  expiresAt: ''
})

// 计算属性
const filteredDocuments = computed(() => {
  let result = documents.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(doc => 
      doc.title.toLowerCase().includes(query) || 
      (doc.description && doc.description.toLowerCase().includes(query))
    )
  }
  
  // 排序
  result = [...result].sort((a, b) => {
    if (sortBy.value === 'name') {
      return sortOrder.value === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    } else {
      const dateA = new Date(a.updated_at).getTime()
      const dateB = new Date(b.updated_at).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    }
  })
  
  return result
})

const filteredFolders = computed(() => {
  let result = folders.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(folder => folder.name.toLowerCase().includes(query))
  }
  
  // 排序
  result = [...result].sort((a, b) => {
    if (sortBy.value === 'name') {
      return sortOrder.value === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    } else {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    }
  })
  
  return result
})

// 生命周期钩子
onMounted(async () => {
  // 从路由参数获取文件夹ID
  const folderId = route.query.folderId as string | undefined
  currentFolderId.value = folderId
  
  await loadData()
})

// 方法
async function loadData() {
  isLoading.value = true
  
  try {
    // 加载文档
    const documentsResponse = await getDocuments(1, 100, currentFolderId.value)
    documents.value = documentsResponse.data.items
    
    // 加载文件夹
    const foldersResponse = await getFolders(currentFolderId.value)
    folders.value = foldersResponse.data.items
    
    // 加载面包屑路径
    if (currentFolderId.value) {
      // 这里应该有一个API来获取文件夹路径
      // 暂时使用模拟数据
      breadcrumbPath.value = [{ id: currentFolderId.value, name: '当前文件夹', parent_id: null, owner_id: '', created_at: '', updated_at: '' }]
    } else {
      breadcrumbPath.value = []
    }
  } catch (error) {
    console.error('Failed to load documents', error)
    ElMessage.error('加载文档失败')
  } finally {
    isLoading.value = false
  }
}

function handleSearch() {
  // 搜索逻辑已通过计算属性实现
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

function openFolder(folderId: string) {
  router.push({ path: '/dashboard', query: { folderId } })
  currentFolderId.value = folderId
  loadData()
}

function openDocument(documentId: string) {
  router.push(`/dashboard/document/${documentId}`)
}

function formatDate(dateString: string) {
  return formatDateUtil(dateString)
}

function formatDocumentType(type: string) {
  const typeMap: Record<string, string> = {
    'WORD': 'Word文档',
    'EXCEL': '表格',
    'PPT': '演示文稿',
    'PDF': 'PDF文档',
    'MARKDOWN': 'Markdown'
  }
  
  return typeMap[type] || type
}

function handleFileChange(file: any) {
  uploadFile.value = file.raw
  
  // 自动填充文件名
  if (file.name && !uploadForm.value.title) {
    // 去掉扩展名
    const fileName = file.name.split('.').slice(0, -1).join('.')
    uploadForm.value.title = fileName
  }
}

async function handleCreate() {
  try {
    if (createTabActive.value === 'document') {
      // 创建新文档
      if (!newDocumentForm.value.title) {
        ElMessage.warning('请输入文档名称')
        return
      }
      
      // 这里应该调用API创建文档
      // 暂时使用模拟数据
      ElMessage.success('文档创建成功')
      
    } else if (createTabActive.value === 'upload') {
      // 上传文档
      if (!uploadFile.value) {
        ElMessage.warning('请选择要上传的文件')
        return
      }
      
      if (!uploadForm.value.title) {
        ElMessage.warning('请输入文档名称')
        return
      }
      
      await createDocument(
        uploadFile.value,
        uploadForm.value.title,
        uploadForm.value.description,
        currentFolderId.value
      )
      
      ElMessage.success('文档上传成功')
      
    } else if (createTabActive.value === 'folder') {
      // 创建文件夹
      if (!newFolderForm.value.name) {
        ElMessage.warning('请输入文件夹名称')
        return
      }
      
      await createFolder(newFolderForm.value.name, currentFolderId.value)
      
      ElMessage.success('文件夹创建成功')
    }
    
    // 重新加载数据
    await loadData()
    
    // 关闭对话框并重置表单
    showCreateDialog.value = false
    resetForms()
    
  } catch (error) {
    console.error('Failed to create', error)
    ElMessage.error('创建失败')
  }
}

function resetForms() {
  newDocumentForm.value = {
    type: 'WORD',
    title: '',
    description: ''
  }
  
  uploadForm.value = {
    title: '',
    description: ''
  }
  
  uploadFile.value = null
  
  newFolderForm.value = {
    name: ''
  }
  
  shareForm.value = {
    permissionLevel: 'READ',
    expiresAt: ''
  }
  
  shareLink.value = ''
}

function handleDocumentAction(action: string, document: DocumentType) {
  switch (action) {
    case 'edit':
      openDocument(document.id)
      break
      
    case 'share':
      selectedDocument.value = document
      showShareDialog.value = true
      break
      
    case 'rename':
      // 实现重命名逻辑
      break
      
    case 'move':
      // 实现移动逻辑
      break
      
    case 'download':
      // 实现下载逻辑
      break
      
    case 'delete':
      ElMessageBox.confirm(
        `确定要删除文档 "${document.title}" 吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          // 调用删除API
          // await deleteDocument(document.id)
          ElMessage.success('文档已删除')
          await loadData()
        } catch (error) {
          console.error('Failed to delete document', error)
          ElMessage.error('删除失败')
        }
      }).catch(() => {
        // 用户取消删除
      })
      break
  }
}

async function handleShare() {
  if (!selectedDocument.value) return
  
  try {
    const response = await shareDocument(
      selectedDocument.value.id,
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
</script>

<style scoped>
.documents-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.documents-breadcrumb {
  margin-bottom: 20px;
}

.documents-content {
  flex: 1;
  overflow: auto;
}

.folders-section,
.documents-section {
  margin-bottom: 30px;
}

.folders-section h3,
.documents-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--text-color-secondary);
  font-weight: normal;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.list-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.folder-item,
.document-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.list-view .folder-item,
.list-view .document-item {
  padding: 12px 16px;
}

.folder-item:hover,
.document-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.folder-icon,
.document-icon {
  font-size: 24px;
  margin-right: 12px;
  color: var(--primary-color);
}

.folder-info,
.document-info {
  flex: 1;
  min-width: 0;
}

.folder-name,
.document-name {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-meta,
.document-meta {
  font-size: 12px;
  color: var(--text-color-secondary);
  display: flex;
  gap: 8px;
}

.document-actions {
  opacity: 0;
  transition: opacity 0.3s;
}

.document-item:hover .document-actions {
  opacity: 1;
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

.upload-area {
  width: 100%;
}

.share-link-container {
  margin-top: 20px;
  padding: 10px;
  background-color: var(--background-color-base);
  border-radius: 4px;
}
</style>
