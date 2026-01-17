/**
 * 数据库自动备份工具
 */

import schedule from 'node-schedule';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/attendance.db');
const BACKUP_PATH = process.env.BACKUP_PATH || path.join(__dirname, '../../backups');
const MAX_BACKUPS = 30; // 保留最近30天的备份

/**
 * 执行数据库备份
 */
export async function backupDatabase() {
    try {
        // 创建备份目录
        await fs.mkdir(BACKUP_PATH, { recursive: true });

        // 生成备份文件名
        const timestamp = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        const backupFile = path.join(BACKUP_PATH, `attendance_${timestamp}_${timeStr}.db`);

        // 复制数据库文件
        await fs.copyFile(DB_PATH, backupFile);

        console.log(`[备份] 数据库已备份: ${backupFile}`);

        // 清理旧备份
        await cleanOldBackups();

        return backupFile;
    } catch (error) {
        console.error('[备份] 备份失败:', error.message);
        throw error;
    }
}

/**
 * 清理旧备份文件
 */
async function cleanOldBackups() {
    try {
        const files = await fs.readdir(BACKUP_PATH);
        const backupFiles = files
            .filter(f => f.startsWith('attendance_') && f.endsWith('.db'))
            .map(f => ({
                name: f,
                path: path.join(BACKUP_PATH, f),
                time: fs.stat(path.join(BACKUP_PATH, f)).then(s => s.mtime)
            }));

        // 获取所有文件的修改时间
        const filesWithTime = await Promise.all(
            backupFiles.map(async (f) => ({
                ...f,
                time: await f.time
            }))
        );

        // 按时间排序
        filesWithTime.sort((a, b) => b.time - a.time);

        // 删除超过MAX_BACKUPS的旧文件
        if (filesWithTime.length > MAX_BACKUPS) {
            const toDelete = filesWithTime.slice(MAX_BACKUPS);
            for (const file of toDelete) {
                await fs.unlink(file.path);
                console.log(`[备份] 删除旧备份: ${file.name}`);
            }
        }
    } catch (error) {
        console.error('[备份] 清理旧备份失败:', error.message);
    }
}

/**
 * 启动定时备份
 */
export function startScheduledBackup() {
    if (process.env.BACKUP_ENABLED !== 'true') {
        console.log('[备份] 自动备份未启用');
        return;
    }

    const scheduleTime = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // 默认每天凌晨2点

    schedule.scheduleJob(scheduleTime, async () => {
        console.log('[备份] 开始定时备份...');
        try {
            await backupDatabase();
            console.log('[备份] 定时备份完成');
        } catch (error) {
            console.error('[备份] 定时备份失败:', error.message);
        }
    });

    console.log(`[备份] 自动备份已启动，计划: ${scheduleTime}`);
}

/**
 * 手动备份（用于脚本调用）
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    backupDatabase()
        .then(() => {
            console.log('备份完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('备份失败:', error);
            process.exit(1);
        });
}
