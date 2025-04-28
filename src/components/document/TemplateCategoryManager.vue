<template>
  <div class="category-manager">
    <div class="category-header">
      <h3>模板分类管理</h3>
      <el-button type="primary" @click="showCreateDialog = true">
        添加分类
      </el-button>
    </div>
    
    <div v-if="loading" class="category-loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <el-empty v-else-if="categories.length === 0" description="暂无分类">
      <el-button type="primary" @click="showCreateDialog = true">
        添加分类
      </el-button>
    </el-empty>
    
    <el-table v-else :data="categories" style="width: 100%">
      <el-table-column prop="name" label="分类名称" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="template_count" label="模板数量" width="100" align="center" />
      <el-table-column label="创建时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            plain
            @click="editCategory(scope.row)"
          >
            编辑
          </el-button>
          <el-button
            size="small"
            type="danger"
            plain
            @click="deleteCategory(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 创建分类对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="添加分类"
      width="500px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createCategory" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>
    
    <!-- 编辑分类对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑分类"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updateCategory" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineEmits } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { formatDate as formatDateUtil } from '@/utils/date'
import {
  getTemplateCategories,
  createTemplateCategory,
  updateTemplateCategory,
  deleteTemplateCategory
} from '@/api/template'
import type { TemplateCategory } from '@/types/template'

// 定义事件
const emit = defineEmits(['category-created', 'category-updated', 'category-deleted'])

// 状态
const loading = ref(true)
const submitting = ref(false)
const categories = ref<TemplateCategory[]>([])

// 对话框状态
const showCreateDialog = ref(false)
const showEditDialog = ref(false)

// 表单引用
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()

// 表单数据
const createForm = reactive({
  name: '',
  description: ''
})

const editForm = reactive({
  id: '',
  name: '',
  description: ''
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 生命周期钩子
onMounted(() => {
  loadCategories()
})

// 方法
async function loadCategories() {
  loading.value = true
  
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
  } finally {
    loading.value = false
  }
}

function editCategory(category: TemplateCategory) {
  // 复制分类数据到表单
  Object.assign(editForm, {
    id: category.id,
    name: category.name,
    description: category.description || ''
  })
  
  showEditDialog.value = true
}

function deleteCategory(category: TemplateCategory) {
  // 检查是否有模板使用此分类
  if (category.template_count && category.template_count > 0) {
    ElMessageBox.confirm(
      `此分类下有 ${category.template_count} 个模板，删除分类将会移除这些模板的分类关联，确定要继续吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      confirmDeleteCategory(category)
    }).catch(() => {
      // 用户取消删除
    })
  } else {
    confirmDeleteCategory(category)
  }
}

function confirmDeleteCategory(category: TemplateCategory) {
  ElMessageBox.confirm(
    `确定要删除分类 "${category.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteTemplateCategory(category.id)
      
      ElMessage.success(`分类 "${category.name}" 已删除`)
      
      // 从列表中移除
      categories.value = categories.value.filter(c => c.id !== category.id)
      
      emit('category-deleted', category)
    } catch (error) {
      console.error('Failed to delete category', error)
      ElMessage.error('删除分类失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

async function createCategory() {
  if (!createFormRef.value) return
  
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      try {
        const response = await createTemplateCategory({
          name: createForm.name,
          description: createForm.description
        })
        
        ElMessage.success('分类创建成功')
        showCreateDialog.value = false
        
        // 添加到列表
        categories.value.push(response.data)
        
        // 重置表单
        createForm.name = ''
        createForm.description = ''
        
        emit('category-created', response.data)
      } catch (error) {
        console.error('Failed to create category', error)
        ElMessage.error('创建分类失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

async function updateCategory() {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      try {
        const response = await updateTemplateCategory(editForm.id, {
          name: editForm.name,
          description: editForm.description
        })
        
        ElMessage.success('分类更新成功')
        showEditDialog.value = false
        
        // 更新列表中的数据
        const index = categories.value.findIndex(c => c.id === editForm.id)
        if (index !== -1) {
          categories.value[index] = response.data
        }
        
        emit('category-updated', response.data)
      } catch (error) {
        console.error('Failed to update category', error)
        ElMessage.error('更新分类失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

function formatDate(dateString: string): string {
  return formatDateUtil(dateString, 'YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.category-manager {
  padding: 16px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.category-header h3 {
  margin: 0;
}

.category-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
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
</style>
