const { Router } = require('express')
const multer = require('multer')
const path = require('path')
const { saveWithThumbnail } = require('../config/cdn')
const { authMiddleware } = require('../middleware/auth')

const router = Router()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter(req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}，仅支持 JPG/PNG/WebP/GIF/AVIF`))
    }
  },
})

// 上传图片（需要登录）
router.post('/image', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '未上传图片' })
  }

  try {
    const ext = path.extname(req.file.originalname) || '.jpg'
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
    const result = await saveWithThumbnail(req.file.buffer, filename)

    res.json({
      originalUrl: result.originalUrl,
      thumbnailUrl: result.thumbnailUrl,
      filename: result.key,
      size: req.file.size,
      mimeType: req.file.mimetype,
    })
  } catch (err) {
    console.error('[upload] 图片保存失败:', err.message)
    res.status(500).json({ message: `图片保存失败: ${err.message}` })
  }
})

module.exports = router
