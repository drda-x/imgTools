/**
 * PicGo 工具封装（TypeScript）
 * 依赖：picgo (v1.5.0+)
 * 用法示例：
 *   import { upload } from '@/utils/picgo'
 *   await upload(['/path/to/img.jpg']) // 上传指定文件
 *   await upload() // 上传剪贴板第一张图片
 */

// 使用 require 以兼容 picgo 的 CommonJS 导出
// @ts-ignore
const { PicGo } = require('picgo')

type UploadResult = any

/**
 * 上传图片（支持传入文件路径数组，或不传则上传剪贴板第一张图片）
 * @param paths 可选的本地文件路径数组
 */
export async function upload(paths?: string[]): Promise<UploadResult> {
  const picgo = new PicGo()

  return new Promise((resolve, reject) => {
    const onUpload = (ctx: any) => {
      // PicGo 在上传完成会触发 'upload' 事件，回调中包含 ctx
      cleanup()
      resolve(ctx)
    }

    const onFailed = (ctx: any) => {
      cleanup()
      reject(ctx)
    }

    const onError = (err: any) => {
      cleanup()
      reject(err)
    }

    function cleanup() {
      try {
        picgo.removeListener && picgo.removeListener('upload', onUpload)
        picgo.removeListener && picgo.removeListener('failed', onFailed)
        picgo.removeListener && picgo.removeListener('error', onError)
      } catch (e) {
        // ignore
      }
    }

    // 绑定事件
    try {
      picgo.on && picgo.on('upload', onUpload)
      picgo.on && picgo.on('failed', onFailed)
      picgo.on && picgo.on('error', onError)

      // 触发上传：传入数组则按路径上传；不传则尝试上传剪贴板里的第一张图片
      if (Array.isArray(paths) && paths.length > 0) {
        picgo.upload(paths)
      } else {
        picgo.upload()
      }
    } catch (err) {
      cleanup()
      reject(err)
    }
  })
}

export default { upload }
