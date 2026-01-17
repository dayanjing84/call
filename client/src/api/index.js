import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// 员工相关API
export const employeeAPI = {
  getAll: () => api.get('/employees'),
  add: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  import: (employees) => api.post('/employees/import', { employees })
};

// 会议和签到相关API
export const attendanceAPI = {
  createMeeting: (data) => api.post('/attendance/meetings', data),
  getMeetings: () => api.get('/attendance/meetings'),
  getMeetingDetail: (id) => api.get(`/attendance/meetings/${id}`),
  getMeetingQRCode: (id) => api.get(`/attendance/meetings/${id}/qrcode`),
  deleteMeeting: (id) => api.delete(`/attendance/meetings/${id}`),
  signIn: (data) => api.post('/attendance/sign-in', data),
  getUnsigned: (meetingId) => api.get(`/attendance/meetings/${meetingId}/unsigned`),
  getSigned: (meetingId, tags) => api.get(`/attendance/meetings/${meetingId}/signed`, { params: { tags } }),
  recordRandomCall: (data) => api.post('/attendance/random-call', data),
  recordQuestion: (data) => api.post('/attendance/question-record', data),
  getQuestionRecords: (meetingId) => api.get(`/attendance/question-records/${meetingId}`),
  getEmployeeQuestionRecords: (employeeId) => api.get(`/attendance/employee/${employeeId}/question-records`)
};

// 考核相关API
export const examAPI = {
  create: (data) => api.post('/exams', data),
  getAll: () => api.get('/exams'),
  getDetail: (id) => api.get(`/exams/${id}`),
  addScore: (examId, data) => api.post(`/exams/${examId}/scores`, data),
  importScores: (examId, scores) => api.post(`/exams/${examId}/scores/import`, { scores }),
  export: (examId) => api.get(`/exams/${examId}/export`),
  delete: (id) => api.delete(`/exams/${id}`)
};

export default api;
