const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'db.sqlite')

let db = null

function wrapDB(sqlDB) {
  return {
    _raw: sqlDB,
    prepare(sql) {
      const stmt = sqlDB.prepare(sql)
      return {
        get(...params) {
          try {
            stmt.bind(params)
            if (stmt.step()) return stmt.getAsObject()
            return undefined
          } finally {
            stmt.reset()
          }
        },
        all(...params) {
          const rows = []
          try {
            stmt.bind(params)
            while (stmt.step()) rows.push(stmt.getAsObject())
            return rows
          } finally {
            stmt.reset()
          }
        },
        run(...params) {
          try {
            stmt.bind(params)
            stmt.step()
            const rowsModified = sqlDB.getRowsModified()
            let lastInsertRowid = 0
            if (rowsModified > 0) {
              const r = sqlDB.exec('SELECT last_insert_rowid() as id')
              if (r.length && r[0].values.length) {
                lastInsertRowid = r[0].values[0][0]
              }
            }
            return { changes: rowsModified, lastInsertRowid }
          } finally {
            stmt.reset()
          }
        },
        finalize() { stmt.free() }
      }
    },
    exec(sql) {
      return sqlDB.exec(sql)
    },
    pragma(val) {
      sqlDB.run(`PRAGMA ${val}`)
    },
    close() {
      sqlDB.close()
    }
  }
}

async function initDB() {
  const SQL = await initSqlJs()
  if (fs.existsSync(DB_PATH)) {
    db = wrapDB(new SQL.Database(fs.readFileSync(DB_PATH)))
  } else {
    db = wrapDB(new SQL.Database())
  }
  initSchema()
  saveDB()
  return db
}

function getDB() {
  if (!db) throw new Error('数据库未初始化，请先调用 initDB()')
  return db
}

function saveDB() {
  if (!db || !db._raw) return
  fs.writeFileSync(DB_PATH, Buffer.from(db._raw.export()))
}

function initSchema() {
  getDB().exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      username        TEXT    UNIQUE NOT NULL,
      password_hash   TEXT    NOT NULL,
      display_name    TEXT    NOT NULL,
      email           TEXT,
      avatar_url      TEXT,
      role            TEXT    NOT NULL DEFAULT 'viewer'
                              CHECK(role IN ('admin','editor','viewer')),
      status          TEXT    NOT NULL DEFAULT 'active'
                              CHECK(status IN ('active','disabled')),
      last_login_at   TEXT,
      created_at      TEXT    DEFAULT (datetime('now','localtime')),
      updated_at      TEXT    DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS pets (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      species         TEXT    NOT NULL,
      breed           TEXT,
      age_group       TEXT,
      gender          TEXT    CHECK(gender IN ('male','female','unknown')),
      size_group      TEXT    CHECK(size_group IN ('small','medium','large')),
      description     TEXT,
      image_url       TEXT,
      location_city   TEXT,
      status          TEXT    NOT NULL DEFAULT 'available'
                              CHECK(status IN ('available','pending','adopted')),
      created_at      TEXT    DEFAULT (datetime('now','localtime')),
      updated_at      TEXT    DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS adoptions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id          INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      applicant_name  TEXT    NOT NULL,
      applicant_phone TEXT    NOT NULL,
      applicant_email TEXT,
      reason          TEXT,
      housing_type    TEXT,
      has_experience  INTEGER DEFAULT 0,
      status          TEXT    NOT NULL DEFAULT 'pending'
                              CHECK(status IN ('pending','approved','rejected','cancelled')),
      reviewer_notes  TEXT,
      created_at      TEXT    DEFAULT (datetime('now','localtime')),
      updated_at      TEXT    DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      title           TEXT    DEFAULT 'New Chat',
      model           TEXT    DEFAULT 'claude-sonnet-4-20250514',
      created_at      TEXT    DEFAULT (datetime('now','localtime')),
      updated_at      TEXT    DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS messages (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id   INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role              TEXT    NOT NULL CHECK(role IN ('user','assistant','system')),
      content           TEXT    NOT NULL,
      created_at        TEXT    DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS agents (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      description     TEXT    DEFAULT '',
      avatar_url      TEXT    DEFAULT '',
      system_prompt   TEXT    NOT NULL DEFAULT '',
      provider        TEXT    NOT NULL DEFAULT 'deepseek'
                              CHECK(provider IN ('deepseek','anthropic','openai','custom')),
      custom_base_url TEXT    DEFAULT '',
      custom_model    TEXT    DEFAULT '',
      created_by      INTEGER REFERENCES users(id),
      created_at      TEXT    DEFAULT (datetime('now','localtime')),
      updated_at      TEXT    DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS favorites (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pet_id      INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      created_at  TEXT    DEFAULT (datetime('now','localtime')),
      UNIQUE(user_id, pet_id)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_pets_status   ON pets(status);
    CREATE INDEX IF NOT EXISTS idx_adoptions_pet ON adoptions(pet_id);
    CREATE TABLE IF NOT EXISTS pet_status_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id      INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status   TEXT    NOT NULL,
      remark      TEXT    DEFAULT '',
      created_at  TEXT    DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE TABLE IF NOT EXISTS operation_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER REFERENCES users(id),
      username    TEXT,
      action      TEXT    NOT NULL,
      target_type TEXT,
      target_id   INTEGER,
      detail       TEXT    DEFAULT '',
      ip          TEXT,
      created_at  TEXT    DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_status_logs_pet ON pet_status_logs(pet_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_op_logs_action ON operation_logs(action, created_at);
    CREATE INDEX IF NOT EXISTS idx_op_logs_user ON operation_logs(user_id);
  `)

  // 迁移：为 conversations 添加 agent_id 列
  try {
    getDB().exec('ALTER TABLE conversations ADD COLUMN agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL')
  } catch (_) { /* 列已存在，忽略 */ }

  // 迁移：为 pets 添加经纬度列
  try {
    getDB().exec('ALTER TABLE pets ADD COLUMN latitude REAL')
  } catch (_) { /* 列已存在 */ }
  try {
    getDB().exec('ALTER TABLE pets ADD COLUMN longitude REAL')
  } catch (_) { /* 列已存在 */ }

  // 迁移：为 conversations 添加 share_token 列
  try {
    getDB().exec('ALTER TABLE conversations ADD COLUMN share_token TEXT UNIQUE')
  } catch (_) { /* 列已存在 */ }
}

module.exports = { initDB, getDB, saveDB }
