<template>
  <div class="admin-users-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="showCreateUserDialog = true">创建用户</el-button>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户"
        prefix-icon="Search"
        clearable
        @clear="loadUsers"
        @keyup.enter="searchUsers"
      >
        <template #append>
          <el-button :icon="Search" @click="searchUsers" />
        </template>
      </el-input>
      
      <el-select v-model="filterStatus" placeholder="状态" @change="loadUsers">
        <el-option label="全部" value="" />
        <el-option label="激活" value="active" />
        <el-option label="禁用" value="inactive" />
      </el-select>
      
      <el-select v-model="filterRole" placeholder="角色" @change="loadUsers">
        <el-option label="全部" value="" />
        <el-option label="管理员" value="admin" />
        <el-option label="普通用户" value="user" />
      </el-select>
    </div>
    
    <div class="users-table">
      <el-table
        v-loading="loading"
        :data="users"
        style="width: 100%"
        border
      >
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="full_name" label="姓名" min-width="120" />
        
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.is_active ? 'success' : 'danger'"
              disable-transitions
            >
              {{ scope.row.is_active ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="角色" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.is_admin ? 'warning' : 'info'"
              disable-transitions
            >
              {{ scope.row.is_admin ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              @click="editUser(scope.row)"
            >
              编辑
            </el-button>
            
            <el-button
              size="small"
              :type="scope.row.is_active ? 'danger' : 'success'"
              @click="toggleUserStatus(scope.row)"
            >
              {{ scope.row.is_active ? '禁用' : '激活' }}
            </el-button>
            
            <el-dropdown trigger="click" @command="(command) => handleCommand(command, scope.row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="resetPassword">重置密码</el-dropdown-item>
                  <el-dropdown-item command="viewDocuments">查看文档</el-dropdown-item>
                  <el-dropdown-item
                    v-if="!scope.row.is_admin"
                    command="makeAdmin"
                  >
                    设为管理员
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-else
                    command="removeAdmin"
                  >
                    取消管理员
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalUsers"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 创建用户对话框 -->
    <el-dialog
      v-model="showCreateUserDialog"
      title="创建用户"
      width="500px"
    >
      <el-form
        ref="createUserFormRef"
        :model="createUserForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createUserForm.username" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="createUserForm.email" />
        </el-form-item>
        
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="createUserForm.full_name" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="createUserForm.password" type="password" show-password />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="createUserForm.confirmPassword" type="password" show-password />
        </el-form-item>
        
        <el-form-item label="角色">
          <el-radio-group v-model="createUserForm.is_admin">
            <el-radio :label="false">普通用户</el-radio>
            <el-radio :label="true">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateUserDialog = false">取消</el-button>
        <el-button type="primary" @click="createUser" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>
    
    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="showEditUserDialog"
      title="编辑用户"
      width="500px"
    >
      <el-form
        ref="editUserFormRef"
        :model="editUserForm"
        :rules="editUserFormRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editUserForm.username" disabled />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editUserForm.email" />
        </el-form-item>
        
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="editUserForm.full_name" />
        </el-form-item>
        
        <el-form-item label="角色">
          <el-radio-group v-model="editUserForm.is_admin">
            <el-radio :label="false">普通用户</el-radio>
            <el-radio :label="true">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="editUserForm.is_active">
            <el-radio :label="true">激活</el-radio>
            <el-radio :label="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditUserDialog = false">取消</el-button>
        <el-button type="primary" @click="updateUser" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="showResetPasswordDialog"
      title="重置密码"
      width="500px"
    >
      <p>您正在为用户 <strong>{{ selectedUser?.username }}</strong> 重置密码。</p>
      
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetPasswordForm.password" type="password" show-password />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetPasswordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showResetPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="resetPassword" :loading="submitting">重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { formatDate as formatDateUtil } from '@/utils/date'

// 状态
const loading = ref(true)
const submitting = ref(false)
const users = ref<any[]>([])
const totalUsers = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const filterStatus = ref('')
const filterRole = ref('')
const selectedUser = ref<any | null>(null)

// 对话框状态
const showCreateUserDialog = ref(false)
const showEditUserDialog = ref(false)
const showResetPasswordDialog = ref(false)

// 表单引用
const createUserFormRef = ref<FormInstance>()
const editUserFormRef = ref<FormInstance>()
const resetPasswordFormRef = ref<FormInstance>()

// 表单数据
const createUserForm = reactive({
  username: '',
  email: '',
  full_name: '',
  password: '',
  confirmPassword: '',
  is_admin: false
})

const editUserForm = reactive({
  id: '',
  username: '',
  email: '',
  full_name: '',
  is_admin: false,
  is_active: true
})

const resetPasswordForm = reactive({
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const userFormRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== createUserForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const editUserFormRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ]
}

const resetPasswordRules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPasswordForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 生命周期钩子
onMounted(() => {
  loadUsers()
})

// 方法
async function loadUsers() {
  loading.value = true
  
  try {
    // 这里应该调用API获取用户列表
    // const response = await getUsers({
    //   page: currentPage.value,
    //   size: pageSize.value,
    //   query: searchQuery.value,
    //   status: filterStatus.value,
    //   role: filterRole.value
    // })
    
    // 模拟数据
    const mockUsers = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        full_name: '管理员',
        is_admin: true,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '2',
        username: 'user1',
        email: 'user1@example.com',
        full_name: '用户1',
        is_admin: false,
        is_active: true,
        created_at: '2023-01-02T00:00:00Z'
      },
      {
        id: '3',
        username: 'user2',
        email: 'user2@example.com',
        full_name: '用户2',
        is_admin: false,
        is_active: false,
        created_at: '2023-01-03T00:00:00Z'
      }
    ]
    
    users.value = mockUsers
    totalUsers.value = mockUsers.length
  } catch (error) {
    console.error('Failed to load users', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

function searchUsers() {
  currentPage.value = 1
  loadUsers()
}

function handleSizeChange() {
  currentPage.value = 1
  loadUsers()
}

function handleCurrentChange() {
  loadUsers()
}

function editUser(user: any) {
  selectedUser.value = user
  
  // 复制用户数据到表单
  Object.assign(editUserForm, {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    is_admin: user.is_admin,
    is_active: user.is_active
  })
  
  showEditUserDialog.value = true
}

async function toggleUserStatus(user: any) {
  const action = user.is_active ? '禁用' : '激活'
  
  ElMessageBox.confirm(
    `确定要${action}用户 "${user.username}" 吗？`,
    `${action}确认`,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 这里应该调用API更新用户状态
      // await updateUserStatus(user.id, !user.is_active)
      
      // 更新本地数据
      user.is_active = !user.is_active
      
      ElMessage.success(`已${action}用户 "${user.username}"`)
    } catch (error) {
      console.error(`Failed to ${action} user`, error)
      ElMessage.error(`${action}用户失败`)
    }
  }).catch(() => {
    // 用户取消操作
  })
}

function handleCommand(command: string, user: any) {
  selectedUser.value = user
  
  switch (command) {
    case 'resetPassword':
      resetPasswordForm.password = ''
      resetPasswordForm.confirmPassword = ''
      showResetPasswordDialog.value = true
      break
      
    case 'viewDocuments':
      // 跳转到用户文档页面
      // router.push(`/admin/users/${user.id}/documents`)
      ElMessage.info('查看用户文档功能尚未实现')
      break
      
    case 'makeAdmin':
      makeAdmin(user)
      break
      
    case 'removeAdmin':
      removeAdmin(user)
      break
  }
}

async function makeAdmin(user: any) {
  ElMessageBox.confirm(
    `确定要将用户 "${user.username}" 设为管理员吗？`,
    '设置管理员',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 这里应该调用API更新用户角色
      // await updateUserRole(user.id, true)
      
      // 更新本地数据
      user.is_admin = true
      
      ElMessage.success(`已将用户 "${user.username}" 设为管理员`)
    } catch (error) {
      console.error('Failed to make admin', error)
      ElMessage.error('设置管理员失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

async function removeAdmin(user: any) {
  ElMessageBox.confirm(
    `确定要取消用户 "${user.username}" 的管理员权限吗？`,
    '取消管理员',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 这里应该调用API更新用户角色
      // await updateUserRole(user.id, false)
      
      // 更新本地数据
      user.is_admin = false
      
      ElMessage.success(`已取消用户 "${user.username}" 的管理员权限`)
    } catch (error) {
      console.error('Failed to remove admin', error)
      ElMessage.error('取消管理员权限失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

async function createUser() {
  if (!createUserFormRef.value) return
  
  await createUserFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      try {
        // 这里应该调用API创建用户
        // await createUser({
        //   username: createUserForm.username,
        //   email: createUserForm.email,
        //   full_name: createUserForm.full_name,
        //   password: createUserForm.password,
        //   is_admin: createUserForm.is_admin
        // })
        
        ElMessage.success(`用户 "${createUserForm.username}" 创建成功`)
        showCreateUserDialog.value = false
        
        // 重置表单
        createUserForm.username = ''
        createUserForm.email = ''
        createUserForm.full_name = ''
        createUserForm.password = ''
        createUserForm.confirmPassword = ''
        createUserForm.is_admin = false
        
        // 重新加载用户列表
        await loadUsers()
      } catch (error) {
        console.error('Failed to create user', error)
        ElMessage.error('创建用户失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

async function updateUser() {
  if (!editUserFormRef.value) return
  
  await editUserFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      try {
        // 这里应该调用API更新用户
        // await updateUser(editUserForm.id, {
        //   email: editUserForm.email,
        //   full_name: editUserForm.full_name,
        //   is_admin: editUserForm.is_admin,
        //   is_active: editUserForm.is_active
        // })
        
        ElMessage.success(`用户 "${editUserForm.username}" 更新成功`)
        showEditUserDialog.value = false
        
        // 更新本地数据
        if (selectedUser.value) {
          selectedUser.value.email = editUserForm.email
          selectedUser.value.full_name = editUserForm.full_name
          selectedUser.value.is_admin = editUserForm.is_admin
          selectedUser.value.is_active = editUserForm.is_active
        }
      } catch (error) {
        console.error('Failed to update user', error)
        ElMessage.error('更新用户失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

async function resetPassword() {
  if (!resetPasswordFormRef.value || !selectedUser.value) return
  
  await resetPasswordFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      try {
        // 这里应该调用API重置密码
        // await resetUserPassword(selectedUser.value.id, resetPasswordForm.password)
        
        ElMessage.success(`用户 "${selectedUser.value.username}" 的密码已重置`)
        showResetPasswordDialog.value = false
      } catch (error) {
        console.error('Failed to reset password', error)
        ElMessage.error('重置密码失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

function formatDate(dateString: string) {
  return formatDateUtil(dateString)
}
</script>

<style scoped>
.admin-users-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}

.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-bar .el-input {
  width: 300px;
}

.users-table {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
