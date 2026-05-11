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
    CREATE TABLE IF NOT EXISTS conversations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      title           TEXT    DEFAULT 'New Chat',
      model           TEXT    DEFAULT 'claude-opus-4-7-max[1m]',
      agent_id        INTEGER REFERENCES agents(id) ON DELETE SET NULL,
      share_token     TEXT    UNIQUE,
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
      provider        TEXT    NOT NULL DEFAULT 'v3cm'
                              CHECK(provider IN ('v3cm','deepseek','anthropic','openai','custom')),
      custom_base_url TEXT    DEFAULT '',
      custom_model    TEXT    DEFAULT '',
      created_by      INTEGER REFERENCES users(id),
      created_at      TEXT    DEFAULT (datetime('now','localtime')),
      updated_at      TEXT    DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
  `)
}

module.exports = { initDB, getDB, saveDB }
