import { BrowserRouter, NavLink, Route, Routes, useParams } from 'react-router-dom'

export interface DashboardPageProps {}
export interface CoursePageProps { courseId: string }

const navigation = [['/', '儀表板'], ['/tasks', '任務管理'], ['/sop', '教學 SOP'], ['/backup', '本機備份']] as const

function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><aside className="sidebar" aria-label="主要導覽"><p className="eyebrow">LOCAL ONLY</p><p className="brand">AI 助教小助理</p><nav>{navigation.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav><p className="privacy-note">所有資料僅儲存在這台裝置。</p></aside><main className="page-content">{children}</main></div>
}

export function DashboardPage(props: DashboardPageProps) { void props; return <PagePlaceholder title="教學儀表板" detail="從這裡掌握課程、待辦與教學流程。" /> }
export function CoursePage(props: CoursePageProps) { return <PagePlaceholder title={`課程：${props.courseId}`} detail="課程內容將保留在此裝置上。" /> }

function CourseRoute() {
  const { courseId } = useParams()
  return <CoursePage courseId={courseId ?? '未指定課程'} />
}

function TasksPage() { return <PagePlaceholder title="任務管理" detail="整理下一步要處理的教學工作。" /> }
function SopPage() { return <PagePlaceholder title="教學 SOP" detail="建立可重複使用的教學流程。" /> }
function BackupPage() { return <PagePlaceholder title="本機備份" detail="匯出與保護此裝置上的資料。" /> }

function PagePlaceholder({ title, detail }: { title: string; detail: string }) {
  return <section className="page-placeholder"><p className="eyebrow">AI TA ASSISTANT</p><h1>{title}</h1><p>{detail}</p></section>
}

function AppRoutes() {
  return <AppShell><Routes><Route path="/" element={<DashboardPage />} /><Route path="/courses/:courseId" element={<CourseRoute />} /><Route path="/tasks" element={<TasksPage />} /><Route path="/sop" element={<SopPage />} /><Route path="/backup" element={<BackupPage />} /></Routes></AppShell>
}

export default function App() { return <BrowserRouter><AppRoutes /></BrowserRouter> }
