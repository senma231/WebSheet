import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { refreshToken } from '@/api/auth'

// 创建axios实例
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    // 如果响应成功，直接返回数据
    if (response.data.code === 200) {
      return response.data
    }
    
    // 处理业务错误
    ElMessage.error(response.data.message || '请求失败')
    return Promise.reject(new Error(response.data.message || '请求失败'))
  },
  async (error) => {
    if (!error.response) {
      ElMessage.error('网络错误，请检查您的网络连接')
      return Promise.reject(error)
    }
    
    const { status } = error.response
    
    // 处理401错误（未授权）
    if (status === 401) {
      const authStore = useAuthStore()
      
      // 如果有token，尝试刷新token
      if (authStore.token) {
        try {
          const res = await refreshToken(authStore.token)
          
          // 更新token
          authStore.token = res.data.token
          localStorage.setItem('token', res.data.token)
          
          // 重试请求
          const config = error.config
          config.headers.Authorization = `Bearer ${res.data.token}`
          return http(config)
        } catch (refreshError) {
          // 刷新token失败，清除用户信息并跳转到登录页
          authStore.logout()
          ElMessage.error('登录已过期，请重新登录')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // 没有token，直接跳转到登录页
        ElMessage.error('请先登录')
        window.location.href = '/login'
      }
    } else if (status === 403) {
      ElMessage.error('没有权限执行此操作')
    } else if (status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (status === 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else {
      ElMessage.error(error.response.data?.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default http
