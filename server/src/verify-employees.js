import { dbAll } from './models/database.js';

async function verifyEmployees() {
    console.log('正在查询数据库中的员工信息...\n');

    try {
        const employees = await dbAll(
            'SELECT id, name, student_id, class, tags, phone FROM students LIMIT 10'
        );

        console.log(`数据库中共有 ${employees.length} 条员工记录（显示前10条）:\n`);
        console.table(employees);

        const total = await dbAll('SELECT COUNT(*) as total FROM students');
        console.log(`\n总员工数: ${total[0].total}`);

        const departments = await dbAll(
            'SELECT class, COUNT(*) as count FROM students WHERE class IS NOT NULL AND class != "" GROUP BY class'
        );
        console.log('\n按部门统计:');
        console.table(departments);

        process.exit(0);
    } catch (error) {
        console.error('查询失败:', error.message);
        process.exit(1);
    }
}

setTimeout(() => {
    verifyEmployees();
}, 1000);
