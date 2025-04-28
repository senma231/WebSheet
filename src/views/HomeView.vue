<template>
  <div class="home-container">
    <header class="header">
      <div class="logo">
        <h1>WebSheet</h1>
      </div>
      <div class="nav">
        <el-button type="primary" @click="goToLogin">登录</el-button>
      </div>
    </header>
    
    <main class="main">
      <div class="hero">
        <h2>高效、专业的在线文档编辑系统</h2>
        <p>基于Vue-Office的企业级在线文档协同编辑平台</p>
        <el-button type="primary" size="large" @click="goToLogin">开始使用</el-button>
      </div>
      
      <div class="features">
        <div class="feature-item">
          <el-icon size="48"><Document /></el-icon>
          <h3>多格式支持</h3>
          <p>支持Word、Excel、PPT、PDF和Markdown等多种文档格式</p>
        </div>
        
        <div class="feature-item">
          <el-icon size="48"><Share /></el-icon>
          <h3>协同办公</h3>
          <p>实时协同编辑，多人同时编辑文档，提高团队效率</p>
        </div>
        
        <div class="feature-item">
          <el-icon size="48"><Files /></el-icon>
          <h3>版本控制</h3>
          <p>完善的文档版本控制，轻松追踪和恢复历史版本</p>
        </div>
        
        <div class="feature-item">
          <el-icon size="48"><Lock /></el-icon>
          <h3>安全可靠</h3>
          <p>企业级安全保障，数据加密存储，权限精细控制</p>
        </div>
      </div>
    </main>
    
    <footer class="footer">
      <p>© {{ new Date().getFullYear() }} WebSheet. 保留所有权利。</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Document, Share, Files, Lock } from '@element-plus/icons-vue'

const router = useRouter()

function goToLogin() {
  router.push('/login')
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logo h1 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.8rem;
}

.main {
  flex: 1;
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 4rem 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.hero h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--text-color-primary);
}

.hero p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: var(--text-color-regular);
}

.features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  padding: 2rem 0;
}

.feature-item {
  flex: 1;
  min-width: 250px;
  max-width: 300px;
  text-align: center;
  padding: 2rem;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.feature-item h3 {
  margin: 1rem 0;
  color: var(--text-color-primary);
}

.feature-item p {
  color: var(--text-color-regular);
}

.footer {
  text-align: center;
  padding: 1.5rem;
  background-color: var(--background-color-base);
  color: var(--text-color-secondary);
}
</style>
