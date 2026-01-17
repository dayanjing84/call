import XLSX from 'xlsx';
import { dbRun, dbGet } from './models/database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从Excel文件导入员工信息
 * @param {string} excelPath - Excel文件路径
 */
async function importFromExcel(excelPath) {
    console.log('========================================');
    console.log('开始从Excel导入员工信息...');
    console.log('========================================');
    console.log('');

    try {
        // 读取Excel文件
        console.log(`📂 正在读取文件: ${excelPath}`);
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✓ 成功读取 ${data.length} 条员工记录`);
        console.log('');

        // 先清空原有的学生数据（可选）
        console.log('⚠️  是否需要清空原有数据？');
        console.log('提示: 本脚本将自动清空students表中的所有数据');
        console.log('');

        // 清空employees表
        await dbRun('DELETE FROM employees');
        console.log('✓ 已清空原有员工数据');
        console.log('');

        let successCount = 0;
        let failCount = 0;

        console.log('正在导入员工数据...');
        console.log('');

        for (let i = 0; i < data.length; i++) {
            const employee = data[i];

            // 映射Excel字段到数据库字段
            // Excel字段: 姓名、手机、员工编号、短号、工号、职务、所属部门、邮件地址
            // 数据库字段: name, employee_id(工号), employee_code(员工编号), department, phone, email, tags
            const studentData = {
                name: employee['姓名'] || '',
                employee_id: employee['工号']?.toString() || '', // 工号用于签到
                employee_code: employee['员工编号'] || '', // 员工编号
                department: employee['所属部门'] || '',
                phone: employee['手机']?.toString() || '',
                email: employee['邮件地址'] || '',
                tags: employee['职务'] || '' // 职务
            };

            try {
                // 检查是否已存在
                const existing = await dbGet(
                    'SELECT id FROM employees WHERE employee_id = ?',
                    [studentData.employee_id]
                );

                if (existing) {
                    // 如果存在，更新数据
                    await dbRun(
                        'UPDATE employees SET name = ?, employee_code = ?, department = ?, phone = ?, email = ?, tags = ? WHERE employee_id = ?',
                        [studentData.name, studentData.employee_code, studentData.department, studentData.phone, studentData.email, studentData.tags, studentData.employee_id]
                    );
                } else {
                    // 如果不存在，插入新数据
                    await dbRun(
                        'INSERT INTO employees (name, employee_id, employee_code, department, phone, email, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [studentData.name, studentData.employee_id, studentData.employee_code, studentData.department, studentData.phone, studentData.email, studentData.tags]
                    );
                }

                successCount++;

                // 每5个显示一次进度
                if ((i + 1) % 5 === 0 || (i + 1) === data.length) {
                    console.log(`  进度: ${i + 1}/${data.length} (${Math.floor((i + 1) / data.length * 100)}%)`);
                }
            } catch (err) {
                failCount++;
                console.error(`  ✗ 导入失败 [${studentData.name}]: ${err.message}`);
            }
        }

        console.log('');
        console.log('========================================');
        console.log('✓ 导入完成！');
        console.log(`  成功: ${successCount} 人`);
        console.log(`  失败: ${failCount} 人`);
        console.log('========================================');
        console.log('');
        console.log('员工信息已成功导入到系统中！');
        console.log('');

        // 显示一些统计信息
        const totalEmployees = await dbGet('SELECT COUNT(*) as count FROM employees');
        const departments = await dbGet('SELECT COUNT(DISTINCT department) as count FROM employees WHERE department IS NOT NULL AND department != ""');

        console.log('数据统计:');
        console.log(`  总员工数: ${totalEmployees.count}`);
        console.log(`  部门数: ${departments.count}`);
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error('✗ 导入失败！');
        console.error('========================================');
        console.error('错误详情:', error.message);
        console.error('');
        process.exit(1);
    }
}

// 获取Excel文件路径
const excelPath = process.argv[2] || path.join(__dirname, '../../员工信息表.xlsx');

console.log('');
console.log('企业考勤系统 - 员工信息导入工具');
console.log(`Excel文件路径: ${excelPath}`);
console.log('');

// 等待数据库初始化
setTimeout(() => {
    importFromExcel(excelPath);
}, 1000);
