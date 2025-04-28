<template>
  <div class="settings-container">
    <h2>设置</h2>
    
    <el-tabs v-model="activeTab" tab-position="left" class="settings-tabs">
      <el-tab-pane label="个人资料" name="profile">
        <h3>个人资料</h3>
        
        <el-form
          :model="profileForm"
          label-position="top"
          :disabled="isUpdatingProfile"
        >
          <el-form-item label="用户名">
            <el-input v-model="profileForm.username" disabled />
          </el-form-item>
          
          <el-form-item label="邮箱">
            <el-input v-model="profileForm.email" disabled />
          </el-form-item>
          
          <el-form-item label="姓名">
            <el-input v-model="profileForm.fullName" />
          </el-form-item>
          
          <el-form-item label="头像">
            <div class="avatar-uploader">
              <el-avatar
                :size="100"
                :src="profileForm.avatarUrl"
              >
                {{ userInitials }}
              </el-avatar>
              <el-upload
                class="avatar-upload"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleAvatarChange"
              >
                <el-button size="small">更换头像</el-button>
              </el-upload>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              @click="updateProfile"
              :loading="isUpdatingProfile"
            >
              保存
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <el-tab-pane label="修改密码" name="password">
        <h3>修改密码</h3>
        
        <el-form
          :model="passwordForm"
          :rules="passwordRules"
          ref="passwordFormRef"
          label-position="top"
          :disabled="isUpdatingPassword"
        >
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input
              v-model="passwordForm.currentPassword"
              type="password"
              show-password
            />
          </el-form-item>
          
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              show-password
            />
          </el-form-item>
          
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              @click="updatePassword"
              :loading="isUpdatingPassword"
            >
              更新密码
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <el-tab-pane label="通知设置" name="notifications">
        <h3>通知设置</h3>
        
        <el-form :model="notificationForm">
          <el-form-item label="电子邮件通知">
            <el-switch v-model="notificationForm.emailEnabled" />
          </el-form-item>
          
          <el-form-item label="接收通知类型">
            <el-checkbox-group v-model="notificationForm.notificationTypes">
              <el-checkbox label="document_share">文档分享</el-checkbox>
              <el-checkbox label="document_edit">文档编辑</el-checkbox>
              <el-checkbox label="comment">评论</el-checkbox>
              <el-checkbox label="system">系统通知</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveNotificationSettings">
              保存设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <el-tab-pane label="界面设置" name="appearance">
        <h3>界面设置</h3>
        
        <el-form :model="appearanceForm">
          <el-form-item label="主题">
            <el-radio-group v-model="appearanceForm.theme">
              <el-radio label="light">浅色</el-radio>
              <el-radio label="dark">深色</el-radio>
              <el-radio label="system">跟随系统</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="字体大小">
            <el-slider
              v-model="appearanceForm.fontSize"
              :min="12"
              :max="20"
              :step="1"
              show-input
            />
          </el-form-item>
          
          <el-form-item label="默认视图模式">
            <el-radio-group v-model="appearanceForm.defaultViewMode">
              <el-radio label="grid">网格视图</el-radio>
              <el-radio label="list">列表视图</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveAppearanceSettings">
              保存设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 标签页
const activeTab = ref('profile')

// 个人资料表单
const profileForm = ref({
  username: authStore.user?.username || '',
  email: authStore.user?.email || '',
  fullName: authStore.user?.full_name || '',
  avatarUrl: authStore.user?.avatar_url || ''
})

const isUpdatingProfile = ref(false)

// 密码表单
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能少于8个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const passwordFormRef = ref<FormInstance>()
const isUpdatingPassword = ref(false)

// 通知设置表单
const notificationForm = ref({
  emailEnabled: true,
  notificationTypes: ['document_share', 'document_edit', 'system']
})

// 界面设置表单
const appearanceForm = ref({
  theme: 'light',
  fontSize: 14,
  defaultViewMode: 'grid'
})

// 计算属性
const userInitials = computed(() => {
  const name = authStore.user?.full_name || authStore.user?.username || ''
  return name.substring(0, 2).toUpperCase()
})

// 方法
function handleAvatarChange(file: any) {
  // 在实际应用中，这里应该上传文件并获取URL
  // 暂时使用本地URL预览
  profileForm.value.avatarUrl = URL.createObjectURL(file.raw)
}

async function updateProfile() {
  isUpdatingProfile.value = true
  
  try {
    // 这里应该调用API更新个人资料
    // await updateUserProfile(profileForm.value)
    
    // 更新本地存储的用户信息
    if (authStore.user) {
      authStore.user.full_name = profileForm.value.fullName
      authStore.user.avatar_url = profileForm.value.avatarUrl
      
      // 更新localStorage
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }
    
    ElMessage.success('个人资料已更新')
  } catch (error) {
    console.error('Failed to update profile', error)
    ElMessage.error('更新个人资料失败')
  } finally {
    isUpdatingProfile.value = false
  }
}

async function updatePassword() {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      isUpdatingPassword.value = true
      
      try {
        // 这里应该调用API更新密码
        // await updateUserPassword(passwordForm.value)
        
        ElMessage.success('密码已更新')
        
        // 重置表单
        passwordForm.value = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      } catch (error) {
        console.error('Failed to update password', error)
        ElMessage.error('更新密码失败')
      } finally {
        isUpdatingPassword.value = false
      }
    }
  })
}

function saveNotificationSettings() {
  // 这里应该调用API保存通知设置
  // await saveUserNotificationSettings(notificationForm.value)
  
  ElMessage.success('通知设置已保存')
}

function saveAppearanceSettings() {
  // 这里应该调用API保存界面设置
  // await saveUserAppearanceSettings(appearanceForm.value)
  
  // 应用主题设置
  document.documentElement.setAttribute('data-theme', appearanceForm.value.theme)
  
  // 应用字体大小
  document.documentElement.style.fontSize = `${appearanceForm.value.fontSize}px`
  
  ElMessage.success('界面设置已保存')
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.settings-container h2 {
  margin-top: 0;
  margin-bottom: 24px;
}

.settings-tabs {
  min-height: 500px;
}

.settings-tabs :deep(.el-tabs__content) {
  padding: 0 20px;
}

.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-upload {
  margin-top: 8px;
}
</style>
