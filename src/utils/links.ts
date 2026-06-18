import type { ImageItem } from '@/stores'

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

export default { generateLink }
