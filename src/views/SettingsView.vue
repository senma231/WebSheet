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

        <el-form
          :model="notificationForm"
          :disabled="isUpdatingNotifications"
        >
          <h4>通知渠道</h4>
          <el-form-item>
            <el-checkbox v-model="notificationForm.emailNotifications">电子邮件通知</el-checkbox>
            <el-checkbox v-model="notificationForm.pushNotifications">浏览器推送通知</el-checkbox>
            <el-checkbox v-model="notificationForm.systemNotifications">系统内通知</el-checkbox>
          </el-form-item>

          <h4>通知类型</h4>
          <el-form-item>
            <el-checkbox v-model="notificationForm.documentShared">文档分享</el-checkbox>
            <div class="setting-description">当有人与您分享文档时通知您</div>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="notificationForm.documentEdited">文档编辑</el-checkbox>
            <div class="setting-description">当您的文档被他人编辑时通知您</div>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="notificationForm.documentCommented">文档评论</el-checkbox>
            <div class="setting-description">当有人在您的文档中添加评论时通知您</div>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="notificationForm.mention">提及通知</el-checkbox>
            <div class="setting-description">当有人在评论中@提及您时通知您</div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              @click="saveNotificationSettings"
              :loading="isUpdatingNotifications"
            >
              保存设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="界面设置" name="appearance">
        <h3>界面设置</h3>

        <el-form
          :model="appearanceForm"
          :disabled="isUpdatingAppearance"
        >
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
            <div class="setting-description">调整界面文字大小（不影响文档编辑器）</div>
          </el-form-item>

          <el-form-item label="默认视图模式">
            <el-radio-group v-model="appearanceForm.defaultViewMode">
              <el-radio label="grid">网格视图</el-radio>
              <el-radio label="list">列表视图</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="语言">
            <el-select v-model="appearanceForm.language">
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
              <el-option label="日本語" value="ja-JP" />
              <el-option label="한국어" value="ko-KR" />
            </el-select>
          </el-form-item>

          <el-form-item label="时区">
            <el-select v-model="appearanceForm.timezone" filterable>
              <el-option label="(GMT+08:00) 北京, 香港, 上海" value="Asia/Shanghai" />
              <el-option label="(GMT+09:00) 东京" value="Asia/Tokyo" />
              <el-option label="(GMT+00:00) 伦敦" value="Europe/London" />
              <el-option label="(GMT-05:00) 纽约" value="America/New_York" />
              <el-option label="(GMT-08:00) 洛杉矶" value="America/Los_Angeles" />
            </el-select>
          </el-form-item>

          <el-form-item label="日期格式">
            <el-select v-model="appearanceForm.dateFormat">
              <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
              <el-option label="MM/DD/YYYY" value="MM/DD/YYYY" />
              <el-option label="DD/MM/YYYY" value="DD/MM/YYYY" />
              <el-option label="YYYY年MM月DD日" value="YYYY年MM月DD日" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              @click="saveAppearanceSettings"
              :loading="isUpdatingAppearance"
            >
              保存设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="安全设置" name="security">
        <h3>安全设置</h3>

        <div class="security-section">
          <h4>两步验证</h4>
          <p class="setting-description">
            两步验证为您的账户提供额外的安全保障。启用后，登录时除了密码外，还需要输入验证码。
          </p>

          <div v-if="!hasTwoFactor" class="security-action">
            <el-button type="primary" @click="setupTwoFactor">设置两步验证</el-button>
          </div>

          <div v-else class="security-action">
            <el-tag type="success">已启用</el-tag>
            <el-button type="danger" @click="disableTwoFactor">禁用两步验证</el-button>
          </div>
        </div>

        <el-divider />

        <div class="security-section">
          <h4>登录设备</h4>
          <p class="setting-description">
            查看并管理您当前登录的设备。
          </p>

          <el-table v-if="devices.length > 0" :data="devices" style="width: 100%">
            <el-table-column prop="device_name" label="设备" />
            <el-table-column prop="ip_address" label="IP地址" />
            <el-table-column prop="last_active" label="最后活动时间">
              <template #default="scope">
                {{ formatDate(scope.row.last_active) }}
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="scope">
                <el-button
                  v-if="!scope.row.is_current"
                  type="danger"
                  size="small"
                  @click="removeDevice(scope.row)"
                >
                  移除
                </el-button>
                <el-tag v-else type="info">当前设备</el-tag>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="没有登录设备" />
        </div>

        <el-divider />

        <div class="security-section">
          <h4>活动日志</h4>
          <p class="setting-description">
            查看您的账户活动记录。
          </p>

          <el-button @click="loadActivityLogs">查看活动日志</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 活动日志对话框 -->
    <el-dialog
      v-model="showActivityLogsDialog"
      title="账户活动日志"
      width="800px"
    >
      <div v-if="isLoadingLogs" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <el-empty v-else-if="activityLogs.length === 0" description="没有活动记录" />

      <el-table v-else :data="activityLogs" style="width: 100%">
        <el-table-column prop="action" label="操作" width="150" />
        <el-table-column prop="resource_type" label="资源类型" width="120" />
        <el-table-column prop="details" label="详情">
          <template #default="scope">
            <div v-if="scope.row.details">
              {{ JSON.stringify(scope.row.details) }}
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="120" />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import {
  uploadAvatar,
  changePassword,
  getUserDevices,
  removeUserDevice,
  getUserActivityLogs,
  enableTwoFactorAuth,
  verifyTwoFactorCode,
  disableTwoFactorAuth,
  generateRecoveryCodes
} from '@/api/user'
import { formatDate as formatDateUtil } from '@/utils/date'

const authStore = useAuthStore()

// 标签页
const activeTab = ref('profile')

// 生命周期钩子
onMounted(async () => {
  // 初始化用户设置
  if (authStore.userSettings) {
    appearanceForm.value = {
      theme: authStore.userSettings.theme || 'light',
      fontSize: authStore.userSettings.font_size || 14,
      defaultViewMode: authStore.userSettings.default_view_mode || 'grid',
      language: authStore.userSettings.language || 'zh-CN',
      timezone: authStore.userSettings.timezone || 'Asia/Shanghai',
      dateFormat: authStore.userSettings.date_format || 'YYYY-MM-DD'
    }
  }

  // 初始化通知设置
  if (authStore.notificationSettings) {
    notificationForm.value = {
      emailNotifications: authStore.notificationSettings.email_notifications || false,
      pushNotifications: authStore.notificationSettings.push_notifications || false,
      systemNotifications: authStore.notificationSettings.system_notifications || true,
      documentShared: authStore.notificationSettings.document_shared || true,
      documentEdited: authStore.notificationSettings.document_edited || true,
      documentCommented: authStore.notificationSettings.document_commented || false,
      mention: authStore.notificationSettings.mention || true
    }
  }

  // 检查两步验证状态
  if (authStore.user) {
    hasTwoFactor.value = authStore.user.has_two_factor || false
  }

  // 加载设备列表
  await loadDevices()
})

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
  emailNotifications: true,
  pushNotifications: false,
  systemNotifications: true,
  documentShared: true,
  documentEdited: true,
  documentCommented: false,
  mention: true
})

const isUpdatingNotifications = ref(false)

// 界面设置表单
const appearanceForm = ref({
  theme: 'light',
  fontSize: 14,
  defaultViewMode: 'grid',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD'
})

const isUpdatingAppearance = ref(false)

// 安全设置
const hasTwoFactor = ref(false)
const isSettingUpTwoFactor = ref(false)
const twoFactorSetupData = ref<{ secret: string; qrcode: string } | null>(null)
const twoFactorCode = ref('')
const devices = ref<any[]>([])
const isLoadingDevices = ref(false)
const activityLogs = ref<any[]>([])
const isLoadingLogs = ref(false)
const showActivityLogsDialog = ref(false)

// 计算属性
const userInitials = computed(() => {
  const name = authStore.user?.full_name || authStore.user?.username || ''
  return name.substring(0, 2).toUpperCase()
})

// 方法
async function handleAvatarChange(file: any) {
  try {
    // 上传头像
    const response = await uploadAvatar(file.raw)
    profileForm.value.avatarUrl = response.data.avatar_url

    // 更新用户资料
    await updateProfile()
  } catch (error) {
    console.error('Failed to upload avatar', error)
    ElMessage.error('上传头像失败')
  }
}

async function updateProfile() {
  isUpdatingProfile.value = true

  try {
    // 调用API更新个人资料
    await authStore.updateProfile({
      full_name: profileForm.value.fullName,
      avatar_url: profileForm.value.avatarUrl
    })

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
        // 调用API更新密码
        await changePassword({
          current_password: passwordForm.value.currentPassword,
          new_password: passwordForm.value.newPassword
        })

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

async function saveNotificationSettings() {
  isUpdatingNotifications.value = true

  try {
    // 调用API更新通知设置
    await authStore.updateNotifications({
      document_shared: notificationForm.value.documentShared,
      document_commented: notificationForm.value.documentCommented,
      document_edited: notificationForm.value.documentEdited,
      mention: notificationForm.value.mention,
      system_notifications: notificationForm.value.systemNotifications,
      email_notifications: notificationForm.value.emailNotifications,
      push_notifications: notificationForm.value.pushNotifications
    })

    ElMessage.success('通知设置已保存')
  } catch (error) {
    console.error('Failed to update notification settings', error)
    ElMessage.error('保存通知设置失败')
  } finally {
    isUpdatingNotifications.value = false
  }
}

async function saveAppearanceSettings() {
  isUpdatingAppearance.value = true

  try {
    // 调用API更新界面设置
    await authStore.updateSettings({
      theme: appearanceForm.value.theme,
      font_size: appearanceForm.value.fontSize,
      default_view_mode: appearanceForm.value.defaultViewMode,
      language: appearanceForm.value.language,
      timezone: appearanceForm.value.timezone,
      date_format: appearanceForm.value.dateFormat
    })

    // 应用主题设置
    document.documentElement.setAttribute('data-theme', appearanceForm.value.theme)

    // 应用字体大小
    document.documentElement.style.fontSize = `${appearanceForm.value.fontSize}px`

    ElMessage.success('界面设置已保存')
  } catch (error) {
    console.error('Failed to update appearance settings', error)
    ElMessage.error('保存界面设置失败')
  } finally {
    isUpdatingAppearance.value = false
  }
}

// 安全设置相关方法
async function setupTwoFactor() {
  isSettingUpTwoFactor.value = true

  try {
    // 调用API启用两步验证
    const response = await enableTwoFactorAuth()
    twoFactorSetupData.value = response.data

    // 显示设置对话框
    showTwoFactorSetupDialog()
  } catch (error) {
    console.error('Failed to setup two-factor authentication', error)
    ElMessage.error('设置两步验证失败')
  } finally {
    isSettingUpTwoFactor.value = false
  }
}

function showTwoFactorSetupDialog() {
  ElMessageBox.alert(
    `<div class="two-factor-setup">
      <p>请使用身份验证器应用扫描下方二维码，或手动输入密钥：</p>
      <div class="qrcode-container">
        <img src="${twoFactorSetupData.value?.qrcode}" alt="Two-factor QR Code" />
      </div>
      <div class="secret-key">
        <p>密钥：${twoFactorSetupData.value?.secret}</p>
      </div>
      <div class="verification-form">
        <p>输入验证码完成设置：</p>
        <el-input v-model="twoFactorCode" placeholder="6位验证码" maxlength="6" />
      </div>
    </div>`,
    '设置两步验证',
    {
      confirmButtonText: '验证',
      dangerouslyUseHTMLString: true,
      callback: async (action) => {
        if (action === 'confirm' && twoFactorCode.value) {
          try {
            await verifyTwoFactorCode(twoFactorCode.value)
            hasTwoFactor.value = true
            ElMessage.success('两步验证已成功启用')

            // 生成恢复码
            const recoveryCodes = await generateRecoveryCodes()
            showRecoveryCodes(recoveryCodes.data.codes)
          } catch (error) {
            console.error('Failed to verify two-factor code', error)
            ElMessage.error('验证码无效，请重试')
          }
        }
      }
    }
  )
}

function showRecoveryCodes(codes: string[]) {
  ElMessageBox.alert(
    `<div class="recovery-codes">
      <p>请保存以下恢复码，当您无法使用两步验证器时，可以使用恢复码登录：</p>
      <ul class="codes-list">
        ${codes.map(code => `<li>${code}</li>`).join('')}
      </ul>
      <p class="warning">这些恢复码只会显示一次，请妥善保存！</p>
    </div>`,
    '恢复码',
    {
      confirmButtonText: '我已保存',
      dangerouslyUseHTMLString: true
    }
  )
}

async function disableTwoFactor() {
  ElMessageBox.prompt(
    '请输入您的当前密码以禁用两步验证',
    '禁用两步验证',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'password',
      inputValidator: (value) => {
        return !!value || '密码不能为空'
      }
    }
  ).then(async ({ value }) => {
    try {
      await disableTwoFactorAuth(value)
      hasTwoFactor.value = false
      ElMessage.success('两步验证已禁用')
    } catch (error) {
      console.error('Failed to disable two-factor authentication', error)
      ElMessage.error('禁用两步验证失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

async function loadDevices() {
  isLoadingDevices.value = true

  try {
    const response = await getUserDevices()
    devices.value = response.data.items
  } catch (error) {
    console.error('Failed to load devices', error)
    ElMessage.error('加载设备列表失败')
  } finally {
    isLoadingDevices.value = false
  }
}

async function removeDevice(device: any) {
  ElMessageBox.confirm(
    `确定要移除设备 "${device.device_name}" 吗？这将使该设备上的会话失效。`,
    '移除设备',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await removeUserDevice(device.id)
      ElMessage.success('设备已移除')
      await loadDevices()
    } catch (error) {
      console.error('Failed to remove device', error)
      ElMessage.error('移除设备失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

async function loadActivityLogs() {
  isLoadingLogs.value = true
  showActivityLogsDialog.value = true

  try {
    const response = await getUserActivityLogs()
    activityLogs.value = response.data.items
  } catch (error) {
    console.error('Failed to load activity logs', error)
    ElMessage.error('加载活动日志失败')
  } finally {
    isLoadingLogs.value = false
  }
}

function formatDate(dateString: string) {
  // 根据用户设置的日期格式进行格式化
  const date = new Date(dateString)
  const format = appearanceForm.value.dateFormat

  // 简单实现，实际项目中可以使用日期库如dayjs
  if (format === 'YYYY-MM-DD') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } else if (format === 'MM/DD/YYYY') {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
  } else if (format === 'DD/MM/YYYY') {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
  } else if (format === 'YYYY年MM月DD日') {
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`
  }

  return dateString
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

.setting-description {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

.security-section {
  margin-bottom: 24px;
}

.security-section h4 {
  margin-top: 0;
  margin-bottom: 8px;
}

.security-action {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-icon {
  font-size: 32px;
  margin-bottom: 16px;
}

.two-factor-setup {
  text-align: center;
}

.qrcode-container {
  margin: 16px 0;
}

.secret-key {
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  margin: 16px 0;
  font-family: monospace;
}

.verification-form {
  margin-top: 24px;
}

.recovery-codes {
  text-align: center;
}

.codes-list {
  list-style: none;
  padding: 0;
  margin: 16px 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.codes-list li {
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
}

.warning {
  color: #f56c6c;
  font-weight: bold;
}
</style>
