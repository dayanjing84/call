import express from 'express';
import { dbRun, dbGet, dbAll } from '../models/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateEmployee, validateId } from '../middleware/validator.js';

const router = express.Router();

// 获取所有员工
router.get('/', asyncHandler(async (req, res) => {
  const employees = await dbAll('SELECT id, name, employee_id, employee_code, department, phone, email, tags FROM employees ORDER BY name');
  res.json({ success: true, data: employees });
}));

// 添加员工
router.post('/', validateEmployee, asyncHandler(async (req, res) => {
  const { name, employee_id, employee_code, department, phone, email, tags } = req.body;

  const result = await dbRun(
    'INSERT INTO employees (name, employee_id, employee_code, department, phone, email, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, employee_id, employee_code || '', department, phone, email, tags || '']
  );

  res.json({
    success: true,
    message: '员工添加成功',
    data: { id: result.id, employee_id }
  });
}));

// 批量导入员工
router.post('/import', asyncHandler(async (req, res) => {
  const { employees } = req.body;

  if (!Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({
      success: false,
      message: '员工数据格式错误或为空'
    });
  }

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const employee of employees) {
    try {
      const result = await dbRun(
        'INSERT INTO employees (name, employee_id, employee_code, department, phone, email, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          employee.name || employee.姓名,
          employee.employee_id || employee.工号,
          employee.employee_code || employee.员工编号 || '',
          employee.department || employee.所属部门,
          employee.phone || employee.手机,
          employee.email || employee.邮件地址,
          employee.tags || employee.职务 || ''
        ]
      );
      results.push({ success: true, id: result.id, name: employee.name || employee.姓名 });
      successCount++;
    } catch (err) {
      results.push({ success: false, name: employee.name || employee.姓名, error: err.message });
      failCount++;
    }
  }

  res.json({
    success: true,
    message: `导入完成：成功 ${successCount} 条，失败 ${failCount} 条`,
    data: results
  });
}));

// 更新员工信息
router.put('/:id', validateId, validateEmployee, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, employee_id, employee_code, department, phone, email, tags } = req.body;

  await dbRun(
    'UPDATE employees SET name=?, employee_id=?, employee_code=?, department=?, phone=?, email=?, tags=? WHERE id=?',
    [name, employee_id, employee_code || '', department, phone, email, tags || '', id]
  );

  res.json({ success: true, message: '员工信息更新成功' });
}));

// 删除员工
router.delete('/:id', validateId, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await dbRun('DELETE FROM employees WHERE id=?', [id]);
  res.json({ success: true, message: '员工删除成功' });
}));

export default router;
