import axios from 'axios'
import type { Document, DocumentVersion, Folder, Share } from '@/types/document'

const API_URL = import.meta.env.VITE_API_BASE_URL

// 获取文档列表
export async function getDocuments(page = 1, size = 20, folderId?: string) {
  const params: Record<string, any> = { page, size }
  if (folderId) {
    params.parent_folder_id = folderId
  }

  const response = await axios.get(`${API_URL}/documents`, { params })
  return response.data
}

// 获取文档详情
export async function getDocument(id: string) {
  const response = await axios.get<{ code: number; data: Document }>(`${API_URL}/documents/${id}`)
  return response.data
}

// 创建文档
export async function createDocument(file: File, title: string, description?: string, parentFolderId?: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title)

  if (description) {
    formData.append('description', description)
  }

  if (parentFolderId) {
    formData.append('parent_folder_id', parentFolderId)
  }

  const response = await axios.post(`${API_URL}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}

// 更新文档信息
export async function updateDocument(id: string, data: { title?: string; description?: string }) {
  const response = await axios.put(`${API_URL}/documents/${id}`, data)
  return response.data
}

// 删除文档
export async function deleteDocument(id: string) {
  const response = await axios.delete(`${API_URL}/documents/${id}`)
  return response.data
}

// 获取文档版本列表
export async function getDocumentVersions(documentId: string, params?: { page?: number; size?: number }) {
  const response = await axios.get<{ code: number; data: { items: DocumentVersion[]; total: number } }>(
    `${API_URL}/documents/${documentId}/versions`,
    { params }
  )
  return response.data
}

// 创建文档版本
export async function createDocumentVersion(documentId: string, file: File, comment?: string) {
  const formData = new FormData()
  formData.append('file', file)

  if (comment) {
    formData.append('comment', comment)
  }

  const response = await axios.post(`${API_URL}/documents/${documentId}/versions`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}

// 恢复文档版本
export async function restoreDocumentVersion(documentId: string, versionNumber: number) {
  const response = await axios.post(`${API_URL}/documents/${documentId}/versions/${versionNumber}/restore`)
  return response.data
}

// 删除文档版本
export async function deleteDocumentVersion(documentId: string, versionNumber: number) {
  const response = await axios.delete(`${API_URL}/documents/${documentId}/versions/${versionNumber}`)
  return response.data
}

// 比较文档版本
export async function compareDocumentVersions(documentId: string, versionNumber1: number, versionNumber2: number) {
  const response = await axios.get(
    `${API_URL}/documents/${documentId}/versions/compare?version1=${versionNumber1}&version2=${versionNumber2}`
  )
  return response.data
}

// 获取文档版本详情
export async function getDocumentVersion(documentId: string, versionNumber: number) {
  const response = await axios.get<{ code: number; data: DocumentVersion }>(
    `${API_URL}/documents/${documentId}/versions/${versionNumber}`
  )
  return response.data
}

// 获取文件夹列表
export async function getFolders(parentId?: string) {
  const params: Record<string, any> = {}
  if (parentId) {
    params.parent_id = parentId
  }

  const response = await axios.get<{ code: number; data: { items: Folder[] } }>(`${API_URL}/folders`, { params })
  return response.data
}

// 创建文件夹
export async function createFolder(name: string, parentId?: string) {
  const data: Record<string, any> = { name }
  if (parentId) {
    data.parent_id = parentId
  }

  const response = await axios.post(`${API_URL}/folders`, data)
  return response.data
}

// 获取文件夹详情
export async function getFolder(id: string) {
  const response = await axios.get<{ code: number; data: Folder }>(`${API_URL}/folders/${id}`)
  return response.data
}

// 更新文件夹
export async function updateFolder(id: string, data: { name?: string }) {
  const response = await axios.put(`${API_URL}/folders/${id}`, data)
  return response.data
}

// 删除文件夹
export async function deleteFolder(id: string) {
  const response = await axios.delete(`${API_URL}/folders/${id}`)
  return response.data
}

// 获取文件夹路径
export async function getFolderPath(id: string) {
  const response = await axios.get<{ code: number; data: { path: Folder[] } }>(`${API_URL}/folders/${id}/path`)
  return response.data
}

// 移动文档
export async function moveDocument(id: string, targetFolderId?: string) {
  const data: Record<string, any> = {}
  if (targetFolderId) {
    data.parent_folder_id = targetFolderId
  }

  const response = await axios.post(`${API_URL}/documents/${id}/move`, data)
  return response.data
}

// 复制文档
export async function copyDocument(id: string, targetFolderId?: string) {
  const data: Record<string, any> = {}
  if (targetFolderId) {
    data.parent_folder_id = targetFolderId
  }

  const response = await axios.post(`${API_URL}/documents/${id}/copy`, data)
  return response.data
}

// 移动文件夹
export async function moveFolder(id: string, targetFolderId?: string) {
  const data: Record<string, any> = {}
  if (targetFolderId) {
    data.parent_id = targetFolderId
  }

  const response = await axios.post(`${API_URL}/folders/${id}/move`, data)
  return response.data
}

// 获取回收站文档列表
export async function getTrashDocuments(page = 1, size = 20) {
  const response = await axios.get<{ code: number; data: { items: Document[], total: number } }>(
    `${API_URL}/trash/documents`,
    { params: { page, size } }
  )
  return response.data
}

// 恢复回收站文档
export async function restoreDocument(id: string) {
  const response = await axios.post(`${API_URL}/trash/documents/${id}/restore`)
  return response.data
}

// 永久删除回收站文档
export async function permanentDeleteDocument(id: string) {
  const response = await axios.delete(`${API_URL}/trash/documents/${id}/permanent`)
  return response.data
}

// 清空回收站
export async function emptyTrash() {
  const response = await axios.delete(`${API_URL}/trash/empty`)
  return response.data
}

// 分享文档
export async function shareDocument(documentId: string, permissionLevel: 'READ' | 'WRITE', expiresAt?: string) {
  const data: Record<string, any> = {
    document_id: documentId,
    permission_level: permissionLevel
  }

  if (expiresAt) {
    data.expires_at = expiresAt
  }

  const response = await axios.post<{ code: number; data: Share }>(`${API_URL}/shares`, data)
  return response.data
}

// 获取分享信息
export async function getShareInfo(accessCode: string) {
  const response = await axios.get<{ code: number; data: { document: Document; permission_level: string } }>(
    `${API_URL}/share/${accessCode}`
  )
  return response.data
}

// 获取文档协作者列表
export async function getDocumentCollaborators(documentId: string) {
  const response = await axios.get<{ code: number; data: { items: any[] } }>(
    `${API_URL}/documents/${documentId}/collaborators`
  )
  return response.data
}

// 邀请协作者
export async function inviteDocumentCollaborator(
  documentId: string,
  email: string,
  permission: string,
  message?: string
) {
  const data: Record<string, any> = {
    email,
    permission
  }

  if (message) {
    data.message = message
  }

  const response = await axios.post(
    `${API_URL}/documents/${documentId}/collaborators`,
    data
  )
  return response.data
}

// 移除协作者
export async function removeDocumentCollaborator(documentId: string, userId: string) {
  const response = await axios.delete(
    `${API_URL}/documents/${documentId}/collaborators/${userId}`
  )
  return response.data
}

// 更新协作者权限
export async function updateCollaboratorPermission(
  documentId: string,
  userId: string,
  permission: string
) {
  const response = await axios.put(
    `${API_URL}/documents/${documentId}/collaborators/${userId}`,
    { permission }
  )
  return response.data
}

// 获取文档变更历史
export async function getDocumentChanges(documentId: string, params?: { page?: number; size?: number }) {
  const response = await axios.get<{ code: number; data: { items: any[]; total: number } }>(
    `${API_URL}/documents/${documentId}/changes`,
    { params }
  )
  return response.data
}

// 获取文档变更详情
export async function getDocumentChange(documentId: string, changeId: string) {
  const response = await axios.get<{ code: number; data: any }>(
    `${API_URL}/documents/${documentId}/changes/${changeId}`
  )
  return response.data
}

// 保存文档内容
export async function saveDocumentContent(documentId: string, content: any, autoSave: boolean = false) {
  const response = await axios.put(
    `${API_URL}/documents/${documentId}/content`,
    { content, auto_save: autoSave }
  )
  return response.data
}

// 获取文档内容
export async function getDocumentContent(documentId: string, versionId?: string) {
  const params: Record<string, any> = {}
  if (versionId) {
    params.version_id = versionId
  }

  const response = await axios.get<{ code: number; data: any }>(
    `${API_URL}/documents/${documentId}/content`,
    { params }
  )
  return response.data
}

// 锁定文档
export async function lockDocument(documentId: string) {
  const response = await axios.post(`${API_URL}/documents/${documentId}/lock`)
  return response.data
}

// 解锁文档
export async function unlockDocument(documentId: string) {
  const response = await axios.post(`${API_URL}/documents/${documentId}/unlock`)
  return response.data
}

// 获取文档锁状态
export async function getDocumentLockStatus(documentId: string) {
  const response = await axios.get<{ code: number; data: { locked: boolean; locked_by?: string } }>(
    `${API_URL}/documents/${documentId}/lock-status`
  )
  return response.data
}

// 上传图片
export async function uploadImage(documentId: string, formData: FormData) {
  const response = await axios.post<{ code: number; data: { url: string } }>(
    `${API_URL}/documents/${documentId}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

// 获取PDF注释
export async function getPdfAnnotations(documentId: string) {
  const response = await axios.get<{ code: number; data: { items: any[] } }>(
    `${API_URL}/documents/${documentId}/annotations`
  )
  return response.data
}

// 添加PDF注释
export async function addPdfAnnotation(documentId: string, data: any) {
  const response = await axios.post<{ code: number; data: any }>(
    `${API_URL}/documents/${documentId}/annotations`,
    data
  )
  return response.data
}

// 更新PDF注释
export async function updatePdfAnnotation(documentId: string, annotationId: string, data: any) {
  const response = await axios.put<{ code: number; data: any }>(
    `${API_URL}/documents/${documentId}/annotations/${annotationId}`,
    data
  )
  return response.data
}

// 删除PDF注释
export async function deletePdfAnnotation(documentId: string, annotationId: string) {
  const response = await axios.delete<{ code: number; data: any }>(
    `${API_URL}/documents/${documentId}/annotations/${annotationId}`
  )
  return response.data
}

// 添加注释评论
export async function addAnnotationComment(documentId: string, annotationId: string, data: any) {
  const response = await axios.post<{ code: number; data: any }>(
    `${API_URL}/documents/${documentId}/annotations/${annotationId}/comments`,
    data
  )
  return response.data
}
