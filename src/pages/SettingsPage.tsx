import { ArrowLeft, Download, Upload, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { CampData } from '../types'

export function SettingsPage({ data, onBack, onName, onImport, onClear }: {
  data: CampData; onBack: () => void; onName: (name: string) => void; onImport: (value: CampData) => void; onClear: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [summary, setSummary] = useState<{ data: CampData; text: string } | null>(null)
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'camp-table-backup.json'; a.click(); URL.revokeObjectURL(url)
  }
  const readFile = async (file?: File) => {
    if (!file) return
    try {
      const value = JSON.parse(await file.text()) as CampData
      if (value.version !== 1 || !Array.isArray(value.zones) || !Array.isArray(value.tables)) throw new Error()
      setSummary({ data: value, text: `${value.zones.length} 个片区 · ${value.tables.length} 张桌子 · ${(value.landmarks ?? []).length} 个地标` })
    } catch { alert('无法读取备份：文件格式不正确。') }
  }
  return <div className="page settings-page">
    <header className="sub-head"><button className="icon-btn" onClick={onBack}><ArrowLeft size={23} /></button><h1>设置</h1><span /></header>
    <section className="settings-card"><label>营地名称<input value={data.settings.campName} onChange={e => onName(e.target.value)} /></label></section>
    <h2 className="settings-label">数据统计</h2><section className="settings-card stats"><div><b>{data.zones.length}</b><span>片区</span></div><div><b>{data.tables.length}</b><span>桌位</span></div><div><b>{data.landmarks.length}</b><span>地标</span></div></section>
    <h2 className="settings-label">数据管理</h2><section className="settings-card action-list">
      <button onClick={exportData}><Download size={20} />导出备份<span>›</span></button>
      <button onClick={() => fileRef.current?.click()}><Upload size={20} />导入备份<span>›</span></button>
      <button className="red" onClick={onClear}><Trash2 size={20} />清空全部数据<span>›</span></button>
      <input ref={fileRef} hidden type="file" accept="application/json" onChange={e => void readFile(e.target.files?.[0])} />
    </section>
    {summary && <div className="overlay center"><section className="dialog"><h2>导入这份备份？</h2><p>{summary.text}</p><p>当前数据将被替换。</p><div className="dialog-actions"><button className="btn secondary" onClick={() => setSummary(null)}>取消</button><button className="btn primary" onClick={() => { onImport(summary.data); setSummary(null) }}>确认导入</button></div></section></div>}
  </div>
}
