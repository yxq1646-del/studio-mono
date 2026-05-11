/**
 * CDN 配置模块
 * 支持腾讯云 COS、七牛云，以及本地存储回退
 *
 * 环境变量配置示例 (.env)：
 *   CDN_PROVIDER=cos          # cos | qiniu | local
 *   CDN_BASE_URL=https://cdn.example.com
 *
 *   腾讯云 COS:
 *   COS_SECRET_ID=xxx
 *   COS_SECRET_KEY=xxx
 *   COS_BUCKET=mybucket-1250000000
 *   COS_REGION=ap-guangzhou
 *
 *   七牛云:
 *   QINIU_ACCESS_KEY=xxx
 *   QINIU_SECRET_KEY=xxx
 *   QINIU_BUCKET=mybucket
 *   QINIU_DOMAIN=https://cdn.example.com
 */

const path = require('path')
const fs = require('fs')

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

function getCDNConfig() {
  const provider = process.env.CDN_PROVIDER || 'local'

  const config = {
    provider,
    baseUrl: process.env.CDN_BASE_URL || '/uploads',

    cos: {
      secretId: process.env.COS_SECRET_ID || '',
      secretKey: process.env.COS_SECRET_KEY || '',
      bucket: process.env.COS_BUCKET || '',
      region: process.env.COS_REGION || 'ap-guangzhou',
    },

    qiniu: {
      accessKey: process.env.QINIU_ACCESS_KEY || '',
      secretKey: process.env.QINIU_SECRET_KEY || '',
      bucket: process.env.QINIU_BUCKET || '',
      domain: process.env.QINIU_DOMAIN || '',
    },
  }

  return config
}

/**
 * 获取完整的图片 URL
 * @param {string} key - 存储键名
 * @param {'original'|'thumbnail'} variant - 图片变体
 * @returns {string}
 */
function getImageUrl(key, variant = 'original') {
  const config = getCDNConfig()

  if (config.provider === 'local') {
    const suffix = variant === 'thumbnail' ? '_thumb' : ''
    const ext = path.extname(key)
    const base = path.basename(key, ext)
    return `/uploads/${base}${suffix}${ext}`
  }

  // CDN 模式下，通过变体后缀区分
  const suffix = variant === 'thumbnail' ? '_thumb' : ''
  const ext = path.extname(key)
  const base = path.basename(key, ext)
  return `${config.baseUrl}/${base}${suffix}${ext}`
}

/**
 * 将文件保存到本地存储
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns {{ originalUrl: string, thumbnailUrl: string }}
 */
function saveToLocal(buffer, filename) {
  ensureUploadsDir()

  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  const destPath = path.join(UPLOADS_DIR, filename)
  fs.writeFileSync(destPath, buffer)

  return {
    key: filename,
    originalUrl: `/uploads/${filename}`,
    thumbnailUrl: `/uploads/${filename}`, // 未生成缩略图时返回原图
  }
}

/**
 * 生成缩略图并保存（简易版，不依赖 sharp）
 * 生产环境建议使用 sharp 库进行高质量压缩
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns {{ originalUrl: string, thumbnailUrl: string }}
 */
async function saveWithThumbnail(buffer, filename) {
  ensureUploadsDir()

  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  const originalName = `${base}${ext}`
  const thumbName = `${base}_thumb${ext}`

  // 保存原图
  fs.writeFileSync(path.join(UPLOADS_DIR, originalName), buffer)

  // 尝试生成缩略图（需要安装 sharp）
  let thumbnailGenerated = false
  try {
    const sharp = require('sharp')
    await sharp(buffer)
      .resize(400, 400, { fit: 'cover', withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toFile(path.join(UPLOADS_DIR, thumbName))
    thumbnailGenerated = true
  } catch {
    // sharp 未安装，缩略图使用一个简单标记
    // 前端可通过 URL 参数或查询判断
  }

  return {
    key: originalName,
    originalUrl: `/uploads/${originalName}`,
    thumbnailUrl: thumbnailGenerated ? `/uploads/${thumbName}` : `/uploads/${originalName}`,
  }
}

module.exports = { getCDNConfig, getImageUrl, saveToLocal, saveWithThumbnail }
