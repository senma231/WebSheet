<template>
  <div class="template-management-view">
    <el-card class="template-management-card">
      <template #header>
        <div class="card-header">
          <h2>模板管理</h2>
          <div class="header-actions">
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="模板库" name="templates">
          <template-gallery
            @template-selected="handleTemplateSelected"
            @template-created="handleTemplateCreated"
            @template-updated="handleTemplateUpdated"
            @template-deleted="handleTemplateDeleted"
          />
        </el-tab-pane>
        
        <el-tab-pane label="分类管理" name="categories">
          <template-category-manager
            @category-created="handleCategoryCreated"
            @category-updated="handleCategoryUpdated"
            @category-deleted="handleCategoryDeleted"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import TemplateGallery from '@/components/document/TemplateGallery.vue'
import TemplateCategoryManager from '@/components/document/TemplateCategoryManager.vue'
import type { Template, TemplateCategory } from '@/types/template'

const router = useRouter()
const activeTab = ref('templates')

// 处理模板相关事件
function handleTemplateSelected(template: Template & { documentId: string }) {
  ElMessage.success(`已创建文档: ${template.title}`)
  router.push(`/dashboard/document/${template.documentId}`)
}

function handleTemplateCreated(template: Template) {
  ElMessage.success(`模板 "${template.title}" 创建成功`)
}

function handleTemplateUpdated(template: Template) {
  ElMessage.success(`模板 "${template.title}" 更新成功`)
}

function handleTemplateDeleted(template: Template) {
  ElMessage.success(`模板 "${template.title}" 已删除`)
}

// 处理分类相关事件
function handleCategoryCreated(category: TemplateCategory) {
  ElMessage.success(`分类 "${category.name}" 创建成功`)
}

function handleCategoryUpdated(category: TemplateCategory) {
  ElMessage.success(`分类 "${category.name}" 更新成功`)
}

function handleCategoryDeleted(category: TemplateCategory) {
  ElMessage.success(`分类 "${category.name}" 已删除`)
}

// 返回上一页
function goBack() {
  router.back()
}
</script>

<style scoped>
.template-management-view {
  padding: 20px;
}

.template-management-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
}
</style>
