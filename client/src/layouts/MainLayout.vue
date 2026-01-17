<template>
  <el-container style="height: 100vh">
    <el-aside width="240px" class="sidebar">
      <div class="logo-section">
        <el-icon :size="40" color="#fff"><UserFilled /></el-icon>
        <h2>CMCC考勤系统</h2>
      </div>
      <el-menu
        :default-active="currentRoute"
        class="sidebar-menu"
        background-color="transparent"
        text-color="#b8c7ea"
        active-text-color="#ffffff"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/attendance" class="menu-item">
          <el-icon><Calendar /></el-icon>
          <span>签到管理</span>
        </el-menu-item>
        <el-menu-item index="/random-call" class="menu-item">
          <el-icon><User /></el-icon>
          <span>随机点名</span>
        </el-menu-item>
        <el-menu-item index="/employees" class="menu-item">
          <el-icon><UserFilled /></el-icon>
          <span>人员管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-content">
          <h1 class="header-title">CMCC考勤系统</h1>
          <div class="header-time">{{ currentTime }}</div>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Calendar, User, Document, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const currentTime = ref('')

const currentRoute = computed(() => route.path)

const handleMenuSelect = (index) => {
  router.push(index)
}

// 更新时间
const updateTime = () => {
  const now = new Date()
  const date = now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
  const time = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
  currentTime.value = `${date} ${time}`
}

let timer = null
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
/* 侧边栏 - 科技渐变 */
.sidebar {
  background: linear-gradient(180deg, #1e3a8a 0%, #312e81 50%, #1e1b4b 100%);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* Logo区域 */
.logo-section {
  padding: 30px 20px;
  text-align: center;
  color: white;
  position: relative;
  z-index: 1;
}

.logo-section h2 {
  margin-top: 15px;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 菜单样式 */
.sidebar-menu {
  border: none;
  padding: 10px;
}

.menu-item {
  margin: 8px 0;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.2), transparent);
  transition: left 0.5s;
}

.menu-item:hover::before {
  left: 100%;
}

.menu-item:hover {
  background: rgba(96, 165, 250, 0.15) !important;
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(96, 165, 250, 0.3);
}

.menu-item.is-active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3)) !important;
  box-shadow: 0 4px 20px rgba(96, 165, 250, 0.4);
  border-left: 3px solid #60a5fa;
}

/* 顶部栏 - 玻璃态 */
.header {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0;
  height: 70px !important;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  color: white;
  font-size: 26px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

.header-time {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 20px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* 主内容区 */
.main-content {
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  padding: 25px;
  overflow-y: auto;
}

/* 滚动条美化 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.main-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #2563eb, #7c3aed);
}
</style>

