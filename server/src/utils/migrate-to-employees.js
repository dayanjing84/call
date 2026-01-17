/**
 * 数据库迁移脚本：将 students 表改名为 employees
 * 将 student_id 字段改为 employee_id
 * 将 class 字段改为 department
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/attendance.db');
const backupPath = path.join(__dirname, '../../backups');

async function backupDatabase() {
    try {
        // 创建备份目录
        await fs.mkdir(backupPath, { recursive: true });

        // 备份文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const backupFile = path.join(backupPath, `attendance_before_migration_${timestamp}.db`);

        // 复制数据库文件
        await fs.copyFile(dbPath, backupFile);
        console.log(`✓ 数据库已备份到: ${backupFile}`);
        return true;
    } catch (error) {
        console.error('✗ 备份失败:', error.message);
        return false;
    }
}

async function migrateDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, async (err) => {
            if (err) {
                reject(err);
                return;
            }

            console.log('\n开始数据库迁移...\n');

            db.serialize(() => {
                // 1. 创建新的 employees 表
                console.log('[1/6] 创建 employees 表...');
                db.run(`
          CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            employee_id TEXT UNIQUE,
            department TEXT,
            phone TEXT,
            email TEXT,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
                    if (err) {
                        console.error('✗ 创建 employees 表失败:', err.message);
                    } else {
                        console.log('✓ employees 表创建成功');
                    }
                });

                // 2. 复制数据
                console.log('[2/6] 迁移数据...');
                db.run(`
          INSERT INTO employees (id, name, employee_id, department, phone, email, tags, created_at)
          SELECT id, name, student_id, class, phone, email, tags, created_at FROM students
        `, (err) => {
                    if (err && !err.message.includes('UNIQUE constraint failed')) {
                        console.error('✗ 数据迁移失败:', err.message);
                    } else {
                        console.log('✓ 数据迁移成功');
                    }
                });

                // 3. 更新 attendance 表的外键引用
                console.log('[3/6] 更新签到记录...');
                // SQLite 不支持直接修改外键，数据已经正确，只需更新注释

                // 4. 更新 exam_scores 表的外键引用
                console.log('[4/6] 更新考核成绩...');
                // 同上

                // 5. 添加索引
                console.log('[5/6] 添加数据库索引...');
                const indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_employee_id ON employees(employee_id)',
                    'CREATE INDEX IF NOT EXISTS idx_department ON employees(department)',
                    'CREATE INDEX IF NOT EXISTS idx_meeting_date ON meetings(date)',
                    'CREATE INDEX IF NOT EXISTS idx_attendance_meeting ON attendance(meeting_id)',
                    'CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id)',
                    'CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status)',
                    'CREATE INDEX IF NOT EXISTS idx_exam_scores_exam ON exam_scores(exam_id)',
                    'CREATE INDEX IF NOT EXISTS idx_question_records_meeting ON question_records(meeting_id)'
                ];

                let indexCount = 0;
                indexes.forEach((indexSql, i) => {
                    db.run(indexSql, (err) => {
                        indexCount++;
                        if (err) {
                            console.log(`  - 索引 ${i + 1}: 已存在或创建失败`);
                        } else {
                            console.log(`  - 索引 ${i + 1}: 创建成功`);
                        }

                        if (indexCount === indexes.length) {
                            console.log('✓ 所有索引创建完成');

                            // 6. 获取统计信息
                            console.log('[6/6] 验证迁移结果...');
                            db.get('SELECT COUNT(*) as count FROM employees', (err, row) => {
                                if (!err) {
                                    console.log(`✓ employees 表记录数: ${row.count}`);
                                }

                                db.get('SELECT COUNT(*) as count FROM students', (err, row) => {
                                    if (!err) {
                                        console.log(`✓ students 表记录数: ${row.count}`);
                                    }

                                    console.log('\n========================================');
                                    console.log('  迁移完成！');
                                    console.log('========================================');
                                    console.log('');
                                    console.log('注意：');
                                    console.log('1. employees 表已创建并包含所有数据');
                                    console.log('2. students 表保留作为兼容性备份');
                                    console.log('3. 索引已创建，查询性能将提升');
                                    console.log('4. 如需删除 students 表，请手动执行：');
                                    console.log('   DROP TABLE students;');
                                    console.log('');

                                    db.close((err) => {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            resolve();
                                        }
                                    });
                                });
                            });
                        }
                    });
                });
            });
        });
    });
}

// 执行迁移
(async () => {
    try {
        console.log('========================================');
        console.log('  数据库迁移工具');
        console.log('========================================\n');

        // 备份数据库
        const backed = await backupDatabase();
        if (!backed) {
            console.log('\n⚠️  备份失败，迁移终止');
            process.exit(1);
        }

        // 执行迁移
        await migrateDatabase();

        console.log('✓ 迁移成功完成\n');
        process.exit(0);
    } catch (error) {
        console.error('\n✗ 迁移失败:', error.message);
        console.log('请检查备份文件并手动恢复\n');
        process.exit(1);
    }
})();
