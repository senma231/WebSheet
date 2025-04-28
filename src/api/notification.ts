import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL

/**
 * 获取用户通知
 * @param page 页码
 * @param size 每页数量
 * @returns 通知列表
 */
export async function getNotifications(page = 1, size = 20) {
  const response = await axios.get<{ code: number; data: { items: any[]; total: number } }>(
    `${API_URL}/notifications`,
    {
      params: { page, size }
    }
  )
  return response.data
}

/**
 * 获取未读通知数量
 * @returns 未读通知数量
 */
export async function getUnreadNotificationCount() {
  const response = await axios.get<{ code: number; data: { count: number } }>(
    `${API_URL}/notifications/unread/count`
  )
  return response.data
}

/**
 * 标记通知为已读
 * @param notificationId 通知ID
 * @returns 操作结果
 */
export async function markNotificationRead(notificationId: string) {
  const response = await axios.patch<{ code: number; message: string }>(
    `${API_URL}/notifications/${notificationId}/read`
  )
  return response.data
}

/**
 * 标记所有通知为已读
 * @returns 操作结果
 */
export async function markAllNotificationsRead() {
  const response = await axios.patch<{ code: number; message: string }>(
    `${API_URL}/notifications/read-all`
  )
  return response.data
}

/**
 * 删除通知
 * @param notificationId 通知ID
 * @returns 操作结果
 */
export async function deleteNotification(notificationId: string) {
  const response = await axios.delete<{ code: number; message: string }>(
    `${API_URL}/notifications/${notificationId}`
  )
  return response.data
}

/**
 * 删除所有通知
 * @returns 操作结果
 */
export async function deleteAllNotifications() {
  const response = await axios.delete<{ code: number; message: string }>(
    `${API_URL}/notifications/delete-all`
  )
  return response.data
}
