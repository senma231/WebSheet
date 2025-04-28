import axios from 'axios'
import type { Comment, CreateCommentRequest, UpdateCommentRequest } from '@/types/comment'

const API_URL = import.meta.env.VITE_API_BASE_URL

/**
 * 获取文档评论列表
 * @param documentId 文档ID
 * @returns 评论列表
 */
export async function getDocumentComments(documentId: string) {
  const response = await axios.get<{ code: number; data: { items: Comment[] } }>(
    `${API_URL}/documents/${documentId}/comments`
  )
  return response.data
}

/**
 * 添加文档评论
 * @param documentId 文档ID
 * @param data 评论数据
 * @returns 添加的评论
 */
export async function addDocumentComment(documentId: string, data: CreateCommentRequest) {
  const response = await axios.post<{ code: number; data: Comment }>(
    `${API_URL}/documents/${documentId}/comments`,
    data
  )
  return response.data
}

/**
 * 更新文档评论
 * @param documentId 文档ID
 * @param commentId 评论ID
 * @param data 更新的评论数据
 * @returns 更新的评论
 */
export async function updateDocumentComment(
  documentId: string,
  commentId: string,
  data: UpdateCommentRequest
) {
  const response = await axios.put<{ code: number; data: Comment }>(
    `${API_URL}/documents/${documentId}/comments/${commentId}`,
    data
  )
  return response.data
}

/**
 * 删除文档评论
 * @param documentId 文档ID
 * @param commentId 评论ID
 * @returns 删除结果
 */
export async function deleteDocumentComment(documentId: string, commentId: string) {
  const response = await axios.delete(
    `${API_URL}/documents/${documentId}/comments/${commentId}`
  )
  return response.data
}

/**
 * 回复文档评论
 * @param documentId 文档ID
 * @param parentId 父评论ID
 * @param data 回复数据
 * @returns 添加的回复
 */
export async function replyToComment(
  documentId: string,
  parentId: string,
  data: CreateCommentRequest
) {
  const response = await axios.post<{ code: number; data: Comment }>(
    `${API_URL}/documents/${documentId}/comments`,
    {
      ...data,
      parent_id: parentId
    }
  )
  return response.data
}
