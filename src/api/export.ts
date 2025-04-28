import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL

/**
 * 导出文档为PDF
 * @param documentId 文档ID
 * @param options 导出选项
 * @returns 导出的文件URL
 */
export async function exportToPdf(documentId: string, options?: {
  includeComments?: boolean;
  paperSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
}) {
  const response = await axios.post<{ code: number; data: { file_url: string } }>(
    `${API_URL}/documents/${documentId}/export/pdf`,
    options,
    { responseType: 'blob' }
  )
  return response.data
}

/**
 * 导出文档为Word格式
 * @param documentId 文档ID
 * @param options 导出选项
 * @returns 导出的文件URL
 */
export async function exportToWord(documentId: string, options?: {
  includeComments?: boolean;
  includeStyles?: boolean;
}) {
  const response = await axios.post<{ code: number; data: { file_url: string } }>(
    `${API_URL}/documents/${documentId}/export/word`,
    options,
    { responseType: 'blob' }
  )
  return response.data
}

/**
 * 导出文档为Excel格式
 * @param documentId 文档ID
 * @param options 导出选项
 * @returns 导出的文件URL
 */
export async function exportToExcel(documentId: string, options?: {
  includeFormulas?: boolean;
  includeStyles?: boolean;
  sheetName?: string;
}) {
  const response = await axios.post<{ code: number; data: { file_url: string } }>(
    `${API_URL}/documents/${documentId}/export/excel`,
    options,
    { responseType: 'blob' }
  )
  return response.data
}

/**
 * 导出文档为PowerPoint格式
 * @param documentId 文档ID
 * @param options 导出选项
 * @returns 导出的文件URL
 */
export async function exportToPowerPoint(documentId: string, options?: {
  includeNotes?: boolean;
  includeAnimations?: boolean;
}) {
  const response = await axios.post<{ code: number; data: { file_url: string } }>(
    `${API_URL}/documents/${documentId}/export/ppt`,
    options,
    { responseType: 'blob' }
  )
  return response.data
}

/**
 * 导出文档为Markdown格式
 * @param documentId 文档ID
 * @param options 导出选项
 * @returns 导出的文件内容
 */
export async function exportToMarkdown(documentId: string, options?: {
  includeMetadata?: boolean;
  includeImages?: boolean;
}) {
  const response = await axios.post<{ code: number; data: { content: string } }>(
    `${API_URL}/documents/${documentId}/export/markdown`,
    options
  )
  return response.data
}

/**
 * 导出文档为HTML格式
 * @param documentId 文档ID
 * @param options 导出选项
 * @returns 导出的文件内容
 */
export async function exportToHtml(documentId: string, options?: {
  includeStyles?: boolean;
  includeImages?: boolean;
}) {
  const response = await axios.post<{ code: number; data: { content: string } }>(
    `${API_URL}/documents/${documentId}/export/html`,
    options
  )
  return response.data
}

/**
 * 获取导出任务状态
 * @param taskId 导出任务ID
 * @returns 任务状态
 */
export async function getExportTaskStatus(taskId: string) {
  const response = await axios.get<{ 
    code: number; 
    data: { 
      status: 'pending' | 'processing' | 'completed' | 'failed';
      progress: number;
      file_url?: string;
      error?: string;
    } 
  }>(`${API_URL}/export/tasks/${taskId}`)
  return response.data
}

/**
 * 下载导出的文件
 * @param fileUrl 文件URL
 * @param fileName 文件名
 */
export function downloadExportedFile(fileUrl: string, fileName: string) {
  const link = document.createElement('a')
  link.href = fileUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 客户端导出Markdown内容
 * @param content Markdown内容
 * @param fileName 文件名
 */
export function clientExportMarkdown(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  downloadExportedFile(url, fileName)
  URL.revokeObjectURL(url)
}

/**
 * 客户端导出HTML内容
 * @param content HTML内容
 * @param fileName 文件名
 */
export function clientExportHtml(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  downloadExportedFile(url, fileName)
  URL.revokeObjectURL(url)
}
