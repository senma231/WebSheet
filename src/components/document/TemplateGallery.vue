<template>
  <div class="template-gallery">
    <div class="gallery-header">
      <h3>模板库</h3>

      <div class="gallery-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索模板"
          prefix-icon="Search"
          clearable
          @clear="loadTemplates"
          @keyup.enter="searchTemplates"
        />

        <el-select v-model="filterType" placeholder="类型" @change="loadTemplates">
          <el-option label="全部" value="" />
          <el-option label="文档" value="WORD" />
          <el-option label="表格" value="EXCEL" />
          <el-option label="演示文稿" value="PPT" />
          <el-option label="Markdown" value="MARKDOWN" />
        </el-select>

        <el-select v-model="filterCategory" placeholder="分类" @change="loadTemplates">
          <el-option label="全部" value="" />
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </div>

      <div class="gallery-actions">
        <el-button v-if="canCreateTemplate" type="primary" @click="showCreateDialog = true">
          创建模板
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="gallery-loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <el-empty v-else-if="templates.length === 0" description="没有找到模板">
      <el-button v-if="canCreateTemplate" type="primary" @click="showCreateDialog = true">
        创建模板
      </el-button>
    </el-empty>

    <div v-else>
      <div class="template-grid">
        <div
          v-for="template in templates"
          :key="template.id"
          class="template-card"
          @click="useTemplate(template)"
        >
        <div class="template-preview">
          <img
            v-if="template.thumbnail_url"
            :src="template.thumbnail_url"
            :alt="template.title"
            class="template-thumbnail"
          />
          <div v-else class="template-icon">
            <file-icon :type="template.type" large />
          </div>
        </div>

        <div class="template-info">
          <div class="template-title">{{ template.title }}</div>
          <div class="template-meta">
            <el-tag size="small" :type="getTagType(template.type)">
              {{ formatDocumentType(template.type) }}
            </el-tag>
            <span class="template-author">{{ template.author }}</span>
          </div>
        </div>

        <div class="template-actions">
          <el-tooltip content="使用模板" placement="top">
            <el-button
              type="primary"
              :icon="DocumentAdd"
              circle
              plain
              size="small"
              @click.stop="useTemplate(template)"
            />
          </el-tooltip>

          <el-tooltip content="预览" placement="top">
            <el-button
              type="info"
              :icon="View"
              circle
              plain
              size="small"
              @click.stop="previewTemplate(template)"
            />
          </el-tooltip>

          <el-dropdown
            v-if="isAdmin || template.is_owner"
            trigger="click"
            @command="(command) => handleCommand(command, template)"
            @click.stop
          >
            <el-button
              type="default"
              :icon="MoreFilled"
              circle
              plain
              size="small"
            />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="delete">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalTemplates"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建模板对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建模板"
      width="500px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="formRules"
        label-position="top"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入模板标题" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="createForm.type">
            <el-radio-button label="WORD">文档</el-radio-button>
            <el-radio-button label="EXCEL">表格</el-radio-button>
            <el-radio-button label="PPT">演示文稿</el-radio-button>
            <el-radio-button label="MARKDOWN">Markdown</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="分类" prop="category_id">
          <el-select v-model="createForm.category_id" placeholder="选择分类">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="文件" prop="file">
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
                请上传与选择类型相符的文件
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="缩略图" prop="thumbnail">
          <el-upload
            class="thumbnail-upload"
            action="#"
            :auto-upload="false"
            :on-change="handleThumbnailChange"
            :show-file-list="false"
          >
            <img
              v-if="thumbnailUrl"
              :src="thumbnailUrl"
              class="thumbnail-preview"
            />
            <el-icon v-else class="thumbnail-icon"><Plus /></el-icon>
          </el-upload>
          <div class="thumbnail-tip">
            建议尺寸: 300x200px
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createTemplate" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>

    <!-- 编辑模板对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑模板"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="formRules"
        label-position="top"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" placeholder="请输入模板标题" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>

        <el-form-item label="分类" prop="category_id">
          <el-select v-model="editForm.category_id" placeholder="选择分类">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="缩略图">
          <el-upload
            class="thumbnail-upload"
            action="#"
            :auto-upload="false"
            :on-change="handleEditThumbnailChange"
            :show-file-list="false"
          >
            <img
              v-if="editThumbnailUrl"
              :src="editThumbnailUrl"
              class="thumbnail-preview"
            />
            <el-icon v-else class="thumbnail-icon"><Plus /></el-icon>
          </el-upload>
          <div class="thumbnail-tip">
            建议尺寸: 300x200px
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updateTemplate" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 预览模板对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="selectedTemplate?.title || '模板预览'"
      width="80%"
      fullscreen
    >
      <div v-if="previewLoading" class="preview-loading">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else class="preview-container">
        <!-- 这里将根据文档类型显示不同的预览组件 -->
        <div class="preview-placeholder">
          <p>模板预览将在这里显示</p>
          <p v-if="selectedTemplate?.description">{{ selectedTemplate.description }}</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button
          v-if="selectedTemplate"
          type="primary"
          @click="useTemplate(selectedTemplate)"
        >
          使用此模板
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Search, Loading, DocumentAdd, View, MoreFilled, Upload, Plus } from '@element-plus/icons-vue'
import FileIcon from '@/components/common/FileIcon.vue'
import { useAuthStore } from '@/stores/auth'
import {
  getTemplates,
  getTemplateCategories,
  createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
  createDocumentFromTemplate
} from '@/api/template'
import type { Template, TemplateCategory } from '@/types/template'

// 定义属性
const props = defineProps({
  canCreateTemplate: {
    type: Boolean,
    default: true
  }
})

// 定义事件
const emit = defineEmits(['template-selected', 'template-created', 'template-updated', 'template-deleted'])

// 状态
const authStore = useAuthStore()
const loading = ref(true)
const submitting = ref(false)
const previewLoading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const filterCategory = ref('')
const templates = ref<Template[]>([])
const categories = ref<TemplateCategory[]>([])
const selectedTemplate = ref<Template | null>(null)
const thumbnailUrl = ref('')
const editThumbnailUrl = ref('')
const totalTemplates = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)

// 对话框状态
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showPreviewDialog = ref(false)

// 表单引用
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()

// 表单数据
const createForm = reactive({
  title: '',
  description: '',
  type: 'WORD',
  category_id: '',
  file: null as File | null,
  thumbnail: null as File | null
})

const editForm = reactive({
  id: '',
  title: '',
  description: '',
  category_id: '',
  thumbnail: null as File | null
})

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ],
  file: [
    { required: true, message: '请上传文件', trigger: 'change' }
  ]
}

// 计算属性
const isAdmin = computed(() => authStore.isAdmin())

// 生命周期钩子
onMounted(() => {
  loadTemplates()
  loadCategories()
})

// 方法
async function loadTemplates() {
  loading.value = true

  try {
    const response = await getTemplates({
      query: searchQuery.value,
      type: filterType.value,
      category_id: filterCategory.value,
      page: currentPage.value,
      size: pageSize.value
    })

    templates.value = response.data.items
    totalTemplates.value = response.data.total
  } catch (error) {
    console.error('Failed to load templates', error)
    ElMessage.error('加载模板失败')

    // 模拟数据（仅在开发环境使用）
    if (import.meta.env.DEV) {
      templates.value = [
        {
          id: '1',
          title: '项目计划模板',
          description: '适用于项目规划和跟踪的文档模板',
          type: 'WORD',
          category_id: '1',
          size: 1024,
          storage_path: '/templates/1.docx',
          owner_id: '1',
          is_public: true,
          download_count: 120,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner: {
            id: '1',
            username: 'Admin'
          },
          category: {
            id: '1',
            name: '项目管理'
          }
        },
        {
          id: '2',
          title: '财务报表模板',
          description: '包含常用财务报表格式的Excel模板',
          type: 'EXCEL',
          category_id: '2',
          size: 2048,
          storage_path: '/templates/2.xlsx',
          owner_id: '1',
          is_public: true,
          download_count: 85,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner: {
            id: '1',
            username: 'Admin'
          },
          category: {
            id: '2',
            name: '财务'
          }
        },
        {
          id: '3',
          title: '公司介绍模板',
          description: '专业的公司介绍演示文稿模板',
          type: 'PPT',
          category_id: '3',
          size: 3072,
          storage_path: '/templates/3.pptx',
          owner_id: '1',
          is_public: true,
          download_count: 65,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner: {
            id: '1',
            username: 'Admin'
          },
          category: {
            id: '3',
            name: '营销'
          }
        },
        {
          id: '4',
          title: '会议记录模板',
          description: '标准会议记录Markdown模板',
          type: 'MARKDOWN',
          category_id: '4',
          size: 512,
          storage_path: '/templates/4.md',
          owner_id: authStore.user?.id || '1',
          is_public: true,
          download_count: 42,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner: {
            id: authStore.user?.id || '1',
            username: authStore.user?.username || 'Admin'
          },
          category: {
            id: '4',
            name: '人力资源'
          }
        }
      ]
      totalTemplates.value = templates.value.length
    }
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const response = await getTemplateCategories()
    categories.value = response.data.items
  } catch (error) {
    console.error('Failed to load categories', error)
    ElMessage.error('加载分类失败')

    // 模拟数据（仅在开发环境使用）
    if (import.meta.env.DEV) {
      categories.value = [
        {
          id: '1',
          name: '项目管理',
          description: '项目管理相关模板',
          template_count: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: '财务',
          description: '财务报表和分析模板',
          template_count: 8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: '营销',
          description: '营销策划和宣传材料模板',
          template_count: 6,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          name: '人力资源',
          description: '人力资源管理模板',
          template_count: 4,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    }
  }
}

function searchTemplates() {
  currentPage.value = 1 // 搜索时重置为第一页
  loadTemplates()
}

function handleSizeChange(size: number) {
  pageSize.value = size
  loadTemplates()
}

function handleCurrentChange(page: number) {
  currentPage.value = page
  loadTemplates()
}

function handleFileChange(file: any) {
  createForm.file = file.raw
}

function handleThumbnailChange(file: any) {
  createForm.thumbnail = file.raw
  thumbnailUrl.value = URL.createObjectURL(file.raw)
}

function handleEditThumbnailChange(file: any) {
  editForm.thumbnail = file.raw
  editThumbnailUrl.value = URL.createObjectURL(file.raw)
}

function useTemplate(template: Template) {
  // 打开对话框，让用户输入新文档的标题和描述
  ElMessageBox.prompt(
    '请输入新文档的标题',
    '使用模板',
    {
      confirmButtonText: '创建',
      cancelButtonText: '取消',
      inputValue: template.title,
      inputPlaceholder: '请输入文档标题',
      inputValidator: (value) => {
        if (!value.trim()) {
          return '标题不能为空'
        }
        return true
      }
    }
  ).then(async ({ value }) => {
    try {
      const response = await createDocumentFromTemplate(template.id, {
        title: value,
        description: template.description
      })

      ElMessage.success('文档创建成功')

      // 发出事件，通知父组件文档已创建
      emit('template-selected', {
        ...template,
        documentId: response.data.document_id,
        title: value
      })
    } catch (error) {
      console.error('Failed to create document from template', error)
      ElMessage.error('创建文档失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

function previewTemplate(template: any) {
  selectedTemplate.value = template
  showPreviewDialog.value = true
  previewLoading.value = true

  // 模拟加载预览
  setTimeout(() => {
    previewLoading.value = false
  }, 1000)
}

function handleCommand(command: string, template: any) {
  if (command === 'edit') {
    editTemplate(template)
  } else if (command === 'delete') {
    deleteTemplate(template)
  }
}

function editTemplate(template: any) {
  selectedTemplate.value = template

  // 复制模板数据到表单
  Object.assign(editForm, {
    id: template.id,
    title: template.title,
    description: template.description,
    category_id: template.category_id
  })

  // 设置缩略图预览
  editThumbnailUrl.value = template.thumbnail_url || ''

  showEditDialog.value = true
}

function deleteTemplate(template: Template) {
  ElMessageBox.confirm(
    `确定要删除模板 "${template.title}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await apiDeleteTemplate(template.id)

      ElMessage.success(`模板 "${template.title}" 已删除`)

      // 从列表中移除
      templates.value = templates.value.filter(t => t.id !== template.id)

      emit('template-deleted', template)
    } catch (error) {
      console.error('Failed to delete template', error)
      ElMessage.error('删除模板失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

async function createTemplate() {
  if (!createFormRef.value) return

  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      if (!createForm.file) {
        ElMessage.warning('请上传文件')
        return
      }

      submitting.value = true

      try {
        const formData = new FormData()
        formData.append('title', createForm.title)
        formData.append('description', createForm.description || '')
        formData.append('type', createForm.type)
        if (createForm.category_id) {
          formData.append('category_id', createForm.category_id)
        }
        formData.append('file', createForm.file)
        formData.append('is_public', 'true') // 默认公开

        if (createForm.thumbnail) {
          formData.append('thumbnail', createForm.thumbnail)
        }

        const response = await apiCreateTemplate(formData)

        ElMessage.success('模板创建成功')
        showCreateDialog.value = false

        // 重置表单
        createForm.title = ''
        createForm.description = ''
        createForm.type = 'WORD'
        createForm.category_id = ''
        createForm.file = null
        createForm.thumbnail = null
        thumbnailUrl.value = ''

        // 重新加载模板列表
        await loadTemplates()

        emit('template-created', response.data)
      } catch (error) {
        console.error('Failed to create template', error)
        ElMessage.error('创建模板失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

async function updateTemplate() {
  if (!editFormRef.value) return

  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true

      try {
        const formData = new FormData()
        formData.append('title', editForm.title)
        if (editForm.description) {
          formData.append('description', editForm.description)
        }
        if (editForm.category_id) {
          formData.append('category_id', editForm.category_id)
        }
        if (editForm.thumbnail) {
          formData.append('thumbnail', editForm.thumbnail)
        }

        const response = await apiUpdateTemplate(editForm.id, formData)

        ElMessage.success('模板更新成功')
        showEditDialog.value = false

        // 更新本地数据
        const index = templates.value.findIndex(t => t.id === editForm.id)
        if (index !== -1) {
          templates.value[index] = response.data
        }

        emit('template-updated', response.data)
      } catch (error) {
        console.error('Failed to update template', error)
        ElMessage.error('更新模板失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

function formatDocumentType(type: string) {
  const typeMap: Record<string, string> = {
    'WORD': '文档',
    'EXCEL': '表格',
    'PPT': '演示文稿',
    'PDF': 'PDF',
    'MARKDOWN': 'Markdown'
  }

  return typeMap[type] || type
}

function getTagType(type: string) {
  const typeMap: Record<string, string> = {
    'WORD': 'primary',
    'EXCEL': 'success',
    'PPT': 'warning',
    'PDF': 'danger',
    'MARKDOWN': 'info'
  }

  return typeMap[type] || ''
}
</script>

<style scoped>
.template-gallery {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.gallery-header h3 {
  margin: 0;
}

.gallery-filters {
  display: flex;
  gap: 16px;
  flex: 1;
  justify-content: center;
}

.gallery-filters .el-input {
  width: 200px;
}

.gallery-loading {
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

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.template-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  position: relative;
}

.template-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px 0 rgba(0, 0, 0, 0.15);
}

.template-preview {
  height: 160px;
  background-color: var(--background-color-base);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.template-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-icon {
  font-size: 48px;
  color: var(--text-color-secondary);
}

.template-info {
  padding: 16px;
}

.template-title {
  font-weight: 500;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-author {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.template-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.template-card:hover .template-actions {
  opacity: 1;
}

.upload-area {
  width: 100%;
}

.thumbnail-upload {
  width: 150px;
  height: 100px;
  border: 1px dashed var(--border-color-base);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.thumbnail-upload:hover {
  border-color: var(--primary-color);
}

.thumbnail-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-icon {
  font-size: 24px;
  color: var(--text-color-secondary);
}

.thumbnail-tip {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-top: 4px;
}

.preview-loading {
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.preview-container {
  height: 600px;
  overflow: auto;
}

.preview-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-color-secondary);
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>
