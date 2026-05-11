const { Router } = require('express')
const multer = require('multer')
const mammoth = require('mammoth')
const AdmZip = require('adm-zip')

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.post('/extract', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '未上传文件' })
  }

  const { originalname, mimetype, buffer } = req.file
  const ext = originalname.split('.').pop().toLowerCase()

  try {
    // 图片：返回 base64
    if (mimetype.startsWith('image/')) {
      const base64 = buffer.toString('base64')
      return res.json({
        type: 'image',
        filename: originalname,
        mimeType: mimetype,
        base64: `data:${mimetype};base64,${base64}`,
        text: `[图片: ${originalname}]`,
      })
    }

    // Word (.docx)
    if (ext === 'docx' || mimetype.includes('wordprocessingml') || mimetype.includes('officedocument')) {
      const result = await mammoth.extractRawText({ buffer })
      return res.json({
        type: 'document',
        filename: originalname,
        text: `[文件: ${originalname}]\n\n${result.value}`,
      })
    }

    // PPT (.pptx)
    if (ext === 'pptx' || mimetype.includes('presentationml')) {
      const zip = new AdmZip(buffer)
      const slideEntries = zip.getEntries().filter(e =>
        e.entryName.startsWith('ppt/slides/slide') && e.entryName.endsWith('.xml')
      )
      slideEntries.sort((a, b) => {
        const na = parseInt(a.entryName.match(/slide(\d+)/)?.[1] || '0')
        const nb = parseInt(b.entryName.match(/slide(\d+)/)?.[1] || '0')
        return na - nb
      })

      let text = `[文件: ${originalname}]\n\n`
      slideEntries.forEach((entry, i) => {
        const xml = entry.getData().toString('utf8')
        // 提取 <a:t> 标签内的文字
        const texts = []
        const regex = /<a:t[^>]*>([^<]*)<\/a:t>/g
        let match
        while ((match = regex.exec(xml)) !== null) {
          if (match[1].trim()) texts.push(match[1].trim())
        }
        if (texts.length > 0) {
          text += `--- Slide ${i + 1} ---\n${texts.join('\n')}\n\n`
        }
      })

      return res.json({ type: 'document', filename: originalname, text })
    }

    // 纯文本文件
    if (mimetype.startsWith('text/') || ['txt', 'md', 'json', 'csv', 'xml', 'yaml', 'yml'].includes(ext)) {
      const text = buffer.toString('utf8')
      return res.json({
        type: 'document',
        filename: originalname,
        text: `[文件: ${originalname}]\n\n${text}`,
      })
    }

    return res.status(400).json({ message: `不支持的文件类型: ${ext || mimetype}` })
  } catch (err) {
    console.error('[files] 提取失败:', err.message)
    return res.status(500).json({ message: `文件解析失败: ${err.message}` })
  }
})

module.exports = router
