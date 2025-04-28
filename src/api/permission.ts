import axios from 'axios'
import type { DocumentPermission } from '@/types/permission'

const API_URL = import.meta.env.VITE_API_BASE_URL

/**
 * 获取文档权限列表
 * @param documentId 文档ID
 * @returns 权限列表
 */
export async function getDocumentPermissions(documentId: string) {
  const response = await axios.get<{ code: number; data: { items: DocumentPermission[] } }>(
    `${API_URL}/documents/${documentId}/permissions`
  )
  return response.data
}

/**
 * 添加文档权限
 * @param documentId 文档ID
 * @param userId 用户ID
 * @param permissionLevel 权限级别
 * @returns 添加的权限
 */
export async function addDocumentPermission(
  documentId: string,
  userId: string,
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN'
) {
  const response = await axios.post<{ code: number; data: DocumentPermission }>(
    `${API_URL}/documents/${documentId}/permissions`,
    {
      user_id: userId,
      permission_level: permissionLevel
    }
  )
  return response.data
}

/**
 * 更新文档权限
 * @param documentId 文档ID
 * @param permissionId 权限ID
 * @param permissionLevel 权限级别
 * @returns 更新的权限
 */
export async function updateDocumentPermission(
  documentId: string,
  permissionId: string,
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN'
) {
  const response = await axios.put<{ code: number; data: DocumentPermission }>(
    `${API_URL}/documents/${documentId}/permissions/${permissionId}`,
    {
      permission_level: permissionLevel
    }
  )
  return response.data
}

/**
 * 删除文档权限
 * @param documentId 文档ID
 * @param permissionId 权限ID
 * @returns 删除结果
 */
export async function removeDocumentPermission(documentId: string, permissionId: string) {
  const response = await axios.delete(
    `${API_URL}/documents/${documentId}/permissions/${permissionId}`
  )
  return response.data
}

/**
 * 获取文件夹权限列表
 * @param folderId 文件夹ID
 * @returns 权限列表
 */
export async function getFolderPermissions(folderId: string) {
  const response = await axios.get<{ code: number; data: { items: DocumentPermission[] } }>(
    `${API_URL}/folders/${folderId}/permissions`
  )
  return response.data
}

/**
 * 添加文件夹权限
 * @param folderId 文件夹ID
 * @param userId 用户ID
 * @param permissionLevel 权限级别
 * @returns 添加的权限
 */
export async function addFolderPermission(
  folderId: string,
  userId: string,
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN'
) {
  const response = await axios.post<{ code: number; data: DocumentPermission }>(
    `${API_URL}/folders/${folderId}/permissions`,
    {
      user_id: userId,
      permission_level: permissionLevel
    }
  )
  return response.data
}

/**
 * 更新文件夹权限
 * @param folderId 文件夹ID
 * @param permissionId 权限ID
 * @param permissionLevel 权限级别
 * @returns 更新的权限
 */
export async function updateFolderPermission(
  folderId: string,
  permissionId: string,
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN'
) {
  const response = await axios.put<{ code: number; data: DocumentPermission }>(
    `${API_URL}/folders/${folderId}/permissions/${permissionId}`,
    {
      permission_level: permissionLevel
    }
  )
  return response.data
}

/**
 * 删除文件夹权限
 * @param folderId 文件夹ID
 * @param permissionId 权限ID
 * @returns 删除结果
 */
export async function removeFolderPermission(folderId: string, permissionId: string) {
  const response = await axios.delete(
    `${API_URL}/folders/${folderId}/permissions/${permissionId}`
  )
  return response.data
}
