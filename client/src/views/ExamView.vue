<template>
  <div class="exam-container">
    <div class="toolbar">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        创建考试
      </el-button>
    </div>

    <el-table :data="exams" stripe style="width: 100%">
      <el-table-column prop="title" label="考试名称" width="200" />
      <el-table-column prop="exam_date" label="考试日期" width="120" />
      <el-table-column prop="meeting_title" label="关联会议" width="200" />
      <el-table-column prop="total_score" label="满分" width="80" />
      <el-table-column label="操作" fixed="right" width="350">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewDetail(row)">
            成绩管理
          </el-button>
          <el-button type="success" size="small" @click="showImportDialog(row)">
            批量导入
          </el-button>
          <el-button type="warning" size="small" @click="exportScores(row)">
            导出
          </el-button>
          <el-button type="danger" size="small" @click="deleteExam(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建考试对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建考试" width="500px">
      <el-form :model="examForm" label-width="100px">
        <el-form-item label="考试名称">
          <el-input v-model="examForm.title" />
        </el-form-item>
        <el-form-item label="考试日期">
          <el-date-picker
            v-model="examForm.exam_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="关联会议">
          <el-select v-model="examForm.meeting_id" placeholder="选择会议">
            <el-option
              v-for="meeting in meetings"
              :key="meeting.id"
              :label="meeting.title"
              :value="meeting.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="满分">
          <el-input-number v-model="examForm.total_score" :min="0" :max="1000" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="examForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createExam">确定</el-button>
      </template>
    </el-dialog>

    <!-- 成绩管理对话框 -->
    <el-dialog v-model="showScoreDialog" title="成绩管理" width="900px">
      <div v-if="currentExam">
        <div class="exam-stats">
          <el-statistic title="参加人数" :value="examStats.total_students || 0" />
          <el-statistic title="平均分" :value="examStats.avg_score ? examStats.avg_score.toFixed(2) : 0" />
          <el-statistic title="最高分" :value="examStats.max_score || 0" />
          <el-statistic title="最低分" :value="examStats.min_score || 0" />
        </div>

        <el-divider />

        <div style="margin-bottom: 20px">
          <el-button type="primary" @click="showAddScoreDialog = true">录入成绩</el-button>
        </div>

        <el-table :data="scoreList" stripe>
          <el-table-column type="index" label="排名" width="60" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="student_id" label="学号" width="150" />
          <el-table-column prop="class" label="班级" width="120" />
          <el-table-column prop="score" label="成绩" width="100" sortable />
          <el-table-column prop="notes" label="备注" />
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="editScore(row)">
                修改
              </el-button>
              <el-button type="danger" size="small" @click="deleteScore(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 录入成绩对话框 -->
    <el-dialog v-model="showAddScoreDialog" title="录入成绩" width="400px">
      <el-form :model="scoreForm" label-width="80px">
        <el-form-item label="学生">
          <el-select v-model="scoreForm.student_id" filterable placeholder="选择学生">
            <el-option
              v-for="student in students"
              :key="student.id"
              :label="`${student.name} (${student.student_id})`"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="成绩">
          <el-input-number
            v-model="scoreForm.score"
            :min="0"
            :max="currentExam?.total_score || 100"
            :precision="1"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="scoreForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddScoreDialog = false">取消</el-button>
        <el-button type="primary" @click="addScore">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="showImportScoreDialog" title="批量导入成绩" width="600px">
      <div>
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <div>请上传Excel文件，文件格式要求：</div>
          <div>第一列：学号</div>
          <div>第二列：成绩</div>
          <div>第三列（可选）：备注</div>
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
          @click="importScores"
          :disabled="!importFile"
        >
          开始导入
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, UploadFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { examAPI, attendanceAPI, employeeAPI } from '../api'

const exams = ref([])
const meetings = ref([])
const students = ref([])
const showCreateDialog = ref(false)
const showScoreDialog = ref(false)
const showAddScoreDialog = ref(false)
const showImportScoreDialog = ref(false)
const currentExam = ref(null)
const scoreList = ref([])
const examStats = ref({})
const importFile = ref(null)

const examForm = ref({
  title: '',
  exam_date: '',
  meeting_id: null,
  total_score: 100,
  description: ''
})

const scoreForm = ref({
  student_id: null,
  score: 0,
  notes: ''
})

onMounted(async () => {
  await loadExams()
  await loadMeetings()
  await loadStudents()
})

const loadExams = async () => {
  try {
    const res = await examAPI.getAll()
    exams.value = res.data.data
  } catch (error) {
    ElMessage.error('加载考试列表失败')
  }
}

const loadMeetings = async () => {
  try {
    const res = await attendanceAPI.getMeetings()
    meetings.value = res.data.data
  } catch (error) {
    ElMessage.error('加载会议列表失败')
  }
}

const loadStudents = async () => {
  try {
    const res = await employeeAPI.getAll()
    students.value = res.data.data
  } catch (error) {
    ElMessage.error('加载学生列表失败')
  }
}

const createExam = async () => {
  try {
    await examAPI.create(examForm.value)
    ElMessage.success('考试创建成功')
    showCreateDialog.value = false
    examForm.value = {
      title: '',
      exam_date: '',
      meeting_id: null,
      total_score: 100,
      description: ''
    }
    loadExams()
  } catch (error) {
    ElMessage.error('创建考试失败')
  }
}

const viewDetail = async (exam) => {
  try {
    const res = await examAPI.getDetail(exam.id)
    currentExam.value = exam
    scoreList.value = res.data.data.scores
    examStats.value = res.data.data.stats
    showScoreDialog.value = true
  } catch (error) {
    ElMessage.error('加载考试详情失败')
  }
}

const addScore = async () => {
  try {
    await examAPI.addScore(currentExam.value.id, scoreForm.value)
    ElMessage.success('成绩录入成功')
    showAddScoreDialog.value = false
    scoreForm.value = { student_id: null, score: 0, notes: '' }
    viewDetail(currentExam.value)
  } catch (error) {
    ElMessage.error('录入成绩失败')
  }
}

const editScore = (score) => {
  scoreForm.value = {
    student_id: score.student_id,
    score: score.score,
    notes: score.notes
  }
  showAddScoreDialog.value = true
}

const deleteScore = async (score) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${score.name} 的成绩记录吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用后端API删除成绩
    await examAPI.deleteScore(currentExam.value.id, score.student_id)
    ElMessage.success('成绩删除成功')
    viewDetail(currentExam.value)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除成绩失败')
    }
  }
}

const showImportDialog = (exam) => {
  currentExam.value = exam
  importFile.value = null
  showImportScoreDialog.value = true
}

const handleFileChange = (file) => {
  importFile.value = file.raw
}

const importScores = async () => {
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
      const scores = []
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (row[0] && row[1] !== undefined) {
          scores.push({
            student_id: String(row[0]),
            score: Number(row[1]),
            notes: row[2] || ''
          })
        }
      }

      if (scores.length === 0) {
        ElMessage.warning('未找到有效数据')
        return
      }

      // 导入成绩
      const res = await examAPI.importScores(currentExam.value.id, scores)
      const results = res.data.data

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      ElMessage.success(`导入完成！成功：${successCount}，失败：${failCount}`)
      showImportScoreDialog.value = false
      viewDetail(currentExam.value)
    }

    reader.readAsArrayBuffer(importFile.value)
  } catch (error) {
    ElMessage.error('导入失败：' + error.message)
  }
}

const exportScores = async (exam) => {
  try {
    const res = await examAPI.export(exam.id)
    const { exam: examData, scores } = res.data.data

    // 准备导出数据
    const exportData = [
      ['考试名称', examData.title],
      ['考试日期', examData.exam_date],
      ['满分', examData.total_score],
      [],
      ['姓名', '学号', '班级', '成绩', '备注']
    ]

    scores.forEach(score => {
      exportData.push([
        score.name,
        score.student_id,
        score.class,
        score.score,
        score.notes || ''
      ])
    })

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '成绩单')

    // 下载文件
    XLSX.writeFile(wb, `${examData.title}_成绩单.xlsx`)

    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const deleteExam = async (exam) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除考试"${exam.title}"吗？删除后将无法恢复，相关的成绩记录也将被删除。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await examAPI.delete(exam.id)
    ElMessage.success('考试删除成功')
    loadExams()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除考试失败')
    }
  }
}
</script>

<style scoped>
.exam-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.exam-stats {
  display: flex;
  gap: 40px;
  justify-content: space-around;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}
</style>
