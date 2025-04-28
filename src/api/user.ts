import axios from 'axios'
import type { User } from '@/types/user'

const API_URL = import.meta.env.VITE_API_BASE_URL

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export async function getCurrentUser() {
  const response = await axios.get<{ code: number; data: User }>(`${API_URL}/users/me`)
  return response.data
}

/**
 * 更新用户个人资料
 * @param data 用户资料数据
 * @returns 更新后的用户信息
 */
export async function updateUserProfile(data: {
  full_name?: string;
  avatar_url?: string;
}) {
  const response = await axios.patch<{ code: number; data: User }>(`${API_URL}/users/me`, data)
  return response.data
}

/**
 * 上传用户头像
 * @param file 头像文件
 * @returns 上传后的头像URL
 */
export async function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('avatar', file)
  
  const response = await axios.post<{ code: number; data: { avatar_url: string } }>(
    `${API_URL}/users/me/avatar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

/**
 * 更改密码
 * @param data 密码数据
 * @returns 操作结果
 */
export async function changePassword(data: {
  current_password: string;
  new_password: string;
}) {
  const response = await axios.post<{ code: number; message: string }>(
    `${API_URL}/users/me/password`,
    data
  )
  return response.data
}

/**
 * 获取用户设置
 * @returns 用户设置
 */
export async function getUserSettings() {
  const response = await axios.get<{ code: number; data: Record<string, any> }>(
    `${API_URL}/users/me/settings`
  )
  return response.data
}

/**
 * 更新用户设置
 * @param settings 设置数据
 * @returns 更新后的设置
 */
export async function updateUserSettings(settings: Record<string, any>) {
  const response = await axios.patch<{ code: number; data: Record<string, any> }>(
    `${API_URL}/users/me/settings`,
    settings
  )
  return response.data
}

/**
 * 获取用户通知设置
 * @returns 通知设置
 */
export async function getNotificationSettings() {
  const response = await axios.get<{ code: number; data: Record<string, boolean> }>(
    `${API_URL}/users/me/notification-settings`
  )
  return response.data
}

/**
 * 更新用户通知设置
 * @param settings 通知设置
 * @returns 更新后的通知设置
 */
export async function updateNotificationSettings(settings: Record<string, boolean>) {
  const response = await axios.patch<{ code: number; data: Record<string, boolean> }>(
    `${API_URL}/users/me/notification-settings`,
    settings
  )
  return response.data
}

/**
 * 搜索用户
 * @param query 搜索关键词
 * @returns 用户列表
 */
export async function searchUsers(query: string) {
  const response = await axios.get<{ code: number; data: { items: User[] } }>(
    `${API_URL}/users/search`,
    {
      params: { query }
    }
  )
  return response.data
}

/**
 * 获取用户活动日志
 * @param page 页码
 * @param size 每页数量
 * @returns 活动日志列表
 */
export async function getUserActivityLogs(page = 1, size = 20) {
  const response = await axios.get<{ code: number; data: { items: any[]; total: number } }>(
    `${API_URL}/users/me/activity-logs`,
    {
      params: { page, size }
    }
  )
  return response.data
}

/**
 * 获取用户登录设备
 * @returns 登录设备列表
 */
export async function getUserDevices() {
  const response = await axios.get<{ code: number; data: { items: any[] } }>(
    `${API_URL}/users/me/devices`
  )
  return response.data
}

/**
 * 删除用户登录设备
 * @param deviceId 设备ID
 * @returns 操作结果
 */
export async function removeUserDevice(deviceId: string) {
  const response = await axios.delete<{ code: number; message: string }>(
    `${API_URL}/users/me/devices/${deviceId}`
  )
  return response.data
}

/**
 * 启用两步验证
 * @returns 两步验证设置信息
 */
export async function enableTwoFactorAuth() {
  const response = await axios.post<{ code: number; data: { secret: string; qrcode: string } }>(
    `${API_URL}/users/me/two-factor`
  )
  return response.data
}

/**
 * 验证两步验证码
 * @param code 验证码
 * @returns 操作结果
 */
export async function verifyTwoFactorCode(code: string) {
  const response = await axios.post<{ code: number; message: string }>(
    `${API_URL}/users/me/two-factor/verify`,
    { code }
  )
  return response.data
}

/**
 * 禁用两步验证
 * @param password 当前密码
 * @returns 操作结果
 */
export async function disableTwoFactorAuth(password: string) {
  const response = await axios.delete<{ code: number; message: string }>(
    `${API_URL}/users/me/two-factor`,
    {
      data: { password }
    }
  )
  return response.data
}

/**
 * 生成恢复码
 * @returns 恢复码列表
 */
export async function generateRecoveryCodes() {
  const response = await axios.post<{ code: number; data: { codes: string[] } }>(
    `${API_URL}/users/me/recovery-codes`
  )
  return response.data
}
