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
export async function getDocumentVersions(documentId: string) {
  const response = await axios.get<{ code: number; data: { items: DocumentVersion[] } }>(
    `${API_URL}/documents/${documentId}/versions`
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
