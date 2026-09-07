import type { RoadmapWeek, SpecialDate } from '../domain/types'

interface WeekRoadmapProps {
  roadmap: RoadmapWeek[]
  selectedWeek: number
  onSelectWeek: (week: number) => void
  specialDate?: SpecialDate
}

export function WeekRoadmap({ roadmap, selectedWeek, onSelectWeek, specialDate }: WeekRoadmapProps) {
  const selected = roadmap.find((item) => item.week === selectedWeek)

  return <section className="week-roadmap" aria-labelledby="roadmap-heading">
    <h2 id="roadmap-heading">16 週課程 Roadmap</h2>
    <div className="week-selector" aria-label="選擇課程週次">
      {roadmap.map((item) => <button key={item.week} type="button" className={item.week === selectedWeek ? 'active' : ''} onClick={() => onSelectWeek(item.week)}>W{item.week}</button>)}
    </div>
    <article className="week-detail">
      <p className="eyebrow">W{selectedWeek} 原定主題</p>
      <h3>{selected?.topic ?? '尚未安排主題'}</h3>
      {specialDate && <div className="schedule-adjustment"><strong>{specialDate.label}</strong><p>{specialDate.notes}</p></div>}
    </article>
  </section>
}
