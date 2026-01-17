import { createRouter, createWebHistory } from 'vue-router'
import SignInView from '../views/SignInView.vue'
import MainLayout from '../layouts/MainLayout.vue'
import AttendanceView from '../views/AttendanceView.vue'
import RandomCallView from '../views/RandomCallView.vue'
import EmployeesView from '../views/EmployeesView.vue'

const routes = [
  {
    path: '/sign-in/:id',
    name: 'SignIn',
    component: SignInView
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/random-call',
    children: [
      {
        path: '/attendance',
        name: 'Attendance',
        component: AttendanceView
      },
      {
        path: '/random-call',
        name: 'RandomCall',
        component: RandomCallView
      },
      {
        path: '/employees',
        name: 'Employees',
        component: EmployeesView
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
