import express from 'express';
import { dbRun, dbGet, dbAll } from '../models/database.js';

const router = express.Router();

// 创建考试
router.post('/', async (req, res) => {
  try {
    const { meeting_id, title, exam_date, total_score, description } = req.body;
    const result = await dbRun(
      'INSERT INTO exams (meeting_id, title, exam_date, total_score, description) VALUES (?, ?, ?, ?, ?)',
      [meeting_id, title, exam_date, total_score || 100, description]
    );
    res.json({ success: true, data: { id: result.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取所有考试
router.get('/', async (req, res) => {
  try {
    const exams = await dbAll(`
      SELECT e.*, m.title as meeting_title
      FROM exams e
      LEFT JOIN meetings m ON e.meeting_id = m.id
      ORDER BY e.exam_date DESC
    `);
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取考试详情（包括成绩）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await dbGet('SELECT * FROM exams WHERE id=?', [id]);

    const scores = await dbAll(`
      SELECT es.*, e.name, e.employee_id, e.department
      FROM exam_scores es
      JOIN employees e ON es.student_id = e.id
      WHERE es.exam_id = ?
      ORDER BY es.score DESC
    `, [id]);

    // 统计信息
    const stats = await dbGet(`
      SELECT
        COUNT(*) as total_students,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        MIN(score) as min_score
      FROM exam_scores
      WHERE exam_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        exam,
        scores,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 录入单个员工成绩
router.post('/:id/scores', async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, score, notes } = req.body;

    // 根据工号查找员工ID
    const employee = await dbGet('SELECT id FROM employees WHERE employee_id=?', [employee_id]);
    if (!employee) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }

    // 检查成绩是否已存在
    const existing = await dbGet(
      'SELECT * FROM exam_scores WHERE exam_id=? AND student_id=?',
      [id, employee.id]
    );

    if (existing) {
      // 更新成绩
      await dbRun(
        'UPDATE exam_scores SET score=?, notes=? WHERE exam_id=? AND student_id=?',
        [score, notes, id, employee.id]
      );
    } else {
      // 插入新成绩
      await dbRun(
        'INSERT INTO exam_scores (exam_id, student_id, score, notes) VALUES (?, ?, ?, ?)',
        [id, employee.id, score, notes]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 批量导入成绩
router.post('/:id/scores/import', async (req, res) => {
  try {
    const { id } = req.params;
    const { scores } = req.body;
    const results = [];

    for (const item of scores) {
      try {
        // 根据工号查找员工
        const employee = await dbGet('SELECT id FROM employees WHERE employee_id=?', [item.employee_id]);

        if (!employee) {
          results.push({
            success: false,
            employee_id: item.employee_id,
            error: '员工不存在'
          });
          continue;
        }

        // 检查成绩是否已存在
        const existing = await dbGet(
          'SELECT * FROM exam_scores WHERE exam_id=? AND student_id=?',
          [id, employee.id]
        );

        if (existing) {
          await dbRun(
            'UPDATE exam_scores SET score=?, notes=? WHERE exam_id=? AND student_id=?',
            [item.score, item.notes || '', id, employee.id]
          );
        } else {
          await dbRun(
            'INSERT INTO exam_scores (exam_id, student_id, score, notes) VALUES (?, ?, ?, ?)',
            [id, employee.id, item.score, item.notes || '']
          );
        }

        results.push({
          success: true,
          employee_id: item.employee_id
        });
      } catch (err) {
        results.push({
          success: false,
          employee_id: item.employee_id,
          error: err.message
        });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 导出考试成绩
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    const exam = await dbGet('SELECT * FROM exams WHERE id=?', [id]);
    const scores = await dbAll(`
      SELECT e.name, e.employee_id, e.department, es.score, es.notes
      FROM exam_scores es
      JOIN employees e ON es.student_id = e.id
      WHERE es.exam_id = ?
      ORDER BY es.score DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        exam,
        scores
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除考试
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 删除相关的成绩记录
    await dbRun('DELETE FROM exam_scores WHERE exam_id = ?', [id]);

    // 删除考试
    await dbRun('DELETE FROM exams WHERE id = ?', [id]);

    res.json({ success: true, message: '考试删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
