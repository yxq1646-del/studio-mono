function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未登录' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' })
    }
    next()
  }
}

module.exports = { requireRole }
