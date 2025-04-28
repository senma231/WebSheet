import axios from 'axios'
import type { Template, TemplateCategory } from '@/types/template'

const API_URL = import.meta.env.VITE_API_BASE_URL

/**
 * 获取模板列表
 * @param params 查询参数
 * @returns 模板列表
 */
export async function getTemplates(params: {
  query?: string;
  type?: string;
  category_id?: string;
  page?: number;
  size?: number;
}) {
  const response = await axios.get<{ code: number; data: { items: Template[]; total: number } }>(
    `${API_URL}/templates`,
    { params }
  )
  return response.data
}

/**
 * 获取模板详情
 * @param id 模板ID
 * @returns 模板详情
 */
export async function getTemplate(id: string) {
  const response = await axios.get<{ code: number; data: Template }>(
    `${API_URL}/templates/${id}`
  )
  return response.data
}

/**
 * 创建模板
 * @param data 模板数据
 * @returns 创建的模板
 */
export async function createTemplate(data: FormData) {
  const response = await axios.post<{ code: number; data: Template }>(
    `${API_URL}/templates`,
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

/**
 * 更新模板
 * @param id 模板ID
 * @param data 更新的数据
 * @returns 更新后的模板
 */
export async function updateTemplate(id: string, data: FormData) {
  const response = await axios.put<{ code: number; data: Template }>(
    `${API_URL}/templates/${id}`,
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

/**
 * 删除模板
 * @param id 模板ID
 * @returns 删除结果
 */
export async function deleteTemplate(id: string) {
  const response = await axios.delete(`${API_URL}/templates/${id}`)
  return response.data
}

/**
 * 基于模板创建文档
 * @param templateId 模板ID
 * @param data 文档数据
 * @returns 创建的文档
 */
export async function createDocumentFromTemplate(
  templateId: string,
  data: { title: string; description?: string; parent_folder_id?: string }
) {
  const response = await axios.post<{ code: number; data: { document_id: string } }>(
    `${API_URL}/templates/${templateId}/create-document`,
    data
  )
  return response.data
}

/**
 * 获取模板分类列表
 * @returns 分类列表
 */
export async function getTemplateCategories() {
  const response = await axios.get<{ code: number; data: { items: TemplateCategory[] } }>(
    `${API_URL}/template-categories`
  )
  return response.data
}

/**
 * 创建模板分类
 * @param data 分类数据
 * @returns 创建的分类
 */
export async function createTemplateCategory(data: { name: string; description?: string }) {
  const response = await axios.post<{ code: number; data: TemplateCategory }>(
    `${API_URL}/template-categories`,
    data
  )
  return response.data
}

/**
 * 更新模板分类
 * @param id 分类ID
 * @param data 更新的数据
 * @returns 更新后的分类
 */
export async function updateTemplateCategory(
  id: string,
  data: { name: string; description?: string }
) {
  const response = await axios.put<{ code: number; data: TemplateCategory }>(
    `${API_URL}/template-categories/${id}`,
    data
  )
  return response.data
}

/**
 * 删除模板分类
 * @param id 分类ID
 * @returns 删除结果
 */
export async function deleteTemplateCategory(id: string) {
  const response = await axios.delete(`${API_URL}/template-categories/${id}`)
  return response.data
}
