import axios from 'axios'
import type { GitHubConfig, ImageItem } from '@/stores'

// 在开发环境中使用 Vite 代理：/github -> https://api.github.com
const baseURL = import.meta.env.DEV ? '/github' : 'https://api.github.com'
const api = axios.create({
  baseURL,
  timeout: 30000
})

/**
 * 上传文件到 GitHub Repository
 */
export async function uploadToGitHub(
  config: GitHubConfig,
  file: File,
  progress?: (percent: number) => void
): Promise<ImageItem> {
  // 生成文件名：年月日时分秒 + 3 位随机数，保留原始扩展名，例如 20250618170533563.png
  const now = new Date()
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0')
  const yyyy = now.getFullYear()
  const MM = pad(now.getMonth() + 1)
  const dd = pad(now.getDate())
  const HH = pad(now.getHours())
  const mm = pad(now.getMinutes())
  const ss = pad(now.getSeconds())
  const rand = Math.floor(Math.random() * 900) + 100 // 100-999

  const origName = file.name || ''
  const dotIndex = origName.lastIndexOf('.')
  const ext = dotIndex >= 0 ? origName.slice(dotIndex) : ''
  const fileName = `${yyyy}${MM}${dd}${HH}${mm}${ss}${rand}${ext}`

  // 规范 uploadPath：去除开头或结尾的斜杠，避免 GitHub 返回 422: path cannot start with a slash
  const normalizedUploadPath = (config.uploadPath || '').replace(/^\/+|\/+$/g, '')
  const path = normalizedUploadPath ? `${normalizedUploadPath}/${fileName}` : fileName
  const encodedPath = encodeURIComponent(path)

  const base64 = await fileToBase64(file)

  try {
    await api.put(
    `/repos/${config.owner}/${config.repo}/contents/${encodedPath}`,
    {
      message: `Upload image: ${file.name}`,
      content: base64,
      branch: config.branch
    },
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      onUploadProgress: (e) => {
        if (progress && e.total) {
          const percent = Math.round((e.loaded * 100) / e.total)
          progress(percent)
        }
      }
    }
    )

    const imageUrl = config.customDomain
      ? `${config.customDomain}/${path}`
      : `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${path}`

    return {
      id: Date.now().toString(),
      url: imageUrl,
      name: file.name,
      size: file.size,
      uploadDate: new Date().toISOString()
    }
  } catch (err: any) {
    // 改善错误信息，便于诊断：区分网络/跨域与 API 错误
    if (err?.message === 'Network Error' || err?.code === 'ERR_NETWORK') {
      throw new Error('Network Error: 无法连接到 GitHub API，可能是网络问题或被浏览器 CORS 阻止。请检查浏览器控制台的网络与 CORS 信息，或者在生产环境使用后端代理。')
    }

    // 若是 axios 响应错误，尝试从 response 中提取更多信息
    if (err?.response) {
      const status = err.response.status
      const msg = err.response.data?.message || err.response.statusText
      throw new Error(`Upload failed: ${status} ${msg}`)
    }

    throw err
  }
}

/**
 * 获取仓库中的图片列表（简化版，从 localStorage 获取）
 */
export async function getImagesFromRepo(_config: GitHubConfig): Promise<ImageItem[]> {
  // 注意：GitHub API 没有直接的目录浏览 API
  // 实际项目中可以使用 Git Tree API 或其他方法
  return []
}

/**
 * 删除仓库中的文件
 */
export async function deleteFromGitHub(
  config: GitHubConfig,
  filePath: string
): Promise<void> {
  // 确保 filePath 不以斜杠开头
  const normalized = filePath.replace(/^\/+/, '')
  const encodedPath = encodeURIComponent(normalized)

  // 首先获取 SHA
  const getResponse = await api.get(
    `/repos/${config.owner}/${config.repo}/contents/${encodedPath}`,
    {
      headers: {
        Authorization: `Bearer ${config.token}`
      }
    }
  )

  await api.delete(
    `/repos/${config.owner}/${config.repo}/contents/${encodedPath}`,
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        message: `Delete image: ${filePath}`,
        sha: getResponse.data.sha,
        branch: config.branch
      }
    }
  )
}

/**
 * 文件转 Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default api
