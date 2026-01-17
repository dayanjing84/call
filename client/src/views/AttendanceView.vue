<template>
  <div class="attendance-container">
    <div class="toolbar">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        创建会议
      </el-button>
    </div>

    <el-table :data="meetings" stripe style="width: 100%">
      <el-table-column prop="title" label="会议名称" width="200" />
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column prop="start_time" label="开始时间" width="100" />
      <el-table-column prop="location" label="地点" width="150" />
      <el-table-column label="签到情况" width="250">
        <template #default="{ row }">
          <el-tag type="success">到场: {{ row.stats?.present || 0 }}</el-tag>
          <el-tag type="warning" style="margin-left: 5px">迟到: {{ row.stats?.late || 0 }}</el-tag>
          <el-tag type="danger" style="margin-left: 5px">缺席: {{ row.stats?.absent || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="350">
        <template #default="{ row }">
          <el-button type="success" size="small" @click="showQRCode(row)">
            二维码
          </el-button>
          <el-button type="primary" size="small" @click="viewDetail(row)">
            查看详情
          </el-button>
          <el-button type="danger" size="small" @click="deleteMeeting(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建会议对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建会议" width="500px">
      <el-form :model="meetingForm" label-width="100px">
        <el-form-item label="会议名称">
          <el-input v-model="meetingForm.title" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="meetingForm.date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-picker
            v-model="meetingForm.start_time"
            placeholder="选择时间"
            value-format="HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker
            v-model="meetingForm.end_time"
            placeholder="选择时间"
            value-format="HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="meetingForm.location" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="meetingForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createMeeting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 会议详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="会议签到详情" width="800px">
      <div v-if="currentMeeting">
        <h3>{{ currentMeeting.title }}</h3>
        <p>时间：{{ currentMeeting.date }} {{ currentMeeting.start_time }}</p>

        <el-divider />

        <div style="margin-bottom: 20px">
          <el-button type="primary" @click="batchSignIn">批量签到</el-button>
        </div>

        <el-table :data="attendanceList" stripe>
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="student_id" label="学号" width="150" />
          <el-table-column prop="class" label="班级" width="120" />
          <el-table-column label="签到状态" width="120">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 'present' ? 'success' : row.status === 'late' ? 'warning' : 'danger'"
              >
                {{ row.status === 'present' ? '已签到' : row.status === 'late' ? '迟到' : '缺席' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sign_time" label="签到时间" width="180" />
        </el-table>
      </div>
    </el-dialog>

    <!-- 二维码对话框 -->
    <el-dialog v-model="showQRDialog" title="签到二维码" width="500px">
      <div v-if="currentQRCode" style="text-align: center">
        <h3>{{ currentQRMeeting?.title }}</h3>
        <p style="color: #909399">扫描二维码进行签到</p>
        <div style="margin: 20px 0">
          <img :src="currentQRCode" alt="签到二维码" style="width: 300px; height: 300px; border: 1px solid #dcdfe6; padding: 10px; border-radius: 8px" />
        </div>
        <el-button type="primary" @click="downloadQRCode">下载二维码</el-button>
        <el-button @click="printQRCode">打印二维码</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { attendanceAPI } from '../api'

const meetings = ref([])
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showQRDialog = ref(false)
const currentMeeting = ref(null)
const currentQRMeeting = ref(null)
const currentQRCode = ref('')
const attendanceList = ref([])

const meetingForm = ref({
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  location: '',
  description: ''
})

onMounted(() => {
  loadMeetings()
})

const loadMeetings = async () => {
  try {
    const res = await attendanceAPI.getMeetings()
    meetings.value = res.data.data

    // 加载每个会议的统计信息
    for (const meeting of meetings.value) {
      const detailRes = await attendanceAPI.getMeetingDetail(meeting.id)
      meeting.stats = detailRes.data.data.stats
    }
  } catch (error) {
    ElMessage.error('加载会议列表失败')
  }
}

const createMeeting = async () => {
  try {
    await attendanceAPI.createMeeting(meetingForm.value)
    ElMessage.success('会议创建成功')
    showCreateDialog.value = false
    meetingForm.value = {
      title: '',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      description: ''
    }
    loadMeetings()
  } catch (error) {
    ElMessage.error('创建会议失败')
  }
}

const viewDetail = async (meeting) => {
  try {
    const res = await attendanceAPI.getMeetingDetail(meeting.id)
    currentMeeting.value = meeting
    attendanceList.value = res.data.data.attendance
    showDetailDialog.value = true
  } catch (error) {
    ElMessage.error('加载会议详情失败')
  }
}

const batchSignIn = () => {
  ElMessage.info('请前往"随机抽签"页面进行签到操作')
}

const showQRCode = async (meeting) => {
  try {
    currentQRMeeting.value = meeting
    const res = await attendanceAPI.getMeetingQRCode(meeting.id)
    currentQRCode.value = res.data.data.qrcode_url
    showQRDialog.value = true
  } catch (error) {
    ElMessage.error('获取二维码失败')
  }
}

const downloadQRCode = () => {
  if (!currentQRCode.value) return

  const link = document.createElement('a')
  link.href = currentQRCode.value
  link.download = `${currentQRMeeting.value?.title || '会议'}_签到二维码.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  ElMessage.success('二维码已下载')
}

const printQRCode = () => {
  if (!currentQRCode.value) return

  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>打印签到二维码</title>
        <style>
          body { text-align: center; padding: 40px; }
          h2 { margin-bottom: 20px; }
          img { width: 400px; height: 400px; }
          p { margin-top: 20px; color: #666; }
        </style>
      </head>
      <body>
        <h2>${currentQRMeeting.value?.title || '会议'}  - 签到二维码</h2>
        <img src="${currentQRCode.value}" alt="签到二维码" />
        <p>请使用微信或浏览器扫描二维码进行签到</p>
        <p>${currentQRMeeting.value?.date || ''} ${currentQRMeeting.value?.start_time || ''}</p>
      </body>
    </html>
  `)
  printWindow.document.close()

  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
}

const deleteMeeting = async (meeting) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除会议"${meeting.title}"吗？删除后将无法恢复相关的签到、点名等记录也将被删除。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await attendanceAPI.deleteMeeting(meeting.id)
    ElMessage.success('会议删除成功')
    loadMeetings()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除会议失败')
    }
  }
}
</script>

<style scoped>
.attendance-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}
</style>
