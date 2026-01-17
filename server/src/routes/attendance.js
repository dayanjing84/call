import express from 'express';
import { dbRun, dbGet, dbAll } from '../models/database.js';
import QRCode from 'qrcode';
import os from 'os';

const router = express.Router();

// 获取服务器IP地址
function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部地址和非IPv4地址
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  // 如果找不到网络IP，返回localhost
  return 'localhost';
}

// ????
router.post('/meetings', async (req, res) => {
  try {
    const { title, date, start_time, end_time, location, description } = req.body;
    const result = await dbRun(
      'INSERT INTO meetings (title, date, start_time, end_time, location, description) VALUES (?, ?, ?, ?, ?, ?)',
      [title, date, start_time, end_time, location, description]
    );

    // ?????
    const meetingId = result.id;
    const serverIP = getServerIP();
    const qrcodeData = `http://${serverIP}:3000/sign-in/${meetingId}`;
    const qrcodeUrl = await QRCode.toDataURL(qrcodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // ???????
    await dbRun(
      'INSERT INTO meeting_qrcodes (meeting_id, qrcode_data, qrcode_url) VALUES (?, ?, ?)',
      [meetingId, qrcodeData, qrcodeUrl]
    );

    res.json({ success: true, data: { id: meetingId, qrcodeUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ??????
router.get('/meetings', async (req, res) => {
  try {
    const meetings = await dbAll('SELECT * FROM meetings ORDER BY date DESC, start_time DESC');
    res.json({ success: true, data: meetings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ??????????????
router.get('/meetings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await dbGet('SELECT * FROM meetings WHERE id=?', [id]);

    const attendance = await dbAll(`
      SELECT a.*, e.name, e.employee_id, e.department
      FROM attendance a
      JOIN employees e ON a.student_id = e.id
      WHERE a.meeting_id = ?
    `, [id]);

    const stats = await dbGet(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent
      FROM attendance
      WHERE meeting_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        meeting,
        attendance,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ????
router.post('/sign-in', async (req, res) => {
  try {
    const { meeting_id, employee_ids, status = 'present' } = req.body;
    const results = [];

    for (const employee_id of employee_ids) {
      try {
        // 根据工号查找员工ID
        const employee = await dbGet('SELECT id FROM employees WHERE employee_id=?', [employee_id]);
        if (!employee) {
          results.push({ employee_id, success: false, error: '员工不存在' });
          continue;
        }

        const employeeId = employee.id;

        // ???????
        const existing = await dbGet(
          'SELECT * FROM attendance WHERE meeting_id=? AND student_id=?',
          [meeting_id, employeeId]
        );

        if (existing) {
          // ??????
          await dbRun(
            'UPDATE attendance SET status=?, sign_time=CURRENT_TIMESTAMP WHERE meeting_id=? AND student_id=?',
            [status, meeting_id, employeeId]
          );
        } else {
          // ??????
          await dbRun(
            'INSERT INTO attendance (meeting_id, student_id, status, sign_time) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
            [meeting_id, employeeId, status]
          );
        }
        results.push({ employee_id, success: true });
      } catch (err) {
        results.push({ employee_id, success: false, error: err.message });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ??????????
router.get('/meetings/:id/unsigned', async (req, res) => {
  try {
    const { id } = req.params;
    const unsigned = await dbAll(`
      SELECT e.*
      FROM employees e
      WHERE e.id NOT IN (
        SELECT student_id FROM attendance WHERE meeting_id = ?
      )
      ORDER BY e.name
    `, [id]);

    res.json({ success: true, data: unsigned });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ??????
router.post('/random-call', async (req, res) => {
  try {
    const { meeting_id, employee_id } = req.body;
    // 根据工号查找员工ID
    const employee = await dbGet('SELECT id FROM employees WHERE employee_id=?', [employee_id]);
    if (!employee) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }

    await dbRun(
      'INSERT INTO random_call_records (meeting_id, student_id) VALUES (?, ?)',
      [meeting_id, employee.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ???????
router.get('/meetings/:id/qrcode', async (req, res) => {
  try {
    const { id } = req.params;
    let qrcode = await dbGet('SELECT * FROM meeting_qrcodes WHERE meeting_id=?', [id]);

    const serverIP = getServerIP();
    const correctQrcodeData = `http://${serverIP}:3000/sign-in/${id}`;

    // ????????????
    if (!qrcode) {
      const qrcodeUrl = await QRCode.toDataURL(correctQrcodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      await dbRun(
        'INSERT INTO meeting_qrcodes (meeting_id, qrcode_data, qrcode_url) VALUES (?, ?, ?)',
        [id, correctQrcodeData, qrcodeUrl]
      );

      qrcode = { meeting_id: id, qrcode_data: correctQrcodeData, qrcode_url: qrcodeUrl };
    } else if (qrcode.qrcode_data !== correctQrcodeData) {
      // ?????????????????
      const qrcodeUrl = await QRCode.toDataURL(correctQrcodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      await dbRun(
        'UPDATE meeting_qrcodes SET qrcode_data=?, qrcode_url=? WHERE meeting_id=?',
        [correctQrcodeData, qrcodeUrl, id]
      );

      qrcode = { meeting_id: id, qrcode_data: correctQrcodeData, qrcode_url: qrcodeUrl };
    }

    res.json({ success: true, data: qrcode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ??????????????????
router.get('/meetings/:id/signed', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.query; // ???????

    let sql = `
      SELECT DISTINCT e.*
      FROM employees e
      JOIN attendance a ON e.id = a.student_id
      WHERE a.meeting_id = ? AND a.status = 'present'
    `;

    const params = [id];

    // ???????
    if (tags) {
      sql += ` AND e.tags LIKE ?`;
      params.push(`%${tags}%`);
    }

    sql += ` ORDER BY e.name`;

    const signed = await dbAll(sql, params);
    res.json({ success: true, data: signed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ??????
router.post('/question-record', async (req, res) => {
  try {
    const { meeting_id, employee_id, question_text, result, notes } = req.body;

    // 根据工号查找员工ID
    const employee = await dbGet('SELECT id FROM employees WHERE employee_id=?', [employee_id]);
    if (!employee) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }

    const recordResult = await dbRun(
      'INSERT INTO question_records (meeting_id, student_id, question_text, result, notes) VALUES (?, ?, ?, ?, ?)',
      [meeting_id, employee.id, question_text || '', result, notes || '']
    );

    res.json({ success: true, data: { id: recordResult.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ??????
router.get('/question-records/:meeting_id', async (req, res) => {
  try {
    const { meeting_id } = req.params;
    const records = await dbAll(`
      SELECT qr.*, e.name, e.employee_id, e.department
      FROM question_records qr
      JOIN employees e ON qr.student_id = e.id
      WHERE qr.meeting_id = ?
      ORDER BY qr.created_at DESC
    `, [meeting_id]);

    // ??
    const stats = await dbGet(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN result='correct' THEN 1 ELSE 0 END) as correct,
        SUM(CASE WHEN result='partial' THEN 1 ELSE 0 END) as partial,
        SUM(CASE WHEN result='wrong' THEN 1 ELSE 0 END) as wrong
      FROM question_records
      WHERE meeting_id = ?
    `, [meeting_id]);

    res.json({
      success: true,
      data: {
        records,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ?????????
router.get('/employee/:employee_id/question-records', async (req, res) => {
  try {
    const { employee_id } = req.params;
    // 根据工号查找员工ID
    const employee = await dbGet('SELECT id FROM employees WHERE employee_id=?', [employee_id]);
    if (!employee) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }

    const records = await dbAll(`
      SELECT qr.*, m.title as meeting_title, m.date
      FROM question_records qr
      JOIN meetings m ON qr.meeting_id = m.id
      WHERE qr.student_id = ?
      ORDER BY qr.created_at DESC
    `, [employee.id]);

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ????
router.delete('/meetings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ?????????
    await dbRun('DELETE FROM attendance WHERE meeting_id = ?', [id]);

    // ???????????
    await dbRun('DELETE FROM random_call_records WHERE meeting_id = ?', [id]);

    // ?????????
    await dbRun('DELETE FROM question_records WHERE meeting_id = ?', [id]);

    // ????????
    await dbRun('DELETE FROM meeting_qrcodes WHERE meeting_id = ?', [id]);

    // ????
    await dbRun('DELETE FROM meetings WHERE id = ?', [id]);

    res.json({ success: true, message: '??????' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
