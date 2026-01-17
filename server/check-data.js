import { dbAll } from './src/models/database.js';

async function checkData() {
  try {
    console.log('检查员工数据...');
    const employees = await dbAll('SELECT name, employee_id, employee_code, department FROM employees LIMIT 5');
    console.log('员工数据:');
    employees.forEach(emp => {
      console.log(`- ${emp.name}: 工号=${emp.employee_id}, 员工编号=${emp.employee_code}, 部门=${emp.department}`);
    });

    const count = await dbAll('SELECT COUNT(*) as count FROM employees');
    console.log(`\n总员工数: ${count[0].count}`);

    console.log('\n检查答题记录...');
    const questionRecords = await dbAll('SELECT * FROM question_records LIMIT 10');
    console.log('答题记录:');
    questionRecords.forEach(record => {
      console.log(`- ID: ${record.id}, 会议: ${record.meeting_id}, 员工ID: ${record.student_id}, 结果: ${record.result}`);
    });

    const questionCount = await dbAll('SELECT COUNT(*) as count FROM question_records');
    console.log(`\n总答题记录数: ${questionCount[0].count}`);
  } catch (error) {
    console.error('检查数据失败:', error);
  } finally {
    process.exit(0);
  }
}

checkData();