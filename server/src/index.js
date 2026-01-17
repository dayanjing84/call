import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { initDatabase } from './models/database.js';
import attendanceRoutes from './routes/attendance.js';
import employeeRoutes from './routes/employee.js';
import examRoutes from './routes/exam.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { startScheduledBackup } from './utils/backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// CORS配置
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件
const uploadsPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// 初始化数据库
console.log('正在初始化数据库...');
initDatabase();

// 启动自动备份
startScheduledBackup();

// 健康检查（放在路由之前）
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CMCC考勤系统运行正常',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 重定向到前端签到页面
app.get('/sign-in/:id', (req, res) => {
  const { id } = req.params;
  // 动态获取服务器IP
  const interfaces = os.networkInterfaces();
  let serverIP = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        serverIP = iface.address;
        break;
      }
    }
    if (serverIP !== 'localhost') break;
  }
  // 重定向到前端签到页面
  const frontendUrl = `http://${serverIP}:5173/sign-in/${id}`;
  res.redirect(frontendUrl);
});

// API路由
app.use('/api/attendance', attendanceRoutes);
app.use('/api/employees', employeeRoutes);  // 改名：students -> employees
app.use('/api/exams', examRoutes);

// 404处理
app.use(notFoundHandler);

// 统一错误处理（必须放在最后）
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  CMCC考勤系统');
  console.log('========================================');
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`服务器地址: http://localhost:${PORT}`);
  console.log(`前端地址: ${FRONTEND_URL}`);
  console.log(`数据库: ${process.env.DB_PATH || './data/attendance.db'}`);
  console.log('========================================');
  console.log('系统已就绪，等待连接...\n');
});
