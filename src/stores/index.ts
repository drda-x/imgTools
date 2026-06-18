import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ImageItem {
  id: string
  url: string
  name: string
  size: number
  uploadDate: string
  thumbnail?: string
}

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
  uploadPath: string
  customDomain?: string
}

export const useSettingsStore = defineStore('settings', () => {
  const config = ref<GitHubConfig>({
    token: '',
    owner: '',
    repo: '',
    branch: 'main',
    uploadPath: 'images',
    customDomain: ''
  })

  function loadSettings() {
    const saved = localStorage.getItem('imgtools-github-config')
    if (saved) {
      config.value = { ...config.value, ...JSON.parse(saved) }
    }
  }

  function saveSettings() {
    localStorage.setItem('imgtools-github-config', JSON.stringify(config.value))
  }

  return { config, loadSettings, saveSettings }
})

export const useImageStore = defineStore('images', () => {
  const images = ref<ImageItem[]>([])
  const loading = ref(false)

  function addImage(image: ImageItem) {
    images.value.unshift(image)
  }

  function removeImage(id: string) {
    images.value = images.value.filter(img => img.id !== id)
  }

  function clearImages() {
    images.value = []
  }

  function loadImages() {
    const saved = localStorage.getItem('imgtools-images')
    if (saved) {
      try {
        images.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to load images:', e)
      }
    }
  }

  function saveImages() {
    try {
      localStorage.setItem('imgtools-images', JSON.stringify(images.value))
    } catch (e) {
      console.error('Failed to save images:', e)
    }
  }

  return { images, loading, addImage, removeImage, clearImages, loadImages, saveImages }
})
