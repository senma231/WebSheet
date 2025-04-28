import axios from 'axios'
import type { Document, Folder } from '@/types/document'

const API_URL = import.meta.env.VITE_API_BASE_URL

export interface SearchParams {
  query: string;
  page?: number;
  size?: number;
  sort?: 'relevance' | 'updated' | 'title';
  order?: 'asc' | 'desc';
  type?: string[];
  folder_id?: string;
  owner_id?: string;
  date_from?: string;
  date_to?: string;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  path: string[];
  snippet?: string;
  updated_at: string;
  created_at: string;
  size: number;
  owner_id: string;
  owner_name?: string;
  tags?: string[];
  is_favorite?: boolean;
}

export interface SearchResponse {
  code: number;
  data: {
    items: SearchResult[];
    total: number;
    page: number;
    size: number;
  };
}

/**
 * 搜索文档
 * @param params 搜索参数
 * @returns 搜索结果
 */
export async function searchDocuments(params: SearchParams): Promise<SearchResponse> {
  const response = await axios.get<SearchResponse>(`${API_URL}/search`, { params })
  return response.data
}

/**
 * 获取搜索建议
 * @param query 搜索关键词
 * @returns 搜索建议
 */
export async function getSearchSuggestions(query: string) {
  const response = await axios.get<{ code: number; data: { suggestions: string[] } }>(
    `${API_URL}/search/suggestions`,
    { params: { query } }
  )
  return response.data
}

/**
 * 获取热门搜索
 * @returns 热门搜索关键词
 */
export async function getHotSearches() {
  const response = await axios.get<{ code: number; data: { keywords: string[] } }>(
    `${API_URL}/search/hot`
  )
  return response.data
}

/**
 * 获取最近访问的文档
 * @param limit 限制数量
 * @returns 最近访问的文档列表
 */
export async function getRecentDocuments(limit = 10) {
  const response = await axios.get<{ code: number; data: { items: Document[] } }>(
    `${API_URL}/documents/recent`,
    { params: { limit } }
  )
  return response.data
}

/**
 * 获取收藏的文档
 * @param page 页码
 * @param size 每页数量
 * @returns 收藏的文档列表
 */
export async function getFavoriteDocuments(page = 1, size = 20) {
  const response = await axios.get<{ code: number; data: { items: Document[]; total: number } }>(
    `${API_URL}/documents/favorites`,
    { params: { page, size } }
  )
  return response.data
}

/**
 * 添加文档到收藏
 * @param documentId 文档ID
 * @returns 操作结果
 */
export async function addToFavorites(documentId: string) {
  const response = await axios.post<{ code: number; message: string }>(
    `${API_URL}/documents/${documentId}/favorite`
  )
  return response.data
}

/**
 * 从收藏中移除文档
 * @param documentId 文档ID
 * @returns 操作结果
 */
export async function removeFromFavorites(documentId: string) {
  const response = await axios.delete<{ code: number; message: string }>(
    `${API_URL}/documents/${documentId}/favorite`
  )
  return response.data
}

/**
 * 记录文档访问
 * @param documentId 文档ID
 * @returns 操作结果
 */
export async function recordDocumentAccess(documentId: string) {
  const response = await axios.post<{ code: number; message: string }>(
    `${API_URL}/documents/${documentId}/access`
  )
  return response.data
}

/**
 * 获取文档标签
 * @returns 标签列表
 */
export async function getDocumentTags() {
  const response = await axios.get<{ code: number; data: { tags: string[] } }>(
    `${API_URL}/documents/tags`
  )
  return response.data
}

/**
 * 添加标签到文档
 * @param documentId 文档ID
 * @param tags 标签列表
 * @returns 操作结果
 */
export async function addTagsToDocument(documentId: string, tags: string[]) {
  const response = await axios.post<{ code: number; message: string }>(
    `${API_URL}/documents/${documentId}/tags`,
    { tags }
  )
  return response.data
}

/**
 * 从文档中移除标签
 * @param documentId 文档ID
 * @param tag 标签
 * @returns 操作结果
 */
export async function removeTagFromDocument(documentId: string, tag: string) {
  const response = await axios.delete<{ code: number; message: string }>(
    `${API_URL}/documents/${documentId}/tags/${tag}`
  )
  return response.data
}
