import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AppDataProvider } from './lib/store'
import { DashboardPage } from './pages/DashboardPage'
import { CoursePage } from './pages/CoursePage'
import { TasksPage } from './pages/TasksPage'
import { SopPage } from './pages/SopPage'
import { BackupPage } from './pages/BackupPage'

function CourseRoute() {
  const { courseId } = useParams()
  return <CoursePage courseId={courseId ?? '未指定課程'} />
}

function AppRoutes() {
  return <AppShell><Routes><Route path="/" element={<DashboardPage />} /><Route path="/courses/:courseId" element={<CourseRoute />} /><Route path="/tasks" element={<TasksPage />} /><Route path="/sop" element={<SopPage />} /><Route path="/backup" element={<BackupPage />} /></Routes></AppShell>
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'
  return <AppDataProvider><BrowserRouter basename={basename}><AppRoutes /></BrowserRouter></AppDataProvider>
}
