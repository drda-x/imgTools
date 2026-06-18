<template>
  <div class="home">
    <div class="page-header">
      <h1>上传图片</h1>
      <p>拖拽、粘贴或点击选择图片上传到 GitHub</p>
    </div>

    <el-card class="upload-card" shadow="hover">
      <!-- 拖拽区域 -->
      <div
        class="drop-zone"
        :class="{ 'is-dragging': isDragging, 'has-error': hasError }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click.stop
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          @change="handleFileSelect"
          class="file-input"
        />

        <div v-if="!isUploading" class="drop-content">
          <el-icon :size="48" class="drop-icon"><UploadFilled /></el-icon>
          <p class="drop-text">拖拽图片到此处</p>
          <p class="drop-hint">或点击选择文件</p>
          <el-button type="primary" class="select-btn" @click="triggerFileSelect">
            <el-icon><Plus /></el-icon>
            选择图片
          </el-button>
          <p class="drop-paste pc-only">
            <el-icon><Document /></el-icon>
            也可以直接粘贴图片 (Ctrl+V)
          </p>
        </div>

        <!-- 上传进度 -->
        <div v-if="isUploading" class="upload-progress">
          <el-progress
            type="circle"
            :percentage="uploadProgress"
            :color="uploadProgress === 100 ? '#67C23A' : '#FF8C69'"
          />
          <p class="progress-text">正在上传...</p>
        </div>
      </div>

      <!-- 待上传文件列表 -->
      <div v-if="pendingFiles.length" class="file-list">
        <div
          v-for="(file, index) in pendingFiles"
          :key="index"
          class="file-item fade-in"
        >
          <el-thumbnail :src="file.preview" :alt="file.name" class="file-thumb" />
          <div class="file-info">
            <p class="file-name">{{ file.name }}</p>
            <p class="file-size">{{ formatFileSize(file.size) }}</p>
          </div>
          <el-button
            v-if="!file.uploading"
            type="danger"
            text
            @click="removePendingFile(index)"
          >
            <el-icon><Close /></el-icon>
          </el-button>
          <el-icon v-else-if="file.uploading" class="loading-icon"><Loading /></el-icon>
        </div>
      </div>

      <!-- 错误提示 -->
      <el-alert
        v-if="hasError"
        :title="errorMessage"
        type="error"
        closable
        class="error-alert"
        @close="hasError = false"
      />
    </el-card>

    <!-- 已上传的图片列表 -->
    <div v-if="uploadedImages.length" class="uploaded-section">
      <div class="section-header">
        <h2>已上传的图片</h2>
        <el-button type="primary" text @click="copyAllLinks">
          <el-icon><CopyDocument /></el-icon>
          复制所有链接
        </el-button>
      </div>

      <div class="link-format-selector">
        <span class="format-label">链接格式：</span>
        <el-radio-group v-model="linkFormat" size="small">
          <el-radio-button value="markdown">Markdown</el-radio-button>
          <el-radio-button value="html">HTML</el-radio-button>
          <el-radio-button value="url">URL</el-radio-button>
          <el-radio-button value="ubb">UBB</el-radio-button>
          <el-radio-button value="custom">自定义</el-radio-button>
        </el-radio-group>
      </div>

      <div v-if="linkFormat === 'custom'" class="custom-pattern">
        <el-input
          v-model="customPattern"
          placeholder="输入自定义格式，使用 {url} 和 {name} 作为占位符"
          size="small"
        />
      </div>

      <div class="image-grid">
        <el-card
          v-for="image in uploadedImages"
          :key="image.id"
          class="image-card fade-in"
          shadow="hover"
        >
          <el-image
            :src="image.url"
            fit="cover"
            class="image-preview"
            lazy
            @click="previewImage(image.url)"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>

          <div class="image-info">
            <p class="image-name">{{ image.name }}</p>
            <p class="image-date">{{ formatDate(image.uploadDate) }}</p>
          </div>

          <div class="link-section">
            <el-input
              :model-value="getImageLink(image)"
              readonly
              size="small"
              class="link-input"
            >
              <template #append>
                <el-button @click="copyLink(image)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="80%" :before-close="closePreview">
      <img :src="previewUrl" class="preview-image" alt="预览图片" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useSettingsStore, useImageStore, type ImageItem } from '@/stores'
import { uploadToGitHub, generateLink } from '@/utils/api'
import {
  UploadFilled,
  Plus,
  Close,
  Loading,
  Document,
  CopyDocument,
  Picture
} from '@element-plus/icons-vue'

const settingsStore = useSettingsStore()
const imageStore = useImageStore()

// 状态
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const pendingFiles = ref<Array<{
  file: File
  preview: string
  uploading: boolean
}>>([])
const hasError = ref(false)
const errorMessage = ref('')
const linkFormat = ref('markdown')
const customPattern = ref('{url}')
const uploadedImages = computed(() => imageStore.images)

// 预览
const previewVisible = ref(false)
const previewUrl = ref('')

// 监听粘贴事件
function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        addPendingFile(file)
      }
    }
  }
}

// 拖拽处理
function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        addPendingFile(file)
      }
    })
  }
}

// 文件选择处理
function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files) {
    Array.from(files).forEach(file => {
      addPendingFile(file)
    })
    target.value = ''
  }
}

function triggerFileSelect() {
  fileInput.value?.click()
}

// 添加待上传文件
function addPendingFile(file: File) {
  const preview = URL.createObjectURL(file)
  pendingFiles.value.push({
    file,
    preview,
    uploading: false
  })
}

function removePendingFile(index: number) {
  const { preview } = pendingFiles.value[index]
  URL.revokeObjectURL(preview)
  pendingFiles.value.splice(index, 1)
}

// 上传所有文件
async function uploadFiles() {
  if (pendingFiles.value.length === 0) return

  const config = settingsStore.config
  if (!config.token || !config.owner || !config.repo) {
    ElMessage.warning('请先在设置中配置 GitHub 信息')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0

  for (let i = 0; i < pendingFiles.value.length; i++) {
    const pending = pendingFiles.value[i]
    if (pending.uploading) continue

    pending.uploading = true
    hasError.value = false

    try {
      const image = await uploadToGitHub(config, pending.file, (percent) => {
        uploadProgress.value = percent
      })

      imageStore.addImage(image)
      imageStore.saveImages()

      URL.revokeObjectURL(pending.preview)
      pendingFiles.value.splice(i, 1)
      i--

      ElMessage.success(`上传成功: ${pending.file.name}`)
    } catch (error: any) {
      console.error('Upload failed:', error)
      hasError.value = true
      errorMessage.value = error.response?.data?.message || error.message || '上传失败'
      pending.uploading = false
    }
  }

  isUploading.value = false
  uploadProgress.value = 0
}

// 生成图片链接
function getImageLink(image: ImageItem): string {
  return generateLink(image, linkFormat.value, customPattern.value)
}

// 复制链接
async function copyLink(image: ImageItem) {
  try {
    await navigator.clipboard.writeText(getImageLink(image))
    ElMessage.success('链接已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 复制所有链接
async function copyAllLinks() {
  const links = uploadedImages.value.map(img => getImageLink(img)).join('\n')
  try {
    await navigator.clipboard.writeText(links)
    ElMessage.success('所有链接已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 预览图片
function previewImage(url: string) {
  previewUrl.value = url
  previewVisible.value = true
}

function closePreview() {
  previewVisible.value = false
}

// 工具函数
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  document.addEventListener('paste', handlePaste)
  settingsStore.loadSettings()
  imageStore.loadImages()
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
  pendingFiles.value.forEach(({ preview }) => URL.revokeObjectURL(preview))
})

// 当有待上传文件时自动上传
import { watch } from 'vue'
watch(pendingFiles, (newFiles) => {
  if (newFiles.length > 0 && !isUploading.value) {
    uploadFiles()
  }
}, { deep: true })
</script>

<style lang="less" scoped>
.home {
  padding: @spacing-lg;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: @spacing-xl;

  h1 {
    font-size: @font-size-xxl;
    color: @primary-color;
    margin-bottom: @spacing-sm;
  }

  p {
    color: @text-secondary;
  }
}

.upload-card {
  margin-bottom: @spacing-xl;

  .drop-zone {
    position: relative;
    border: 2px dashed @border-color;
    border-radius: @border-radius-lg;
    padding: @spacing-xxl;
    text-align: center;
    cursor: pointer;
    transition: all @transition-normal;
    background: @bg-secondary;

    &:hover,
    &.is-dragging {
      border-color: @primary-color;
      background: lighten(@primary-color, 40%);
    }

    &.has-error {
      border-color: @danger-color;
    }

    .drop-content {
      .drop-icon {
        color: @primary-color;
        margin-bottom: @spacing-md;
      }

      .drop-text {
        font-size: @font-size-lg;
        color: @text-primary;
        margin-bottom: @spacing-xs;
      }

      .drop-hint {
        font-size: @font-size-sm;
        color: @text-secondary;
        margin-bottom: @spacing-md;
      }

      .select-btn {
        margin-top: @spacing-md;
      }

      .drop-paste {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: @spacing-xs;
        margin-top: @spacing-md;
        font-size: @font-size-sm;
        color: @text-light;
      }
    }

    .upload-progress {
      .progress-text {
        margin-top: @spacing-md;
        color: @text-secondary;
      }
    }

    .file-input {
      display: none;
    }
  }
}

.file-list {
  margin-top: @spacing-lg;

  .file-item {
    display: flex;
    align-items: center;
    gap: @spacing-md;
    padding: @spacing-md;
    background: @bg-secondary;
    border-radius: @border-radius;
    margin-bottom: @spacing-sm;

    .file-thumb {
      width: 60px;
      height: 60px;
      border-radius: @border-radius-sm;
    }

    .file-info {
      flex: 1;

      .file-name {
        font-size: @font-size-md;
        color: @text-primary;
      }

      .file-size {
        font-size: @font-size-sm;
        color: @text-secondary;
      }
    }

    .loading-icon {
      animation: rotate 1s linear infinite;
    }
  }
}

.error-alert {
  margin-top: @spacing-md;
}

.uploaded-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: @spacing-lg;

    h2 {
      font-size: @font-size-xl;
      color: @text-primary;
    }
  }

  .link-format-selector {
    display: flex;
    align-items: center;
    gap: @spacing-md;
    margin-bottom: @spacing-lg;
    padding: @spacing-md;
    background: @bg-card;
    border-radius: @border-radius;

    .format-label {
      font-weight: 500;
    }
  }

  .custom-pattern {
    margin-bottom: @spacing-lg;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: @spacing-lg;
  }

  .image-card {
    .image-preview {
      width: 100%;
      height: 200px;
      border-radius: @border-radius-sm;
      cursor: pointer;

      &:hover {
        opacity: 0.9;
      }

      .image-error {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: @bg-secondary;
        color: @text-light;
        font-size: 32px;
      }
    }

    .image-info {
      padding: @spacing-md 0;

      .image-name {
        font-size: @font-size-sm;
        color: @text-primary;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .image-date {
        font-size: @font-size-xs;
        color: @text-light;
        margin-top: @spacing-xs;
      }
    }

    .link-section {
      .link-input {
        :deep(.el-input__inner) {
          font-size: @font-size-xs;
        }
      }
    }
  }
}

.preview-image {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .home {
    padding: @spacing-md;
  }

  .page-header {
    h1 {
      font-size: @font-size-xl;
    }
  }

  .uploaded-section {
    .image-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: @spacing-md;
    }

    .image-card {
      .image-preview {
        height: 150px;
      }
    }
  }
}
</style>
