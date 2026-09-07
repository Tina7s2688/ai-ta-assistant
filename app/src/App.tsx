import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AppDataProvider } from './lib/store'
import { DashboardPage } from './pages/DashboardPage'
import { CoursePage } from './pages/CoursePage'
import { TasksPage } from './pages/TasksPage'

function CourseRoute() {
  const { courseId } = useParams()
  return <CoursePage courseId={courseId ?? '未指定課程'} />
}

function SopPage() { return <PagePlaceholder title="教學 SOP" detail="建立可重複使用的教學流程。" /> }
function BackupPage() { return <PagePlaceholder title="本機備份" detail="匯出與保護此裝置上的資料。" /> }

function PagePlaceholder({ title, detail }: { title: string; detail: string }) {
  return <section className="page-placeholder"><p className="eyebrow">AI TA ASSISTANT</p><h1>{title}</h1><p>{detail}</p></section>
}

function AppRoutes() {
  return <AppShell><Routes><Route path="/" element={<DashboardPage />} /><Route path="/courses/:courseId" element={<CourseRoute />} /><Route path="/tasks" element={<TasksPage />} /><Route path="/sop" element={<SopPage />} /><Route path="/backup" element={<BackupPage />} /></Routes></AppShell>
}

export default function App() { return <AppDataProvider><BrowserRouter><AppRoutes /></BrowserRouter></AppDataProvider> }
