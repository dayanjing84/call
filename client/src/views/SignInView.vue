<template>
  <div class="sign-in-container">
    <div class="sign-in-card">
      <div class="header">
        <el-icon :size="60" color="#409eff"><SuccessFilled /></el-icon>
        <h1>会议签到</h1>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="loading">
        <el-icon class="is-loading" :size="40"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <!-- 会议信息 -->
      <div v-else-if="meeting && !signed" class="meeting-info">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="会议名称">{{ meeting.title }}</el-descriptions-item>
          <el-descriptions-item label="会议日期">{{ meeting.date }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ meeting.start_time }}</el-descriptions-item>
          <el-descriptions-item label="会议地点">{{ meeting.location || '未指定' }}</el-descriptions-item>
        </el-descriptions>

        <el-form :model="signInForm" label-width="100px" style="margin-top: 30px">
          <el-form-item label="工号">
            <el-input v-model="signInForm.employee_id" placeholder="请输入工号" />
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="signInForm.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-form>

        <el-button type="primary" size="large" @click="handleSignIn" :loading="submitting" style="width: 100%">
          立即签到
        </el-button>
      </div>

      <!-- 签到成功 -->
      <div v-else-if="signed" class="success-message">
        <el-result icon="success" title="签到成功！" :sub-title="`${signInForm.name}，您已成功签到`">
          <template #extra>
            <el-button type="primary" @click="goBack">返回</el-button>
          </template>
        </el-result>
      </div>

      <!-- 错误信息 -->
      <div v-else class="error-message">
        <el-result icon="error" title="会议不存在" sub-title="该会议不存在或已结束">
          <template #extra>
            <el-button type="primary" @click="goBack">返回</el-button>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { SuccessFilled, Loading } from '@element-plus/icons-vue'
import { attendanceAPI, employeeAPI } from '../api'

const route = useRoute()
const router = useRouter()

const meetingId = ref(null)
const meeting = ref(null)
const loading = ref(true)
const signed = ref(false)
const submitting = ref(false)

const signInForm = ref({
  employee_id: '',
  name: ''
})

onMounted(async () => {
  meetingId.value = route.params.id
  await loadMeeting()
})

const loadMeeting = async () => {
  try {
    loading.value = true
    const res = await attendanceAPI.getMeetingDetail(meetingId.value)
    meeting.value = res.data.data.meeting
  } catch (error) {
    ElMessage.error('加载会议信息失败')
    meeting.value = null
  } finally {
    loading.value = false
  }
}

const handleSignIn = async () => {
  if (!signInForm.value.employee_id) {
    ElMessage.warning('请输入工号')
    return
  }
  if (!signInForm.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }

  try {
    submitting.value = true

    // 验证工号和姓名是否匹配
    const employeesRes = await employeeAPI.getAll()
    const employees = employeesRes.data.data
    const employee = employees.find(e => e.employee_id === signInForm.value.employee_id)

    if (!employee) {
      ElMessage.error('工号不存在，请联系管理员')
      return
    }

    if (employee.name !== signInForm.value.name) {
      ElMessage.error('工号与姓名不匹配')
      return
    }

    // 提交签到
    await attendanceAPI.signIn({
      meeting_id: meetingId.value,
      employee_ids: [signInForm.value.employee_id], // 传递数组格式
      status: 'present'
    })

    signed.value = true
    ElMessage.success('签到成功！')
  } catch (error) {
    if (error.response?.data?.message?.includes('已签到')) {
      ElMessage.warning('您已经签到过了')
      signed.value = true
    } else {
      ElMessage.error('签到失败：' + (error.response?.data?.message || error.message))
    }
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.sign-in-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.sign-in-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  margin-top: 15px;
  color: #303133;
  font-size: 28px;
}

.loading {
  text-align: center;
  padding: 40px 0;
}

.loading p {
  margin-top: 15px;
  color: #909399;
  font-size: 16px;
}

.meeting-info {
  margin-top: 20px;
}

.success-message,
.error-message {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .sign-in-card {
    padding: 30px 20px;
  }

  .header h1 {
    font-size: 24px;
  }
}
</style>
