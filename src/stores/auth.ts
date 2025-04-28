import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserSettings, NotificationSettings } from '@/types/user'
import { login as apiLogin, logout as apiLogout } from '@/api/auth'
import { getCurrentUser, updateUserProfile, getUserSettings, updateUserSettings, getNotificationSettings, updateNotificationSettings } from '@/api/user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const userSettings = ref<UserSettings | null>(null)
  const notificationSettings = ref<NotificationSettings | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.is_admin === true)
  const userInitials = computed(() => {
    const name = user.value?.full_name || user.value?.username || ''
    return name.substring(0, 2).toUpperCase()
  })

  // 加载用户信息
  function loadUserFromStorage() {
    const userJson = localStorage.getItem('user')
    if (userJson) {
      try {
        user.value = JSON.parse(userJson)
      } catch (e) {
        console.error('Failed to parse user from localStorage', e)
      }
    }

    const settingsJson = localStorage.getItem('userSettings')
    if (settingsJson) {
      try {
        userSettings.value = JSON.parse(settingsJson)
      } catch (e) {
        console.error('Failed to parse user settings from localStorage', e)
      }
    }

    const notificationSettingsJson = localStorage.getItem('notificationSettings')
    if (notificationSettingsJson) {
      try {
        notificationSettings.value = JSON.parse(notificationSettingsJson)
      } catch (e) {
        console.error('Failed to parse notification settings from localStorage', e)
      }
    }
  }

  // 初始化时加载用户信息
  loadUserFromStorage()

  // 登录
  async function login(username: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await apiLogin(username, password)
      token.value = response.data.token
      user.value = response.data.user

      // 保存到本地存储
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      // 加载用户设置
      await loadUserSettings()

      return true
    } catch (e: any) {
      error.value = e.message || '登录失败'
      return false
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function logout() {
    try {
      if (token.value) {
        await apiLogout()
      }
    } catch (e) {
      console.error('Failed to logout from API', e)
    } finally {
      // 清除本地状态
      token.value = null
      user.value = null
      userSettings.value = null
      notificationSettings.value = null

      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userSettings')
      localStorage.removeItem('notificationSettings')
    }
  }

  // 刷新用户信息
  async function refreshUserInfo() {
    if (!token.value) return

    try {
      const response = await getCurrentUser()
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
    } catch (e) {
      console.error('Failed to refresh user info', e)
    }
  }

  // 更新用户资料
  async function updateProfile(data: { full_name?: string; avatar_url?: string }) {
    if (!token.value || !user.value) return false

    try {
      const response = await updateUserProfile(data)
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
      return true
    } catch (e) {
      console.error('Failed to update user profile', e)
      return false
    }
  }

  // 加载用户设置
  async function loadUserSettings() {
    if (!token.value) return

    try {
      // 加载用户设置
      const settingsResponse = await getUserSettings()
      userSettings.value = settingsResponse.data
      localStorage.setItem('userSettings', JSON.stringify(settingsResponse.data))

      // 加载通知设置
      const notificationSettingsResponse = await getNotificationSettings()
      notificationSettings.value = notificationSettingsResponse.data
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettingsResponse.data))
    } catch (e) {
      console.error('Failed to load user settings', e)
    }
  }

  // 更新用户设置
  async function updateSettings(settings: Partial<UserSettings>) {
    if (!token.value || !userSettings.value) return false

    try {
      const response = await updateUserSettings(settings)
      userSettings.value = { ...userSettings.value, ...response.data }
      localStorage.setItem('userSettings', JSON.stringify(userSettings.value))
      return true
    } catch (e) {
      console.error('Failed to update user settings', e)
      return false
    }
  }

  // 更新通知设置
  async function updateNotifications(settings: Partial<NotificationSettings>) {
    if (!token.value || !notificationSettings.value) return false

    try {
      const response = await updateNotificationSettings(settings)
      notificationSettings.value = { ...notificationSettings.value, ...response.data }
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings.value))
      return true
    } catch (e) {
      console.error('Failed to update notification settings', e)
      return false
    }
  }

  return {
    token,
    user,
    userSettings,
    notificationSettings,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    userInitials,
    login,
    logout,
    refreshUserInfo,
    updateProfile,
    loadUserSettings,
    updateSettings,
    updateNotifications
  }
})
