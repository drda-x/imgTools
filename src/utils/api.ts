import axios from 'axios'
import type { GitHubConfig, ImageItem } from '@/stores'

const api = axios.create({
  baseURL: 'https://api.github.com',
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
  const fileName = `${Date.now()}-${file.name}`
  const path = `${config.uploadPath}/${fileName}`
  const encodedPath = encodeURIComponent(path)

  const base64 = await fileToBase64(file)

  const response = await api.put(
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
}

/**
 * 获取仓库中的图片列表（简化版，从 localStorage 获取）
 */
export async function getImagesFromRepo(config: GitHubConfig): Promise<ImageItem[]> {
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
  const encodedPath = encodeURIComponent(filePath)

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

/**
 * 生成不同格式的链接
 */
export function generateLink(image: ImageItem, format: string, customPattern?: string): string {
  const url = image.url
  switch (format) {
    case 'markdown':
      return `![${image.name}](${url})`
    case 'html':
      return `<img src="${url}" alt="${image.name}" />`
    case 'url':
      return url
    case 'ubb':
      return `[img]${url}[/img]`
    case 'custom':
      return customPattern?.replace('{url}', url).replace('{name}', image.name) || url
    default:
      return `![${image.name}](${url})`
  }
}

export default api
