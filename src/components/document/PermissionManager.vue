<template>
  <div class="permission-manager">
    <div class="permission-header">
      <h3>权限管理</h3>
      <p class="permission-description">
        管理用户对"{{ resourceName }}"的访问权限
      </p>
    </div>
    
    <div class="permission-actions">
      <el-button type="primary" @click="showAddPermissionDialog = true">
        添加用户
      </el-button>
    </div>
    
    <div v-if="loading" class="permission-loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <el-empty v-else-if="permissions.length === 0" description="暂无权限设置">
      <template #description>
        <p>当前没有其他用户被授予访问权限</p>
      </template>
    </el-empty>
    
    <div v-else class="permission-list">
      <el-table :data="permissions" style="width: 100%">
        <el-table-column label="用户" min-width="200">
          <template #default="scope">
            <div class="user-cell">
              <el-avatar :size="32" :src="scope.row.user?.avatar_url">
                {{ getUserInitials(scope.row.user) }}
              </el-avatar>
              <div class="user-info">
                <div class="username">{{ scope.row.user?.username || '未知用户' }}</div>
                <div class="email">{{ scope.row.user?.email || '' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="权限" width="120">
          <template #default="scope">
            <el-tag :type="getPermissionTagType(scope.row.permission_level)">
              {{ getPermissionLabel(scope.row.permission_level) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="授予时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-dropdown trigger="click" @command="(command) => handleCommand(command, scope.row)">
              <el-button size="small">
                操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">修改权限</el-dropdown-item>
                  <el-dropdown-item command="remove" divided>移除权限</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 添加权限对话框 -->
    <el-dialog
      v-model="showAddPermissionDialog"
      title="添加用户权限"
      width="500px"
    >
      <el-form
        ref="addPermissionFormRef"
        :model="addPermissionForm"
        :rules="addPermissionFormRules"
        label-width="80px"
      >
        <el-form-item label="用户" prop="userId">
          <el-select
            v-model="addPermissionForm.userId"
            filterable
            remote
            reserve-keyword
            placeholder="搜索用户"
            :remote-method="searchUsers"
            :loading="searchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            >
              <div class="user-option">
                <el-avatar :size="24" :src="user.avatar_url">
                  {{ getUserInitials(user) }}
                </el-avatar>
                <div class="user-info">
                  <div class="username">{{ user.username }}</div>
                  <div class="email">{{ user.email }}</div>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="权限" prop="permissionLevel">
          <el-radio-group v-model="addPermissionForm.permissionLevel">
            <div v-for="option in PERMISSION_OPTIONS" :key="option.value" class="permission-radio-item">
              <el-radio :label="option.value">
                {{ option.label }}
              </el-radio>
              <div class="permission-description">{{ option.description }}</div>
            </div>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="通知" prop="notify">
          <el-switch v-model="addPermissionForm.notify" />
          <span class="form-tip">通知用户已获得访问权限</span>
        </el-form-item>
        
        <el-form-item v-if="addPermissionForm.notify" label="消息" prop="message">
          <el-input
            v-model="addPermissionForm.message"
            type="textarea"
            :rows="3"
            placeholder="添加一条消息（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddPermissionDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="addPermission">
          添加
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 编辑权限对话框 -->
    <el-dialog
      v-model="showEditPermissionDialog"
      title="修改权限"
      width="500px"
    >
      <el-form
        ref="editPermissionFormRef"
        :model="editPermissionForm"
        label-width="80px"
      >
        <el-form-item label="用户">
          <div class="user-display">
            <el-avatar :size="32" :src="selectedPermission?.user?.avatar_url">
              {{ getUserInitials(selectedPermission?.user) }}
            </el-avatar>
            <div class="user-info">
              <div class="username">{{ selectedPermission?.user?.username || '未知用户' }}</div>
              <div class="email">{{ selectedPermission?.user?.email || '' }}</div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="权限" prop="permissionLevel">
          <el-radio-group v-model="editPermissionForm.permissionLevel">
            <div v-for="option in PERMISSION_OPTIONS" :key="option.value" class="permission-radio-item">
              <el-radio :label="option.value">
                {{ option.label }}
              </el-radio>
              <div class="permission-description">{{ option.description }}</div>
            </div>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="通知" prop="notify">
          <el-switch v-model="editPermissionForm.notify" />
          <span class="form-tip">通知用户权限已更改</span>
        </el-form-item>
        
        <el-form-item v-if="editPermissionForm.notify" label="消息" prop="message">
          <el-input
            v-model="editPermissionForm.message"
            type="textarea"
            :rows="3"
            placeholder="添加一条消息（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditPermissionDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="updatePermission">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineProps, defineEmits, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Loading, ArrowDown } from '@element-plus/icons-vue'
import { formatDate as formatDateUtil } from '@/utils/date'
import { useAuthStore } from '@/stores/auth'
import type { DocumentPermission, PermissionLevel } from '@/types/permission'
import { PERMISSION_OPTIONS, getPermissionLabel, getPermissionTagType } from '@/types/permission'
import {
  getDocumentPermissions,
  addDocumentPermission,
  updateDocumentPermission,
  removeDocumentPermission,
  getFolderPermissions,
  addFolderPermission,
  updateFolderPermission,
  removeFolderPermission
} from '@/api/permission'

// 定义属性
const props = defineProps({
  resourceId: {
    type: String,
    required: true
  },
  resourceName: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    default: 'document',
    validator: (value: string) => ['document', 'folder'].includes(value)
  }
})

// 定义事件
const emit = defineEmits(['permission-added', 'permission-updated', 'permission-removed'])

// 状态
const authStore = useAuthStore()
const loading = ref(true)
const searchLoading = ref(false)
const submitting = ref(false)
const permissions = ref<DocumentPermission[]>([])
const userOptions = ref<any[]>([])
const selectedPermission = ref<DocumentPermission | null>(null)

// 对话框状态
const showAddPermissionDialog = ref(false)
const showEditPermissionDialog = ref(false)

// 表单引用
const addPermissionFormRef = ref<FormInstance>()
const editPermissionFormRef = ref<FormInstance>()

// 添加权限表单
const addPermissionForm = reactive({
  userId: '',
  permissionLevel: 'READ' as PermissionLevel,
  notify: true,
  message: ''
})

// 编辑权限表单
const editPermissionForm = reactive({
  permissionLevel: 'READ' as PermissionLevel,
  notify: true,
  message: ''
})

// 表单验证规则
const addPermissionFormRules = reactive<FormRules>({
  userId: [
    { required: true, message: '请选择用户', trigger: 'change' }
  ],
  permissionLevel: [
    { required: true, message: '请选择权限级别', trigger: 'change' }
  ]
})

// 生命周期钩子
onMounted(() => {
  loadPermissions()
})

// 方法
async function loadPermissions() {
  loading.value = true
  
  try {
    let response;
    if (props.resourceType === 'document') {
      response = await getDocumentPermissions(props.resourceId)
    } else {
      response = await getFolderPermissions(props.resourceId)
    }
    
    permissions.value = response.data.items
  } catch (error) {
    console.error('Failed to load permissions', error)
    ElMessage.error('加载权限列表失败')
    
    // 模拟数据
    permissions.value = [
      {
        id: '1',
        document_id: props.resourceId,
        user_id: '101',
        permission_level: 'READ',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        user: {
          id: '101',
          username: 'user1',
          email: 'user1@example.com',
          avatar_url: ''
        }
      },
      {
        id: '2',
        document_id: props.resourceId,
        user_id: '102',
        permission_level: 'WRITE',
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        user: {
          id: '102',
          username: 'user2',
          email: 'user2@example.com',
          avatar_url: ''
        }
      },
      {
        id: '3',
        document_id: props.resourceId,
        user_id: '103',
        permission_level: 'ADMIN',
        created_at: '2023-01-03T00:00:00Z',
        updated_at: '2023-01-03T00:00:00Z',
        user: {
          id: '103',
          username: 'user3',
          email: 'user3@example.com',
          avatar_url: ''
        }
      }
    ]
  } finally {
    loading.value = false
  }
}

async function searchUsers(query: string) {
  if (query.length < 2) return
  
  searchLoading.value = true
  
  try {
    // 这里应该调用API搜索用户
    // const response = await searchUsers(query)
    // userOptions.value = response.data.items
    
    // 模拟数据
    userOptions.value = [
      {
        id: '101',
        username: 'user1',
        email: 'user1@example.com',
        avatar_url: ''
      },
      {
        id: '102',
        username: 'user2',
        email: 'user2@example.com',
        avatar_url: ''
      },
      {
        id: '103',
        username: 'user3',
        email: 'user3@example.com',
        avatar_url: ''
      },
      {
        id: '104',
        username: 'user4',
        email: 'user4@example.com',
        avatar_url: ''
      },
      {
        id: '105',
        username: 'user5',
        email: 'user5@example.com',
        avatar_url: ''
      }
    ].filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    )
  } catch (error) {
    console.error('Failed to search users', error)
    ElMessage.error('搜索用户失败')
  } finally {
    searchLoading.value = false
  }
}

function handleCommand(command: string, permission: DocumentPermission) {
  selectedPermission.value = permission
  
  switch (command) {
    case 'edit':
      editPermissionForm.permissionLevel = permission.permission_level
      editPermissionForm.notify = true
      editPermissionForm.message = ''
      showEditPermissionDialog.value = true
      break
      
    case 'remove':
      removePermissionConfirm(permission)
      break
  }
}

async function addPermission() {
  if (!addPermissionFormRef.value) return
  
  await addPermissionFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      try {
        let response;
        if (props.resourceType === 'document') {
          response = await addDocumentPermission(
            props.resourceId,
            addPermissionForm.userId,
            addPermissionForm.permissionLevel
          )
        } else {
          response = await addFolderPermission(
            props.resourceId,
            addPermissionForm.userId,
            addPermissionForm.permissionLevel
          )
        }
        
        // 添加到列表
        permissions.value.push(response.data)
        
        // 重置表单
        addPermissionForm.userId = ''
        addPermissionForm.permissionLevel = 'READ'
        addPermissionForm.notify = true
        addPermissionForm.message = ''
        
        showAddPermissionDialog.value = false
        
        ElMessage.success('权限添加成功')
        
        emit('permission-added', response.data)
      } catch (error) {
        console.error('Failed to add permission', error)
        ElMessage.error('添加权限失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

async function updatePermission() {
  if (!selectedPermission.value) return
  
  submitting.value = true
  
  try {
    let response;
    if (props.resourceType === 'document') {
      response = await updateDocumentPermission(
        props.resourceId,
        selectedPermission.value.id,
        editPermissionForm.permissionLevel
      )
    } else {
      response = await updateFolderPermission(
        props.resourceId,
        selectedPermission.value.id,
        editPermissionForm.permissionLevel
      )
    }
    
    // 更新列表中的权限
    const index = permissions.value.findIndex(p => p.id === selectedPermission.value?.id)
    if (index !== -1) {
      permissions.value[index] = response.data
    }
    
    showEditPermissionDialog.value = false
    
    ElMessage.success('权限更新成功')
    
    emit('permission-updated', response.data)
  } catch (error) {
    console.error('Failed to update permission', error)
    ElMessage.error('更新权限失败')
  } finally {
    submitting.value = false
  }
}

function removePermissionConfirm(permission: DocumentPermission) {
  ElMessageBox.confirm(
    `确定要移除用户 "${permission.user?.username || '未知用户'}" 的权限吗？`,
    '移除权限',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      if (props.resourceType === 'document') {
        await removeDocumentPermission(props.resourceId, permission.id)
      } else {
        await removeFolderPermission(props.resourceId, permission.id)
      }
      
      // 从列表中移除
      permissions.value = permissions.value.filter(p => p.id !== permission.id)
      
      ElMessage.success('权限已移除')
      
      emit('permission-removed', permission)
    } catch (error) {
      console.error('Failed to remove permission', error)
      ElMessage.error('移除权限失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

function getUserInitials(user: any): string {
  if (!user) return '?'
  
  if (user.full_name) {
    return user.full_name.split(' ').map(name => name[0]).join('').toUpperCase().substring(0, 2)
  }
  
  return user.username.substring(0, 2).toUpperCase()
}

function formatDate(dateString: string): string {
  return formatDateUtil(dateString, 'YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.permission-manager {
  padding: 16px;
}

.permission-header {
  margin-bottom: 20px;
}

.permission-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.permission-description {
  color: #606266;
  margin: 0;
}

.permission-actions {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.permission-loading {
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

.user-cell {
  display: flex;
  align-items: center;
}

.user-info {
  margin-left: 12px;
}

.username {
  font-weight: 500;
}

.email {
  font-size: 12px;
  color: #909399;
}

.user-option {
  display: flex;
  align-items: center;
}

.user-display {
  display: flex;
  align-items: center;
}

.permission-radio-item {
  margin-bottom: 12px;
}

.permission-description {
  margin-left: 24px;
  font-size: 12px;
  color: #909399;
}

.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
