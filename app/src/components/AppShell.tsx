import { NavLink } from 'react-router-dom'

const navigation = [['/', '儀表板'], ['/courses/CDPS', 'CDPS 課程'], ['/courses/BNA', 'BNA 課程'], ['/tasks', '任務管理'], ['/sop', '教學 SOP'], ['/backup', '本機備份']] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <aside className="sidebar" aria-label="主要導覽">
      <p className="eyebrow">LOCAL ONLY</p>
      <p className="brand">AI 助教小助理</p>
      <nav>{navigation.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
      <p className="privacy-note">所有資料僅儲存在這台裝置。</p>
    </aside>
    <main className="page-content">{children}</main>
  </div>
}
