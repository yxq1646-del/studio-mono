const { getDB } = require('../db')

function logOperation({ userId, username, action, targetType, targetId, detail, ip }) {
  try {
    getDB().prepare(
      `INSERT INTO operation_logs (user_id, username, action, target_type, target_id, detail, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId ?? null,
      username ?? null,
      action,
      targetType ?? null,
      targetId ?? null,
      detail ?? '',
      ip ?? null
    )
  } catch (err) {
    console.error('[operationLog] 记录失败:', err.message)
  }
}

function logFromReq(req, action, detail) {
  logOperation({
    userId: req.user?.id,
    username: req.user?.username,
    action,
    detail,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
  })
}

module.exports = { logOperation, logFromReq }
