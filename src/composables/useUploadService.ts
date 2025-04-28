import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/utils/http'

interface UploadPart {
  part_number: number
  upload_url: string
  etag?: string
  size: number
  uploaded: boolean
}

interface UploadTask {
  id: string
  file: File
  filename: string
  content_type: string
  size: number
  parts: UploadPart[]
  uploaded_size: number
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'
  error?: string
  progress: number
  created_at: Date
  storage_path?: string
}

export function useUploadService() {
  // 状态
  const uploadTasks = ref<UploadTask[]>([])
  const currentUploads = ref<Set<string>>(new Set())
  const maxConcurrentUploads = ref(3)
  
  // 计算属性
  const pendingTasks = computed(() => {
    return uploadTasks.value.filter(task => task.status === 'pending')
  })
  
  const activeTasks = computed(() => {
    return uploadTasks.value.filter(task => task.status === 'uploading')
  })
  
  const completedTasks = computed(() => {
    return uploadTasks.value.filter(task => task.status === 'completed')
  })
  
  const failedTasks = computed(() => {
    return uploadTasks.value.filter(task => task.status === 'error')
  })
  
  const pausedTasks = computed(() => {
    return uploadTasks.value.filter(task => task.status === 'paused')
  })
  
  const overallProgress = computed(() => {
    if (uploadTasks.value.length === 0) return 0
    
    const totalSize = uploadTasks.value.reduce((sum, task) => sum + task.size, 0)
    const uploadedSize = uploadTasks.value.reduce((sum, task) => sum + task.uploaded_size, 0)
    
    return Math.floor((uploadedSize / totalSize) * 100)
  })
  
  // 方法
  function createUploadTask(file: File): UploadTask {
    const id = generateId()
    
    const task: UploadTask = {
      id,
      file,
      filename: file.name,
      content_type: file.type,
      size: file.size,
      parts: [],
      uploaded_size: 0,
      status: 'pending',
      progress: 0,
      created_at: new Date()
    }
    
    uploadTasks.value.push(task)
    
    return task
  }
  
  async function startUpload(taskId: string) {
    const task = uploadTasks.value.find(t => t.id === taskId)
    if (!task) {
      console.error(`Upload task ${taskId} not found`)
      return
    }
    
    if (task.status === 'uploading') {
      console.warn(`Upload task ${taskId} is already uploading`)
      return
    }
    
    if (task.status === 'completed') {
      console.warn(`Upload task ${taskId} is already completed`)
      return
    }
    
    // 更新任务状态
    task.status = 'uploading'
    task.error = undefined
    
    try {
      // 如果还没有初始化上传，先初始化
      if (task.parts.length === 0) {
        await initializeUpload(task)
      }
      
      // 添加到当前上传队列
      currentUploads.value.add(taskId)
      
      // 上传文件分片
      await uploadParts(task)
      
      // 完成上传
      await completeUpload(task)
      
      // 更新任务状态
      task.status = 'completed'
      task.progress = 100
      
      ElMessage.success(`文件 ${task.filename} 上传成功`)
    } catch (error: any) {
      console.error(`Failed to upload file ${task.filename}`, error)
      
      // 更新任务状态
      task.status = 'error'
      task.error = error.message || '上传失败'
      
      ElMessage.error(`文件 ${task.filename} 上传失败: ${task.error}`)
    } finally {
      // 从当前上传队列中移除
      currentUploads.value.delete(taskId)
      
      // 检查是否有等待中的任务可以开始上传
      checkPendingTasks()
    }
  }
  
  function pauseUpload(taskId: string) {
    const task = uploadTasks.value.find(t => t.id === taskId)
    if (!task) {
      console.error(`Upload task ${taskId} not found`)
      return
    }
    
    if (task.status !== 'uploading') {
      console.warn(`Upload task ${taskId} is not uploading`)
      return
    }
    
    // 更新任务状态
    task.status = 'paused'
    
    // 从当前上传队列中移除
    currentUploads.value.delete(taskId)
    
    // 检查是否有等待中的任务可以开始上传
    checkPendingTasks()
  }
  
  function resumeUpload(taskId: string) {
    const task = uploadTasks.value.find(t => t.id === taskId)
    if (!task) {
      console.error(`Upload task ${taskId} not found`)
      return
    }
    
    if (task.status !== 'paused' && task.status !== 'error') {
      console.warn(`Upload task ${taskId} is not paused or in error state`)
      return
    }
    
    // 如果当前上传数量已达到最大值，则将任务状态设为等待中
    if (currentUploads.value.size >= maxConcurrentUploads.value) {
      task.status = 'pending'
      return
    }
    
    // 开始上传
    startUpload(taskId)
  }
  
  function cancelUpload(taskId: string) {
    const taskIndex = uploadTasks.value.findIndex(t => t.id === taskId)
    if (taskIndex === -1) {
      console.error(`Upload task ${taskId} not found`)
      return
    }
    
    const task = uploadTasks.value[taskIndex]
    
    // 如果任务正在上传，先暂停
    if (task.status === 'uploading') {
      pauseUpload(taskId)
    }
    
    // 从任务列表中移除
    uploadTasks.value.splice(taskIndex, 1)
  }
  
  function retryUpload(taskId: string) {
    const task = uploadTasks.value.find(t => t.id === taskId)
    if (!task) {
      console.error(`Upload task ${taskId} not found`)
      return
    }
    
    if (task.status !== 'error') {
      console.warn(`Upload task ${taskId} is not in error state`)
      return
    }
    
    // 重置上传进度
    task.uploaded_size = 0
    task.progress = 0
    
    // 重置已上传的分片状态
    task.parts.forEach(part => {
      part.uploaded = false
      part.etag = undefined
    })
    
    // 如果当前上传数量已达到最大值，则将任务状态设为等待中
    if (currentUploads.value.size >= maxConcurrentUploads.value) {
      task.status = 'pending'
      return
    }
    
    // 开始上传
    startUpload(taskId)
  }
  
  function uploadFile(file: File) {
    const task = createUploadTask(file)
    
    // 如果当前上传数量已达到最大值，则将任务状态设为等待中
    if (currentUploads.value.size >= maxConcurrentUploads.value) {
      return task
    }
    
    // 开始上传
    startUpload(task.id)
    
    return task
  }
  
  function checkPendingTasks() {
    // 如果当前上传数量小于最大值，且有等待中的任务，则开始上传
    if (currentUploads.value.size < maxConcurrentUploads.value && pendingTasks.value.length > 0) {
      const task = pendingTasks.value[0]
      startUpload(task.id)
    }
  }
  
  // 内部方法
  async function initializeUpload(task: UploadTask) {
    // 调用API初始化分片上传
    const response = await http.post('/api/v1/storage/upload', {
      filename: task.filename,
      content_type: task.content_type,
      size: task.size
    })
    
    // 更新任务信息
    task.id = response.data.upload_id
    task.parts = response.data.parts.map((part: any) => ({
      part_number: part.part_number,
      upload_url: part.upload_url,
      size: part.size,
      uploaded: false
    }))
  }
  
  async function uploadParts(task: UploadTask) {
    // 获取未上传的分片
    const pendingParts = task.parts.filter(part => !part.uploaded)
    
    // 上传分片
    for (const part of pendingParts) {
      // 如果任务已暂停或出错，停止上传
      if (task.status !== 'uploading') {
        break
      }
      
      try {
        // 计算分片数据
        const start = (part.part_number - 1) * part.size
        const end = Math.min(start + part.size, task.size)
        const blob = task.file.slice(start, end)
        
        // 上传分片
        const response = await fetch(part.upload_url, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': task.content_type
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to upload part ${part.part_number}: ${response.statusText}`)
        }
        
        // 获取ETag
        const etag = response.headers.get('ETag') || response.headers.get('etag')
        if (!etag) {
          throw new Error(`No ETag returned for part ${part.part_number}`)
        }
        
        // 更新分片状态
        part.etag = etag.replace(/"/g, '')
        part.uploaded = true
        
        // 更新上传进度
        task.uploaded_size += (end - start)
        task.progress = Math.floor((task.uploaded_size / task.size) * 100)
      } catch (error) {
        console.error(`Failed to upload part ${part.part_number}`, error)
        throw error
      }
    }
  }
  
  async function completeUpload(task: UploadTask) {
    // 检查是否所有分片都已上传
    const allPartsUploaded = task.parts.every(part => part.uploaded && part.etag)
    if (!allPartsUploaded) {
      throw new Error('Not all parts have been uploaded')
    }
    
    // 调用API完成上传
    const response = await http.post(`/api/v1/storage/upload/${task.id}/complete`, {
      parts: task.parts.map(part => ({
        part_number: part.part_number,
        etag: part.etag
      }))
    })
    
    // 更新存储路径
    task.storage_path = response.data.storage_path
  }
  
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }
  
  return {
    uploadTasks,
    pendingTasks,
    activeTasks,
    completedTasks,
    failedTasks,
    pausedTasks,
    overallProgress,
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload
  }
}
