<template>
  <div class="settings">
    <div class="page-header">
      <h1>设置</h1>
      <p>配置 GitHub 仓库参数以上传图片</p>
    </div>

    <el-card class="settings-card" shadow="hover">
      <el-form
        :model="form"
        :label-width="labelWidth"
        :label-position="labelPosition"
      >
        <el-form-item label="Personal Token">
          <el-input
            v-model="form.token"
            type="password"
            show-password
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            clearable
          />
          <div class="form-tip">
            需要在 GitHub 设置中生成 Personal Access Token，并开启 repo 权限
          </div>
        </el-form-item>

        <el-form-item label="仓库所有者">
          <el-input
            v-model="form.owner"
            placeholder="GitHub 用户名或组织名"
            clearable
          />
        </el-form-item>

        <el-form-item label="仓库名称">
          <el-input
            v-model="form.repo"
            placeholder="图片存储仓库名"
            clearable
          />
        </el-form-item>

        <el-form-item label="分支">
          <el-input
            v-model="form.branch"
            placeholder="默认: main"
            clearable
          />
        </el-form-item>

        <el-form-item label="上传路径">
          <el-input
            v-model="form.uploadPath"
            placeholder="例如: images"
            clearable
          />
          <div class="form-tip">
            图片将上传到此路径，路径不存在时会自动创建
          </div>
        </el-form-item>

        <el-form-item label="自定义域名">
          <el-input
            v-model="form.customDomain"
            placeholder="可选，用于替换 raw.githubusercontent.com"
            clearable
          />
          <div class="form-tip">
            如果配置了 CDN 或自定义域名，请填写此项
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveSettings">
            <el-icon><Check /></el-icon>
            保存设置
          </el-button>
          <el-button @click="resetSettings">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 帮助信息 -->
    <el-card class="help-card" shadow="hover">
      <template #header>
        <span>如何获取 GitHub Token？</span>
      </template>
      <ol class="help-list">
        <li>登录 GitHub，进入 <a href="https://github.com/settings/tokens" target="_blank">Settings → Developer settings → Personal access tokens</a></li>
        <li>点击 "Generate new token (classic)"</li>
        <li>设置过期时间和备注</li>
        <li>勾选 <code>repo</code> 权限</li>
        <li>点击生成并复制 Token</li>
      </ol>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useSettingsStore, type GitHubConfig } from '@/stores'
import { Check, RefreshLeft } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'

const settingsStore = useSettingsStore()
const router = useRouter()
const route = useRoute()

const form = ref<GitHubConfig>({
  token: '',
  owner: '',
  repo: '',
  branch: 'main',
  uploadPath: 'images',
  customDomain: ''
})

const defaultForm = { ...form.value }
const isMobile = ref(false)
const labelPosition = ref<'right' | 'top'>('right')
const labelWidth = ref('140px')

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    labelPosition.value = 'top'
    labelWidth.value = '100%'
  } else {
    labelPosition.value = 'right'
    labelWidth.value = '140px'
  }
}

function saveSettings() {
  if (!form.value.token || !form.value.owner || !form.value.repo) {
    ElMessage.warning('请填写必填项：Token、所有者和仓库名称')
    return
  }

  settingsStore.config = { ...form.value }
  settingsStore.saveSettings()
  ElMessage.success('设置已保存')

  // 如果有 redirect 参数，保存后跳回原来的页面
  const redirect = route.query.redirect as string | undefined
  if (redirect) {
    router.replace(redirect)
  }
}

function resetSettings() {
  form.value = { ...defaultForm }
  ElMessage.info('已重置为默认值')
}

onMounted(() => {
  settingsStore.loadSettings()
  form.value = { ...settingsStore.config }
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="less" scoped>
.settings {
  padding: @spacing-lg;
  max-width: 800px;
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

.settings-card {
  margin-bottom: @spacing-lg;

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: @text-primary;
  }
}

.form-tip {
  font-size: @font-size-xs;
  color: @text-light;
  margin-top: @spacing-xs;
}

.help-card {
  .help-list {
    padding-left: @spacing-lg;
    color: @text-secondary;

    li {
      margin-bottom: @spacing-sm;
      line-height: 1.6;
    }

    code {
      background: @bg-secondary;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Fira Code', monospace;
      font-size: @font-size-sm;
      color: @primary-dark;
    }

    a {
      color: @primary-color;
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@media (max-width: 768px) {
  .settings {
    padding: @spacing-md;
  }

  .settings-card {
    :deep(.el-form-item__label) {
      width: 100% !important;
      text-align: left !important;
    }

    :deep(.el-form-item__content) {
      margin-left: 0 !important;
    }
  }
}
</style>
