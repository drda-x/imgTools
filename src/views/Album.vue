<template>
  <div class="album">
    <div class="page-header">
      <h1>我的相册</h1>
      <p>管理所有已上传的图片</p>
    </div>

    <el-card class="album-card" shadow="hover">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索图片名称..."
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="view-toggle">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button value="grid">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
            <el-radio-button value="list">
              <el-icon><List /></el-icon>
            </el-radio-button>
          </el-radio-group>
        </div>

        <el-radio-group v-model="linkFormat" size="small" class="format-group">
          <el-radio-button value="markdown">Markdown</el-radio-button>
          <el-radio-button value="html">HTML</el-radio-button>
          <el-radio-button value="url">URL</el-radio-button>
          <el-radio-button value="ubb">UBB</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="filteredImages.length === 0"
        description="暂无图片，快去上传吧！"
      >
        <el-button type="primary" @click="$router.push('/')">
          去上传
        </el-button>
      </el-empty>

      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="image-grid">
        <el-card
          v-for="image in filteredImages"
          :key="image.id"
          class="image-card fade-in"
          shadow="hover"
        >
          <div class="image-wrapper">
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
            <div class="image-actions">
              <el-button
                type="primary"
                size="small"
                circle
                @click="copyLink(image)"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
              <el-button
                type="danger"
                size="small"
                circle
                @click="confirmDelete(image)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="image-info">
            <p class="image-name" :title="image.name">{{ image.name }}</p>
            <p class="image-meta">
              {{ formatFileSize(image.size) }} · {{ formatDate(image.uploadDate) }}
            </p>
            <el-input
              :model-value="getImageLink(image)"
              readonly
              size="small"
              class="link-input"
              @click.native="$event.stopPropagation()"
            >
              <template #append>
                <el-button @click="copyLink(image)">
                  复制
                </el-button>
              </template>
            </el-input>
          </div>
        </el-card>
      </div>

      <!-- 列表视图 -->
      <div v-else class="image-list">
        <div
          v-for="image in filteredImages"
          :key="image.id"
          class="list-item fade-in"
        >
          <el-image
            :src="image.url"
            fit="cover"
            class="list-thumb"
            @click="previewImage(image.url)"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>

          <div class="list-info">
            <p class="list-name">{{ image.name }}</p>
            <p class="list-meta">
              {{ formatFileSize(image.size) }} · {{ formatDate(image.uploadDate) }}
            </p>
          </div>

          <el-input
            :model-value="getImageLink(image)"
            readonly
            size="small"
            class="list-link"
          >
            <template #append>
              <el-button @click="copyLink(image)">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </template>
          </el-input>

          <div class="list-actions">
            <el-button type="danger" text @click="confirmDelete(image)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="80%">
      <img :src="previewUrl" class="preview-image" alt="预览图片" />
    </el-dialog>

    <!-- 删除确认 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
    >
      <p>确定要删除图片 "<strong>{{ deletingImage?.name }}</strong>" 吗？</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteImage">
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSettingsStore, useImageStore, type ImageItem } from '@/stores'
import { generateLink, deleteFromGitHub } from '@/utils/api'
import { Search, Grid, List, CopyDocument, Delete, Picture } from '@element-plus/icons-vue'

const settingsStore = useSettingsStore()
const imageStore = useImageStore()

// 状态
const searchKeyword = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const linkFormat = ref('markdown')
const previewVisible = ref(false)
const previewUrl = ref('')
const deleteDialogVisible = ref(false)
const deletingImage = ref<ImageItem | null>(null)

// 过滤后的图片
const filteredImages = computed(() => {
  if (!searchKeyword.value) return imageStore.images
  const keyword = searchKeyword.value.toLowerCase()
  return imageStore.images.filter(img =>
    img.name.toLowerCase().includes(keyword)
  )
})

// 生成链接
function getImageLink(image: ImageItem): string {
  return generateLink(image, linkFormat.value)
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

// 预览图片
function previewImage(url: string) {
  previewUrl.value = url
  previewVisible.value = true
}

// 确认删除
function confirmDelete(image: ImageItem) {
  deletingImage.value = image
  deleteDialogVisible.value = true
}

// 执行删除
async function deleteImage() {
  if (!deletingImage.value) return

  const config = settingsStore.config
  if (!config.token || !config.owner || !config.repo) {
    ElMessage.warning('请先在设置中配置 GitHub 信息')
    return
  }

  try {
    const filePath = `${config.uploadPath}/${deletingImage.value.name}`
    await deleteFromGitHub(config, filePath)
    imageStore.removeImage(deletingImage.value.id)
    imageStore.saveImages()
    ElMessage.success('删除成功')
  } catch (error: any) {
    console.error('Delete failed:', error)
    ElMessage.error(error.response?.data?.message || '删除失败')
  }

  deleteDialogVisible.value = false
  deletingImage.value = null
}

// 搜索处理
function handleSearch() {
  // 过滤已在 computed 中处理
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
    day: '2-digit'
  })
}

onMounted(() => {
  imageStore.loadImages()
})
</script>

<style lang="less" scoped>
.album {
  padding: @spacing-lg;
  max-width: 1400px;
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

.album-card {
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: @spacing-md;
    margin-bottom: @spacing-lg;

    .search-input {
      flex: 1;
      min-width: 200px;
    }

    .format-group {
      :deep(.el-radio-button) {
        .el-radio-button__inner {
          padding: 8px 12px;
        }
      }
    }
  }
}

/* 网格视图 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: @spacing-lg;
}

.image-card {
  .image-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: @border-radius-sm;

    .image-preview {
      width: 100%;
      height: 200px;
      cursor: pointer;
      transition: transform @transition-normal;

      &:hover {
        transform: scale(1.05);
      }
    }

    .image-actions {
      position: absolute;
      top: @spacing-sm;
      right: @spacing-sm;
      display: flex;
      gap: @spacing-xs;
      opacity: 0;
      transition: opacity @transition-normal;

      .image-card:hover & {
        opacity: 1;
      }
    }
  }

  .image-info {
    padding: @spacing-md 0;

    .image-name {
      font-size: @font-size-sm;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: @spacing-xs;
    }

    .image-meta {
      font-size: @font-size-xs;
      color: @text-light;
      margin-bottom: @spacing-sm;
    }
  }
}

/* 列表视图 */
.image-list {
  .list-item {
    display: flex;
    align-items: center;
    gap: @spacing-md;
    padding: @spacing-md;
    background: @bg-secondary;
    border-radius: @border-radius;
    margin-bottom: @spacing-sm;

    .list-thumb {
      width: 60px;
      height: 60px;
      border-radius: @border-radius-sm;
      cursor: pointer;
    }

    .list-info {
      flex: 1;
      min-width: 0;

      .list-name {
        font-size: @font-size-md;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .list-meta {
        font-size: @font-size-sm;
        color: @text-secondary;
      }
    }

    .list-link {
      width: 300px;
      min-width: 200px;
    }
  }
}

.preview-image {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

@media (max-width: 768px) {
  .album {
    padding: @spacing-md;
  }

  .toolbar {
    flex-direction: column;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: @spacing-md;

    .image-card {
      .image-preview {
        height: 140px;
      }
    }
  }

  .image-list {
    .list-item {
      flex-wrap: wrap;

      .list-link {
        width: 100%;
      }
    }
  }
}
</style>
