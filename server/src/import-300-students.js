import { dbRun } from './models/database.js';

// 姓氏和名字库
const surnames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹', '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡', '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任'];

const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '华', '文', '慧', '玉兰', '红', '玉', '建', '波', '辉', '云', '鹏', '飞', '宇', '晨', '欣', '婷', '雪', '莉', '萍', '颖', '佳', '倩', '薇', '琳', '瑶', '璐', '洁'];

const classes = ['计算机1班', '计算机2班', '计算机3班', '计算机4班', '软件工程1班', '软件工程2班', '数据科学1班', '数据科学2班', '人工智能1班', '人工智能2班'];

// 生成随机姓名
function generateName() {
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
  return surname + givenName;
}

// 生成随机手机号
function generatePhone() {
  const prefixes = ['138', '139', '150', '151', '152', '158', '159', '188', '189'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
}

// 生成学生数据
function generateStudents(count) {
  const students = [];
  const startYear = 2021;
  const currentYear = 2025;

  for (let i = 1; i <= count; i++) {
    const year = startYear + Math.floor(Math.random() * (currentYear - startYear));
    const studentId = `${year}${String(i).padStart(5, '0')}`;
    const name = generateName();
    const className = classes[Math.floor(Math.random() * classes.length)];
    const phone = generatePhone();
    const email = `${studentId}@student.edu.cn`;

    students.push({
      name,
      student_id: studentId,
      class: className,
      phone,
      email
    });
  }

  return students;
}

async function importStudents(count = 300) {
  console.log(`开始生成并导入 ${count} 个学生数据...`);
  console.log('');

  try {
    const students = generateStudents(count);
    let successCount = 0;
    let failCount = 0;

    console.log('正在导入数据...');

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      try {
        await dbRun(
          'INSERT INTO students (name, student_id, class, phone, email) VALUES (?, ?, ?, ?, ?)',
          [student.name, student.student_id, student.class, student.phone, student.email]
        );
        successCount++;

        // 每50个显示一次进度
        if ((i + 1) % 50 === 0) {
          console.log(`进度: ${i + 1}/${count} (${Math.floor((i + 1) / count * 100)}%)`);
        }
      } catch (err) {
        failCount++;
        if (err.message.includes('UNIQUE constraint failed')) {
          // 学号重复，跳过
        } else {
          console.error(`导入失败 ${student.name}: ${err.message}`);
        }
      }
    }

    console.log('');
    console.log('========================================');
    console.log(`✓ 导入完成！`);
    console.log(`  成功: ${successCount} 人`);
    console.log(`  失败: ${failCount} 人`);
    console.log('========================================');
    console.log('');
    console.log('现在可以在系统中查看这些学生数据了！');

    process.exit(0);
  } catch (error) {
    console.error('✗ 导入失败:', error.message);
    process.exit(1);
  }
}

// 从命令行获取人数参数
const count = process.argv[2] ? parseInt(process.argv[2]) : 300;

if (isNaN(count) || count < 1 || count > 10000) {
  console.error('错误: 请输入有效的人数 (1-10000)');
  console.log('用法: node src/import-300-students.js [人数]');
  console.log('示例: node src/import-300-students.js 300');
  process.exit(1);
}

// 等待数据库初始化
setTimeout(() => {
  importStudents(count);
}, 1000);
