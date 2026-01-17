import express from 'express';
import { dbRun, dbGet, dbAll } from '../models/database.js';

const router = express.Router();

// 获取所有学生
router.get('/', async (req, res) => {
  try {
    const students = await dbAll('SELECT * FROM students ORDER BY name');
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 添加学生
router.post('/', async (req, res) => {
  try {
    const { name, student_id, class: className, phone, email, tags } = req.body;
    const result = await dbRun(
      'INSERT INTO students (name, student_id, class, phone, email, tags) VALUES (?, ?, ?, ?, ?, ?)',
      [name, student_id, className, phone, email, tags || '']
    );
    res.json({ success: true, data: { id: result.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 批量导入学生
router.post('/import', async (req, res) => {
  try {
    const { students } = req.body;
    const results = [];

    for (const student of students) {
      try {
        const result = await dbRun(
          'INSERT INTO students (name, student_id, class, phone, email, tags) VALUES (?, ?, ?, ?, ?, ?)',
          [student.name, student.student_id, student.class, student.phone, student.email, student.tags || '']
        );
        results.push({ success: true, id: result.id, name: student.name });
      } catch (err) {
        results.push({ success: false, name: student.name, error: err.message });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新学生信息
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, student_id, class: className, phone, email, tags } = req.body;
    await dbRun(
      'UPDATE students SET name=?, student_id=?, class=?, phone=?, email=?, tags=? WHERE id=?',
      [name, student_id, className, phone, email, tags || '', id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除学生
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM students WHERE id=?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
