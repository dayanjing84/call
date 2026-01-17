<template>
  <div class="students-container">
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加学生
      </el-button>
      <el-button type="success" @click="showImportDialog = true">
        <el-icon><Upload /></el-icon>
        批量导入
      </el-button>
      <el-button type="warning" @click="exportStudents">
        <el-icon><Download /></el-icon>
        导出名单
      </el-button>
    </div>

    <el-table :data="filteredStudents" stripe style="width: 100%">
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="student_id" label="学号" width="150" />
      <el-table-column prop="class" label="班级" width="150" />
      <el-table-column prop="phone" label="电话" width="150" />
      <el-table-column prop="email" label="邮箱" width="200" />
      <el-table-column label="操作" fixed="right" width="180">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="editStudent(row)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="deleteStudent(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑学生对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingStudent ? '编辑学生' : '添加学生'" width="500px">
      <el-form :model="studentForm" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="studentForm.name" />
        </el-form-item>
        <el-form-item label="学号">
          <el-input v-model="studentForm.student_id" />
        </el-form-item>
        <el-form-item label="班级">
          <el-input v-model="studentForm.class" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="studentForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="studentForm.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveStudent">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="showImportDialog" title="批量导入学生" width="600px">
      <div>
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <div>请上传Excel文件，文件格式要求：</div>
          <div>第一列：姓名（必填）</div>
          <div>第二列：学号</div>
          <div>第三列：班级</div>
          <div>第四列：电话</div>
          <div>第五列：邮箱</div>
        </el-alert>

        <el-upload
          drag
          accept=".xlsx,.xls"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处 或 <em>点击上传</em>
          </div>
        </el-upload>

        <el-button
          type="primary"
          style="margin-top: 20px"
          @click="importStudents"
          :disabled="!importFile"
        >
          开始导入
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, UploadFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { studentAPI } from '../api'

const students = ref([])
const showAddDialog = ref(false)
const showImportDialog = ref(false)
const editingStudent = ref(null)
const importFile = ref(null)

const studentForm = ref({
  name: '',
  student_id: '',
  class: '',
  phone: '',
  email: ''
})

const filteredStudents = computed(() => students.value)

onMounted(() => {
  loadStudents()
})

const loadStudents = async () => {
  try {
    const res = await studentAPI.getAll()
    students.value = res.data.data
  } catch (error) {
    ElMessage.error('加载学生列表失败')
  }
}

const editStudent = (student) => {
  editingStudent.value = student
  studentForm.value = { ...student }
  showAddDialog.value = true
}

const saveStudent = async () => {
  if (!studentForm.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }

  try {
    if (editingStudent.value) {
      // 编辑
      await studentAPI.update(editingStudent.value.id, studentForm.value)
      ElMessage.success('更新成功')
    } else {
      // 新增
      await studentAPI.add(studentForm.value)
      ElMessage.success('添加成功')
    }

    showAddDialog.value = false
    editingStudent.value = null
    studentForm.value = {
      name: '',
      student_id: '',
      class: '',
      phone: '',
      email: ''
    }
    loadStudents()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const deleteStudent = async (student) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除学生 ${student.name} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await studentAPI.delete(student.id)
    ElMessage.success('删除成功')
    loadStudents()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleFileChange = (file) => {
  importFile.value = file.raw
}

const importStudents = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择文件')
    return
  }

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

      // 解析数据
      const studentsData = []
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (row[0]) {
          studentsData.push({
            name: String(row[0]),
            student_id: row[1] ? String(row[1]) : '',
            class: row[2] ? String(row[2]) : '',
            phone: row[3] ? String(row[3]) : '',
            email: row[4] ? String(row[4]) : ''
          })
        }
      }

      if (studentsData.length === 0) {
        ElMessage.warning('未找到有效数据')
        return
      }

      // 导入学生
      const res = await studentAPI.import(studentsData)
      const results = res.data.data

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      ElMessage.success(`导入完成！成功：${successCount}，失败：${failCount}`)
      showImportDialog.value = false
      importFile.value = null
      loadStudents()
    }

    reader.readAsArrayBuffer(importFile.value)
  } catch (error) {
    ElMessage.error('导入失败：' + error.message)
  }
}

const exportStudents = () => {
  if (students.value.length === 0) {
    ElMessage.warning('暂无数据')
    return
  }

  // 准备导出数据
  const exportData = [
    ['姓名', '学号', '班级', '电话', '邮箱']
  ]

  students.value.forEach(student => {
    exportData.push([
      student.name,
      student.student_id || '',
      student.class || '',
      student.phone || '',
      student.email || ''
    ])
  })

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '学生名单')

  // 下载文件
  XLSX.writeFile(wb, '学生名单.xlsx')

  ElMessage.success('导出成功')
}
</script>

<style scoped>
.students-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>
