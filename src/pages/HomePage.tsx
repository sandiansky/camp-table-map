import { LibraryBig, MapPin, MoreHorizontal, Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import type { CampData, TableItem, Zone } from '../types'
import { SearchBox } from '../components/SearchBox'

export function HomePage({ data, onOpenZone, onCreateZone, onEditZone, onSettings, onLibrary, onLoadSample }: {
  data: CampData; onOpenZone: (zoneId: string, tableId?: string) => void; onCreateZone: () => void;
  onEditZone: (zone: Zone) => void; onSettings: () => void; onLibrary: () => void; onLoadSample: () => void
}) {
  const [search, setSearch] = useState('')
  const pick = (table: TableItem) => onOpenZone(table.zoneId, table.id)
  if (data.zones.length === 0) return <main className="welcome page">
    <div className="welcome-icon"><MapPin size={34} /></div>
    <h1>创建你的第一张桌位地图</h1>
    <p>桌子挪动后也不怕找不到。用四步完成设置：</p>
    <ol><li>创建片区</li><li>添加桌位</li><li>拖动桌位到实际位置</li><li>员工搜索桌号快速找到桌子</li></ol>
    <button className="btn primary wide" onClick={onCreateZone}>创建第一个片区</button>
    <button className="btn secondary wide" onClick={onLoadSample}>加载示例</button>
  </main>

  return <div className="page home-page">
    <header className="home-head"><div><small>{data.settings.campName}</small><h1>桌位地图</h1><p>快速找到每一张桌子</p></div><div className="home-actions"><button className="icon-btn" onClick={onLibrary} aria-label="桌位库"><LibraryBig size={21} /></button><button className="icon-btn" onClick={onSettings} aria-label="设置"><Settings size={22} /></button></div></header>
    <SearchBox value={search} onChange={setSearch} tables={data.tables} zones={data.zones} onPick={pick} />
    <section className="section"><div className="section-title"><h2>片区</h2><span>{data.zones.length} 个</span></div>
      <div className="zone-grid">{[...data.zones].sort((a,b) => a.order-b.order).map(zone => {
        const count = data.tables.filter(t => t.zoneId === zone.id).length
        return <article className="zone-card" key={zone.id} onClick={() => onOpenZone(zone.id)}>
          <div className="zone-symbol"><MapPin size={22} /></div>
          <button className="more" onClick={e => { e.stopPropagation(); onEditZone(zone) }} aria-label="管理片区"><MoreHorizontal size={20} /></button>
          <h3>{zone.name}</h3><p>{count} 张桌{zone.note ? ` · ${zone.note}` : ''}</p>
        </article>
      })}</div>
    </section>
    <button className="fab" onClick={onCreateZone} aria-label="创建片区"><Plus size={28} /></button>
  </div>
}
