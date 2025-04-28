import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types/user'
import { login as apiLogin } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

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
      
      return true
    } catch (e: any) {
      error.value = e.message || '登录失败'
      return false
    } finally {
      loading.value = false
    }
  }

  // 登出
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 检查是否已认证
  function isAuthenticated() {
    return !!token.value
  }

  // 检查是否是管理员
  function isAdmin() {
    return user.value?.is_admin === true
  }

  return {
    token,
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    isAdmin
  }
})
