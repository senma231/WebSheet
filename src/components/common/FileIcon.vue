<template>
  <div :class="['file-icon', `file-icon-${fileType}`, { 'file-icon-large': large }]">
    <el-icon v-if="fileType === 'folder'"><Folder /></el-icon>
    <el-icon v-else-if="fileType === 'word'"><Document /></el-icon>
    <el-icon v-else-if="fileType === 'excel'"><Grid /></el-icon>
    <el-icon v-else-if="fileType === 'ppt'"><PictureFilled /></el-icon>
    <el-icon v-else-if="fileType === 'pdf'"><Files /></el-icon>
    <el-icon v-else-if="fileType === 'image'"><Picture /></el-icon>
    <el-icon v-else-if="fileType === 'video'"><VideoPlay /></el-icon>
    <el-icon v-else-if="fileType === 'audio'"><Headset /></el-icon>
    <el-icon v-else-if="fileType === 'archive'"><Box /></el-icon>
    <el-icon v-else-if="fileType === 'code'"><Terminal /></el-icon>
    <el-icon v-else-if="fileType === 'markdown'"><Memo /></el-icon>
    <el-icon v-else><Document /></el-icon>
    
    <span v-if="showExtension && extension" class="file-extension">{{ extension }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue'
import { Folder, Document, Grid, PictureFilled, Files, Picture, VideoPlay, Headset, Box, Terminal, Memo } from '@element-plus/icons-vue'

// 定义属性
const props = defineProps({
  filename: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: ''
  },
  large: {
    type: Boolean,
    default: false
  },
  showExtension: {
    type: Boolean,
    default: false
  }
})

// 计算属性
const extension = computed(() => {
  if (props.filename === '' || props.type === 'folder') return ''
  
  const parts = props.filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
})

const fileType = computed(() => {
  if (props.type === 'folder') return 'folder'
  
  // 如果提供了明确的类型，直接使用
  if (props.type) {
    switch (props.type.toLowerCase()) {
      case 'word':
      case 'docx':
      case 'doc':
        return 'word'
      case 'excel':
      case 'xlsx':
      case 'xls':
        return 'excel'
      case 'ppt':
      case 'pptx':
        return 'ppt'
      case 'pdf':
        return 'pdf'
      case 'markdown':
      case 'md':
        return 'markdown'
      default:
        return props.type.toLowerCase()
    }
  }
  
  // 根据文件扩展名判断类型
  const ext = extension.value
  
  if (!ext) return 'unknown'
  
  // 文档类型
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext)) {
    return 'word'
  }
  
  // 表格类型
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
    return 'excel'
  }
  
  // 演示文稿类型
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return 'ppt'
  }
  
  // PDF类型
  if (ext === 'pdf') {
    return 'pdf'
  }
  
  // Markdown类型
  if (['md', 'markdown'].includes(ext)) {
    return 'markdown'
  }
  
  // 图片类型
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
    return 'image'
  }
  
  // 视频类型
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
    return 'video'
  }
  
  // 音频类型
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return 'audio'
  }
  
  // 压缩文件类型
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'archive'
  }
  
  // 代码类型
  if (['js', 'ts', 'html', 'css', 'php', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'swift', 'json', 'xml'].includes(ext)) {
    return 'code'
  }
  
  // 默认类型
  return 'unknown'
})
</script>

<style scoped>
.file-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 24px;
  height: 24px;
  font-size: 20px;
}

.file-icon-large {
  width: 48px;
  height: 48px;
  font-size: 40px;
}

.file-icon-folder {
  color: #ffc107;
}

.file-icon-word {
  color: #4285f4;
}

.file-icon-excel {
  color: #0f9d58;
}

.file-icon-ppt {
  color: #db4437;
}

.file-icon-pdf {
  color: #db4437;
}

.file-icon-image {
  color: #4285f4;
}

.file-icon-video {
  color: #db4437;
}

.file-icon-audio {
  color: #4285f4;
}

.file-icon-archive {
  color: #795548;
}

.file-icon-code {
  color: #607d8b;
}

.file-icon-markdown {
  color: #7e57c2;
}

.file-extension {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 8px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 2px;
  padding: 0 2px;
  text-transform: uppercase;
}

.file-icon-large .file-extension {
  font-size: 12px;
  padding: 0 4px;
}
</style>
