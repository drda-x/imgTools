import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/default.vue'
import { useSettingsStore } from '@/stores'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '上传图片' }
      },
      {
        path: 'album',
        name: 'Album',
        component: () => import('@/views/Album.vue'),
        meta: { title: '相册' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  // 加载本地保存的配置并在未配置时重定向到设置页
  const settingsStore = useSettingsStore()
  settingsStore.loadSettings()

  document.title = `${to.meta.title || 'ImgTools'} - ImgTools`

  const cfg = settingsStore.config
  const needConfig = !cfg.token || !cfg.owner || !cfg.repo

  if (needConfig && to.path !== '/settings') {
    // 跳转并携带原始目标，保存用户上下文
    next({ path: '/settings', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
