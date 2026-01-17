import { dbRun } from './models/database.js';

// 示例学生数据
const sampleStudents = [
  { name: '张三', student_id: '2021001', class: '计算机1班', phone: '13800138001', email: 'zhangsan@example.com' },
  { name: '李四', student_id: '2021002', class: '计算机1班', phone: '13800138002', email: 'lisi@example.com' },
  { name: '王五', student_id: '2021003', class: '计算机1班', phone: '13800138003', email: 'wangwu@example.com' },
  { name: '赵六', student_id: '2021004', class: '计算机2班', phone: '13800138004', email: 'zhaoliu@example.com' },
  { name: '孙七', student_id: '2021005', class: '计算机2班', phone: '13800138005', email: 'sunqi@example.com' },
  { name: '周八', student_id: '2021006', class: '计算机2班', phone: '13800138006', email: 'zhouba@example.com' },
  { name: '吴九', student_id: '2021007', class: '计算机3班', phone: '13800138007', email: 'wujiu@example.com' },
  { name: '郑十', student_id: '2021008', class: '计算机3班', phone: '13800138008', email: 'zhengshi@example.com' },
  { name: '刘佳慧', student_id: '2021009', class: '计算机3班', phone: '13800138009', email: 'liujiahui@example.com' },
  { name: '陈文静', student_id: '2021010', class: '计算机1班', phone: '13800138010', email: 'chenwenjing@example.com' },
];

// 示例会议数据
const sampleMeetings = [
  {
    title: '项目组周会',
    date: '2025-12-07',
    start_time: '14:00:00',
    end_time: '16:00:00',
    location: '会议室A',
    description: '讨论本周项目进展'
  },
  {
    title: '技术分享会',
    date: '2025-12-08',
    start_time: '15:00:00',
    end_time: '17:00:00',
    location: '多功能厅',
    description: 'Vue3新特性分享'
  }
];

async function initSampleData() {
  console.log('开始初始化示例数据...');

  try {
    // 插入学生数据
    console.log('正在添加学生...');
    for (const student of sampleStudents) {
      await dbRun(
        'INSERT INTO students (name, student_id, class, phone, email) VALUES (?, ?, ?, ?, ?)',
        [student.name, student.student_id, student.class, student.phone, student.email]
      );
    }
    console.log(`✓ 已添加 ${sampleStudents.length} 个学生`);

    // 插入会议数据
    console.log('正在添加会议...');
    for (const meeting of sampleMeetings) {
      await dbRun(
        'INSERT INTO meetings (title, date, start_time, end_time, location, description) VALUES (?, ?, ?, ?, ?, ?)',
        [meeting.title, meeting.date, meeting.start_time, meeting.end_time, meeting.location, meeting.description]
      );
    }
    console.log(`✓ 已添加 ${sampleMeetings.length} 个会议`);

    // 添加一个示例考试
    console.log('正在添加考试...');
    const examResult = await dbRun(
      'INSERT INTO exams (meeting_id, title, exam_date, total_score, description) VALUES (?, ?, ?, ?, ?)',
      [1, 'Vue3基础测试', '2025-12-07', 100, '测试Vue3基础知识掌握情况']
    );
    console.log('✓ 已添加示例考试');

    // 添加一些示例成绩
    console.log('正在添加成绩...');
    const sampleScores = [
      { student_id: 1, score: 95, notes: '优秀' },
      { student_id: 2, score: 88, notes: '良好' },
      { student_id: 3, score: 92, notes: '优秀' },
      { student_id: 4, score: 85, notes: '良好' },
      { student_id: 5, score: 78, notes: '中等' },
    ];

    for (const score of sampleScores) {
      await dbRun(
        'INSERT INTO exam_scores (exam_id, student_id, score, notes) VALUES (?, ?, ?, ?)',
        [examResult.id, score.student_id, score.score, score.notes]
      );
    }
    console.log(`✓ 已添加 ${sampleScores.length} 条成绩记录`);

    console.log('\n✓ 示例数据初始化完成！');
    console.log('现在可以启动系统并使用这些数据进行测试');
    process.exit(0);
  } catch (error) {
    console.error('✗ 初始化失败:', error.message);
    process.exit(1);
  }
}

// 等待数据库初始化完成后再插入数据
setTimeout(() => {
  initSampleData();
}, 1000);
