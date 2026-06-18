<template>
  <div class="layout">
    <el-container>
      <!-- 侧边栏导航 -->
      <el-aside class="aside" :class="{ show: isMobile && showSidebar }" :width="isMobile ? '0' : '200px'">
        <div class="logo">
          <el-icon :size="28"><Picture /></el-icon>
          <span>ImgTools</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          :collapse="isMobile"
          class="nav-menu"
        >
          <el-menu-item index="/">
            <el-icon><Upload /></el-icon>
            <span>上传</span>
          </el-menu-item>
          <el-menu-item index="/album">
            <el-icon><Grid /></el-icon>
            <span>相册</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <!-- 顶部栏（移动端） -->
        <el-header class="header mobile-only">
          <div class="header-left">
            <el-icon :size="24" @click="toggleSidebar"><Menu /></el-icon>
            <span class="title">ImgTools</span>
          </div>
          <el-radio-group v-model="activeMenu" size="small">
            <el-radio-button value="/" label="上传">
              <el-icon><Upload /></el-icon>
            </el-radio-button>
            <el-radio-button value="/album" label="相册">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
            <el-radio-button value="/settings" label="设置">
              <el-icon><Setting /></el-icon>
            </el-radio-button>
          </el-radio-group>
        </el-header>

        <!-- 主内容区 -->
        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>

    <!-- 移动端侧边栏遮罩 -->
    <div v-if="isMobile && showSidebar" class="sidebar-overlay" @click="toggleSidebar" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Picture, Upload, Grid, Setting, Menu } from '@element-plus/icons-vue'

const route = useRoute()
import { useRouter } from 'vue-router'
const router = useRouter()

const isMobile = ref(false)
const showSidebar = ref(false)

// 使用可读写的 activeMenu，以便顶部的单选按钮能够改变路由
const activeMenu = ref(route.path)

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

function toggleSidebar() {
  showSidebar.value = !showSidebar.value
}

// 当 route 变化时，同步 activeMenu，并在移动端关闭侧栏
import { watch } from 'vue'
watch(
  () => route.path,
  (p) => {
    activeMenu.value = p
    if (isMobile.value) showSidebar.value = false
  }
)

// 当 activeMenu 改变（例如通过顶部单选按钮），导航到相应路由
watch(activeMenu, (val, oldVal) => {
  if (val && val !== route.path) {
    router.push(val).catch(() => {})
    if (isMobile.value) showSidebar.value = false
  }
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="less" scoped>
.layout {
  min-height: 100vh;
}

.aside {
  background: @bg-card;
  box-shadow: @shadow-sm;
  min-height: 100vh;

  transition: transform @transition-normal;

  .logo {
    display: flex;
    align-items: center;
    gap: @spacing-sm;
    padding: @spacing-lg;
    font-size: @font-size-xl;
    font-weight: 600;
    color: @primary-color;

    .el-icon {
      color: @primary-color;
    }
  }

  .nav-menu {
    border-right: none;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: @bg-card;
  box-shadow: @shadow-sm;
  padding: @spacing-md;

  .header-left {
    display: flex;
    align-items: center;
    gap: @spacing-md;

    .el-icon {
      cursor: pointer;
      color: @primary-color;
    }

    .title {
      font-size: @font-size-lg;
      font-weight: 600;
      color: @primary-color;
    }
  }
}

.main-content {
  background: @bg-color;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.transition {
  &-enter-active,
  &-leave-active {
    transition: opacity @transition-normal ease;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .aside {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 999;
    transform: translateX(-100%);

    &.show {
      transform: translateX(0);
    }
  }
}
</style>
