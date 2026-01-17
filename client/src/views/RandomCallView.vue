<template>
  <div class="random-call-container">
    <!-- 顶部信息栏 -->
    <div class="top-bar">
      <el-select v-model="selectedMeeting" placeholder="选择会议" style="width: 300px" @change="loadMeetingData">
        <el-option
          v-for="meeting in meetings"
          :key="meeting.id"
          :label="meeting.title"
          :value="meeting.id"
        />
      </el-select>

      <el-select v-model="filterTags" placeholder="按标签筛选（可选）" clearable style="width: 200px" @change="loadMeetingData">
        <el-option label="全部" value="" />
        <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
      </el-select>

      <div class="stats">
        <el-tag type="success" size="large" round>
          已签到: {{ signedStudents.length }}人
        </el-tag>
        <el-tag type="warning" size="large" round style="margin-left: 10px">
          总人数: {{ totalPeople }}人
        </el-tag>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧：答题历史 -->
      <div class="left-panel">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>答题记录</span>
              <div>
                <el-tag type="success" size="small">{{ questionStats.correct || 0 }}</el-tag>
                <el-tag type="warning" size="small" style="margin-left: 5px">{{ questionStats.partial || 0 }}</el-tag>
                <el-tag type="danger" size="small" style="margin-left: 5px">{{ questionStats.wrong || 0 }}</el-tag>
              </div>
            </div>
          </template>
          <div class="question-list">
            <div v-if="questionRecords.length === 0" class="no-records">
              <p>暂无答题记录</p>
              <p class="hint">请先抽签选择员工，然后点击正确/部分正确/错误按钮记录答题结果</p>
            </div>
            <div
              v-for="record in questionRecords"
              :key="record.id"
              class="question-item"
              :class="'result-' + record.result"
            >
              <div class="question-content">
                <div class="student-name">{{ record.name }} ({{ record.employee_id }})</div>
                <div class="record-time">{{ formatTime(record.created_at) }}</div>
              </div>
              <el-tag
                :type="record.result === 'correct' ? 'success' : record.result === 'partial' ? 'warning' : 'danger'"
                size="small"
              >
                {{ record.result === 'correct' ? '正确' : record.result === 'partial' ? '部分正确' : '错误' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 中间：随机抽签区域 -->
      <div class="center-panel">
        <div class="lottery-box">
          <div class="participant-count">
            <span v-if="signedStudents.length > 0">
              已签到人员 {{ signedStudents.length }}人
            </span>
            <span v-else-if="filterTags">
              {{ filterTags }} {{ filteredAllStudents.length }}人
            </span>
            <span v-else>
              全部人员 {{ allStudents.length }}人
            </span>
          </div>

          <div class="selected-person">
            <div class="avatar-circle">
              <el-icon :size="80"><UserFilled /></el-icon>
            </div>
            <div class="person-name" :class="{ 'rolling': isRolling }">
              {{ currentName || '开始抽签' }}
            </div>
            <div v-if="selectedStudent && !isRolling" class="student-info">
              <div>工号: {{ selectedStudent.employee_id }}</div>
              <div>部门: {{ selectedStudent.department }}</div>
              <div v-if="selectedStudent.tags">职务: {{ selectedStudent.tags }}</div>
            </div>
          </div>

          <div class="action-buttons">
            <el-button
              type="danger"
              size="large"
              round
              @click="startStop"
              :disabled="signedStudents.length === 0 && allStudents.length === 0"
            >
              {{ isRolling ? '停止' : '随机抽签' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧：已签到人员列表 + 答题结果记录 -->
      <div class="right-panel">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>已签到人员</span>
              <el-tag type="success">{{ signedStudents.length }}人</el-tag>
            </div>
          </template>
          <div class="student-grid">
            <div
              v-for="student in signedStudents"
              :key="student.id"
              class="student-card"
              :class="{ 'selected': selectedStudent?.id === student.id }"
            >
              <el-icon><User /></el-icon>
              <div class="student-info-card">
                <div class="student-name">{{ student.name }}</div>
                <div class="student-id">{{ student.employee_id }}</div>
                <div v-if="student.tags" class="student-tags">
                  <el-tag size="small" type="info">{{ student.tags }}</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 答题结果记录 -->
        <el-card v-if="selectedStudent && !isRolling" shadow="hover" style="margin-top: 20px">
          <template #header>
            <span>记录答题结果</span>
          </template>
          <div class="answer-section">
            <div class="answer-buttons">
              <el-button type="success" @click="recordAnswer('correct')" size="large" class="answer-btn">
                <el-icon><Check /></el-icon> 正确
              </el-button>
              <el-button type="warning" @click="recordAnswer('partial')" size="large" class="answer-btn">
                <el-icon><Warning /></el-icon> 部分正确
              </el-button>
              <el-button type="danger" @click="recordAnswer('wrong')" size="large" class="answer-btn">
                <el-icon><Close /></el-icon> 错误
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, User, Check, Warning, Close } from '@element-plus/icons-vue'
import { employeeAPI, attendanceAPI } from '../api'

const meetings = ref([])
const selectedMeeting = ref(null)
const allStudents = ref([])
const signedStudents = ref([])
const questionRecords = ref([])
const questionStats = ref({})
const isRolling = ref(false)
const currentName = ref('')
const selectedStudent = ref(null)
const filterTags = ref('')
const availableTags = ref([])
let rollInterval = null

const totalPeople = computed(() => allStudents.value.length)

const filteredAllStudents = computed(() => {
  if (filterTags.value) {
    return allStudents.value.filter(student => student.tags && student.tags.includes(filterTags.value))
  }
  return allStudents.value
})

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(async () => {
  await loadStudents()
  await loadMeetings()
})

const loadStudents = async () => {
  try {
    const res = await employeeAPI.getAll()
    allStudents.value = res.data.data

    // 提取所有标签
    const tagsSet = new Set()
    allStudents.value.forEach(s => {
      if (s.tags) {
        s.tags.split(',').forEach(tag => tagsSet.add(tag.trim()))
      }
    })
    availableTags.value = Array.from(tagsSet)
  } catch (error) {
    ElMessage.error('加载学生列表失败')
  }
}

const loadMeetings = async () => {
  try {
    const res = await attendanceAPI.getMeetings()
    meetings.value = res.data.data
    if (meetings.value.length > 0) {
      selectedMeeting.value = meetings.value[0].id
      await loadMeetingData()
    }
  } catch (error) {
    ElMessage.error('加载会议列表失败')
  }
}

const loadMeetingData = async () => {
  if (!selectedMeeting.value) return

  try {
    // 获取已签到的学生（支持标签筛选）
    const res = await attendanceAPI.getSigned(selectedMeeting.value, filterTags.value)
    signedStudents.value = res.data.data

    // 获取答题记录
    const recordsRes = await attendanceAPI.getQuestionRecords(selectedMeeting.value)
    questionRecords.value = recordsRes.data.data.records
    questionStats.value = recordsRes.data.data.stats
  } catch (error) {
    ElMessage.error('加载会议数据失败')
  }
}

const startStop = () => {
  if (isRolling.value) {
    stopRolling()
  } else {
    startRolling()
  }
}

const startRolling = () => {
  let pool = []

  if (signedStudents.value.length > 0) {
    // 使用已签到人员
    pool = signedStudents.value
  } else {
    // 使用全部人员，如果设置了职务筛选则进行筛选
    if (filterTags.value) {
      pool = allStudents.value.filter(student => student.tags && student.tags.includes(filterTags.value))
    } else {
      pool = allStudents.value
    }
  }

  if (pool.length === 0) {
    const message = filterTags.value ? `没有找到职务为"${filterTags.value}"的人员` : '没有可用的人员'
    ElMessage.warning(message)
    return
  }

  isRolling.value = true
  selectedStudent.value = null

  rollInterval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * pool.length)
    const student = pool[randomIndex]
    currentName.value = student.name
  }, 100)
}

const stopRolling = () => {
  if (rollInterval) {
    clearInterval(rollInterval)
    rollInterval = null
  }

  isRolling.value = false

  let pool = []

  if (signedStudents.value.length > 0) {
    // 使用已签到人员
    pool = signedStudents.value
  } else {
    // 使用全部人员，如果设置了职务筛选则进行筛选
    if (filterTags.value) {
      pool = allStudents.value.filter(student => student.tags && student.tags.includes(filterTags.value))
    } else {
      pool = allStudents.value
    }
  }

  const randomIndex = Math.floor(Math.random() * pool.length)
  selectedStudent.value = pool[randomIndex]
  currentName.value = selectedStudent.value.name

  // 记录随机点名
  attendanceAPI.recordRandomCall({
    meeting_id: selectedMeeting.value,
    employee_id: selectedStudent.value.employee_id
  })

  ElMessage.success(`抽中：${selectedStudent.value.name}`)
}

const recordAnswer = async (result) => {
  if (!selectedStudent.value) {
    ElMessage.warning('请先抽签选择学生')
    return
  }

  try {
    await attendanceAPI.recordQuestion({
      meeting_id: selectedMeeting.value,
      employee_id: selectedStudent.value.employee_id,
      result: result,
      notes: ''
    })

    const resultText = result === 'correct' ? '正确' : result === 'partial' ? '部分正确' : '错误'
    ElMessage.success(`已记录：${selectedStudent.value.name} - ${resultText}`)

    // 重新加载答题记录
    await loadMeetingData()

    // 重置选择
    selectedStudent.value = null
    currentName.value = ''
  } catch (error) {
    ElMessage.error('记录失败')
  }
}
</script>

<style scoped>
.random-call-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  gap: 15px;
}

.stats {
  display: flex;
  gap: 10px;
}

.main-content {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 280px;
}

.center-panel {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.right-panel {
  width: 350px;
}

.lottery-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.participant-count {
  background-color: rgba(255, 255, 255, 0.9);
  color: #667eea;
  padding: 10px 30px;
  border-radius: 25px;
  display: inline-block;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 30px;
}

.selected-person {
  margin: 30px 0;
}

.avatar-circle {
  width: 150px;
  height: 150px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
}

.person-name {
  color: white;
  font-size: 36px;
  font-weight: bold;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
}

.person-name.rolling {
  animation: pulse 0.3s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.student-info {
  color: white;
  font-size: 16px;
  margin-top: 10px;
  line-height: 1.8;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
}

.answer-section {
  margin-top: 30px;
  padding-top: 25px;
  border-top: 2px solid rgba(255, 255, 255, 0.3);
}

.answer-title {
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.answer-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.answer-btn {
  min-width: 120px;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.answer-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.question-list {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.no-records {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.no-records p {
  margin: 0 0 10px 0;
  font-size: 14px;
}

.no-records .hint {
  font-size: 12px;
  color: #c0c4cc;
  line-height: 1.5;
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 4px solid;
}

.question-content {
  flex: 1;
}

.record-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.question-item.result-correct {
  background-color: #f0f9ff;
  border-left-color: #67c23a;
}

.question-item.result-partial {
  background-color: #fdf6ec;
  border-left-color: #e6a23c;
}

.question-item.result-wrong {
  background-color: #fef0f0;
  border-left-color: #f56c6c;
}

.student-name {
  font-weight: bold;
  font-size: 14px;
}

.student-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.student-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.student-card:hover {
  background-color: #e4e7ed;
  transform: translateY(-2px);
}

.student-card.selected {
  background-color: #409eff;
  color: white;
}

.student-info-card {
  flex: 1;
}

.student-name {
  font-weight: bold;
  font-size: 14px;
}

.student-id {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.student-card.selected .student-id {
  color: rgba(255, 255, 255, 0.8);
}

.student-tags {
  margin-top: 5px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>
