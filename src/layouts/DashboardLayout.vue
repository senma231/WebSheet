<template>
  <div class="dashboard-layout">
    <el-container class="layout-container">
      <el-aside width="220px" class="layout-aside">
        <div class="logo">
          <h2>WebSheet</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          :router="true"
          :collapse="isCollapse"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Document /></el-icon>
            <template #title>我的文档</template>
          </el-menu-item>
          
          <el-menu-item index="/dashboard/shared">
            <el-icon><Share /></el-icon>
            <template #title>共享文档</template>
          </el-menu-item>
          
          <el-menu-item index="/dashboard/templates">
            <el-icon><Files /></el-icon>
            <template #title>模板</template>
          </el-menu-item>
          
          <el-menu-item index="/dashboard/trash">
            <el-icon><Delete /></el-icon>
            <template #title>回收站</template>
          </el-menu-item>
          
          <el-divider />
          
          <el-menu-item index="/dashboard/settings">
            <el-icon><Setting /></el-icon>
            <template #title>设置</template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container class="layout-main">
        <el-header class="layout-header">
          <div class="header-left">
            <el-button
              type="text"
              :icon="isCollapse ? 'Expand' : 'Fold'"
              @click="toggleSidebar"
            />
          </div>
          
          <div class="header-right">
            <el-dropdown trigger="click" @command="handleCommand">
              <div class="user-profile">
                <el-avatar :size="32" :src="userAvatar">
                  {{ userInitials }}
                </el-avatar>
                <span class="username">{{ username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item command="settings">设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <el-main class="layout-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Document, Share, Files, Delete, Setting, Expand, Fold, ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

const username = computed(() => authStore.user?.username || '用户')
const userAvatar = computed(() => authStore.user?.avatar_url || '')
const userInitials = computed(() => {
  const name = authStore.user?.full_name || authStore.user?.username || ''
  return name.substring(0, 2).toUpperCase()
})

function toggleSidebar() {
  isCollapse.value = !isCollapse.value
}

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      router.push('/dashboard/profile')
      break
    case 'settings':
      router.push('/dashboard/settings')
      break
    case 'logout':
      authStore.logout()
      router.push('/login')
      break
  }
}
</script>

<style scoped>
.dashboard-layout {
  height: 100vh;
  width: 100vw;
}

.layout-container {
  height: 100%;
}

.layout-aside {
  background-color: #fff;
  border-right: 1px solid var(--border-color-light);
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color-light);
}

.logo h2 {
  color: var(--primary-color);
  margin: 0;
}

.sidebar-menu {
  border-right: none;
  flex: 1;
}

.layout-header {
  background-color: #fff;
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 8px;
}

.layout-content {
  background-color: var(--background-color-base);
  padding: 20px;
}
</style>
