/**
 * 统一错误处理中间件
 */

// 自定义错误类
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误
export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

// 未找到错误
export class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(`${resource}不存在`, 404);
  }
}

// 数据库错误
export class DatabaseError extends AppError {
  constructor(message = '数据库操作失败') {
    super(message, 500);
  }
}

// 错误处理中间件
export function errorHandler(err, req, res, next) {
  // 默认错误
  let error = {
    success: false,
    message: err.message || '服务器内部错误',
    statusCode: err.statusCode || 500,
    timestamp: err.timestamp || new Date().toISOString()
  };

  // 开发环境下返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.details = err;
  }

  // 记录错误日志
  console.error(`[${error.timestamp}] Error:`, {
    message: err.message,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  // SQLite 特定错误处理
  if (err.code === 'SQLITE_CONSTRAINT') {
    error.message = '数据已存在或违反约束条件';
    error.statusCode = 409;
  }

  res.status(error.statusCode).json(error);
}

// 404错误处理
export function notFoundHandler(req, res, next) {
  const error = new NotFoundError('请求的路径');
  next(error);
}

// 异步错误包装器
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
