import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/attendance.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
  } else {
    console.log('数据库连接成功');
  }
});

// 初始化数据库表
export function initDatabase() {
  // 员工表
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_id TEXT UNIQUE, -- 工号，用于签到
      employee_code TEXT, -- 员工编号
      department TEXT,
      phone TEXT,
      email TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 兼容旧表名，重命名students为employees
  db.run(`
    ALTER TABLE students RENAME TO employees
  `, (err) => {
    if (err && !err.message.includes('no such table')) {
      console.error('重命名表失败:', err.message);
    }
  });

  // 检查并添加tags列（兼容已有数据库）
  db.run(`
    ALTER TABLE employees ADD COLUMN tags TEXT
  `, (err) => {
    // 忽略列已存在的错误
    if (err && !err.message.includes('duplicate column')) {
      console.error('添加tags列失败:', err.message);
    }
  });

  // 添加employee_code列
  db.run(`
    ALTER TABLE employees ADD COLUMN employee_code TEXT
  `, (err) => {
    // 忽略列已存在的错误
    if (err && !err.message.includes('duplicate column')) {
      console.error('添加employee_code列失败:', err.message);
    }
  });

  // 会议表
  db.run(`
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      location TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 签到记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER,
      student_id INTEGER,
      status TEXT CHECK(status IN ('present', 'absent', 'late')),
      sign_time DATETIME,
      notes TEXT,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  // 考试表
  db.run(`
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER,
      title TEXT NOT NULL,
      exam_date DATE NOT NULL,
      total_score REAL DEFAULT 100,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id)
    )
  `);

  // 考试成绩表
  db.run(`
    CREATE TABLE IF NOT EXISTS exam_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      score REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      UNIQUE(exam_id, student_id)
    )
  `);

  // 随机点名记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS random_call_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER,
      student_id INTEGER,
      call_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  // 答题记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS question_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER,
      student_id INTEGER,
      question_text TEXT,
      result TEXT CHECK(result IN ('correct', 'partial', 'wrong')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  // 会议二维码表
  db.run(`
    CREATE TABLE IF NOT EXISTS meeting_qrcodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER UNIQUE,
      qrcode_data TEXT NOT NULL,
      qrcode_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id)
    )
  `);

  console.log('数据库表初始化完成');
}

// 数据库操作的Promise包装函数
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export default db;
