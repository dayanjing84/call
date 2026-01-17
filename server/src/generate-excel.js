import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 姓氏和名字库
const surnames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹', '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡', '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任'];

const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '华', '文', '慧', '玉兰', '红', '玉', '建', '波', '辉', '云', '鹏', '飞', '宇', '晨', '欣', '婷', '雪', '莉', '萍', '颖', '佳', '倩', '薇', '琳', '瑶', '璐', '洁'];

const classes = ['计算机1班', '计算机2班', '计算机3班', '计算机4班', '软件工程1班', '软件工程2班', '数据科学1班', '数据科学2班', '人工智能1班', '人工智能2班'];

function generateName() {
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
  return surname + givenName;
}

function generatePhone() {
  const prefixes = ['138', '139', '150', '151', '152', '158', '159', '188', '189'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
}

function generateExcelTemplate(count = 300) {
  console.log(`正在生成 ${count} 人的Excel文件...`);

  const data = [
    ['姓名', '学号', '班级', '电话', '邮箱']
  ];

  const startYear = 2021;

  for (let i = 1; i <= count; i++) {
    const year = startYear + Math.floor(Math.random() * 4);
    const studentId = `${year}${String(i).padStart(5, '0')}`;
    const name = generateName();
    const className = classes[Math.floor(Math.random() * classes.length)];
    const phone = generatePhone();
    const email = `${studentId}@student.edu.cn`;

    data.push([name, studentId, className, phone, email]);
  }

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 设置列宽
  ws['!cols'] = [
    { wch: 12 },  // 姓名
    { wch: 15 },  // 学号
    { wch: 15 },  // 班级
    { wch: 15 },  // 电话
    { wch: 25 }   // 邮箱
  ];

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '学生名单');

  // 保存文件
  const outputPath = path.join(__dirname, '../../学生名单_300人.xlsx');
  XLSX.writeFile(wb, outputPath);

  console.log('✓ Excel文件生成成功！');
  console.log(`文件位置: ${outputPath}`);
  console.log('');
  console.log('使用说明：');
  console.log('1. 打开生成的Excel文件');
  console.log('2. 根据需要修改学生信息');
  console.log('3. 在系统的"人员管理"页面点击"批量导入"');
  console.log('4. 选择这个Excel文件上传即可');
}

const count = process.argv[2] ? parseInt(process.argv[2]) : 300;

if (isNaN(count) || count < 1 || count > 10000) {
  console.error('错误: 请输入有效的人数 (1-10000)');
  console.log('用法: node src/generate-excel.js [人数]');
  console.log('示例: node src/generate-excel.js 300');
  process.exit(1);
}

generateExcelTemplate(count);
