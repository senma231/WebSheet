<template>
  <div class="folder-tree-select">
    <el-tree
      ref="folderTreeRef"
      :data="folderTree"
      node-key="id"
      :props="defaultProps"
      :default-expanded-keys="expandedKeys"
      :highlight-current="true"
      :expand-on-click-node="false"
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <div class="custom-tree-node">
          <el-icon><Folder /></el-icon>
          <span>{{ node.label }}</span>
        </div>
      </template>
    </el-tree>
    
    <div v-if="isLoading" class="loading-overlay">
      <el-icon class="loading-icon"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { Folder, Loading } from '@element-plus/icons-vue'
import { getFolders } from '@/api/document'
import type { Folder as FolderType } from '@/types/document'

const props = defineProps({
  currentFolderId: {
    type: String,
    default: ''
  },
  excludeFolderId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select'])

// 状态
const isLoading = ref(false)
const folderTree = ref<any[]>([])
const expandedKeys = ref<string[]>([])
const folderTreeRef = ref<any>(null)

// 树配置
const defaultProps = {
  children: 'children',
  label: 'name'
}

// 生命周期钩子
onMounted(async () => {
  await loadFolderTree()
})

// 方法
async function loadFolderTree() {
  isLoading.value = true
  
  try {
    // 加载根文件夹
    const rootFoldersResponse = await getFolders()
    const rootFolders = rootFoldersResponse.data.items
    
    // 构建树结构
    folderTree.value = [
      {
        id: 'root',
        name: '我的文档',
        children: await buildFolderTree(rootFolders)
      }
    ]
    
    // 展开当前文件夹的路径
    if (props.currentFolderId) {
      expandedKeys.value = ['root']
      // 这里应该有一个API来获取文件夹路径，然后展开路径上的所有文件夹
      // 暂时简单处理，只展开根节点
    } else {
      expandedKeys.value = ['root']
    }
    
    // 如果有当前文件夹，选中它
    if (props.currentFolderId && folderTreeRef.value) {
      // 等待树渲染完成后选中节点
      setTimeout(() => {
        folderTreeRef.value.setCurrentKey(props.currentFolderId)
      }, 100)
    }
  } catch (error) {
    console.error('Failed to load folder tree', error)
    ElMessage.error('加载文件夹树失败')
  } finally {
    isLoading.value = false
  }
}

async function buildFolderTree(folders: FolderType[]) {
  // 过滤掉被排除的文件夹
  const filteredFolders = folders.filter(folder => folder.id !== props.excludeFolderId)
  
  // 构建树节点
  const treeNodes = []
  
  for (const folder of filteredFolders) {
    // 获取子文件夹
    let children: any[] = []
    try {
      const childFoldersResponse = await getFolders(folder.id)
      const childFolders = childFoldersResponse.data.items.filter(f => f.id !== props.excludeFolderId)
      
      if (childFolders.length > 0) {
        children = await buildFolderTree(childFolders)
      }
    } catch (error) {
      console.error(`Failed to load subfolders for folder ${folder.id}`, error)
      // 继续处理其他文件夹
    }
    
    treeNodes.push({
      id: folder.id,
      name: folder.name,
      children: children
    })
  }
  
  return treeNodes
}

function handleNodeClick(data: any) {
  // 如果点击的是被排除的文件夹，不触发选择事件
  if (data.id === props.excludeFolderId) {
    return
  }
  
  // 触发选择事件
  emit('select', data.id === 'root' ? null : data.id)
}
</script>

<style scoped>
.folder-tree-select {
  position: relative;
  height: 300px;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-icon {
  font-size: 24px;
}
</style>
