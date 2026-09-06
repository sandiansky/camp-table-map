import { Search, X } from 'lucide-react'
import type { TableItem, Zone } from '../types'

export function SearchBox({ value, onChange, tables, zones, onPick, compact = false }: {
  value: string; onChange: (value: string) => void; tables: TableItem[]; zones: Zone[];
  onPick: (table: TableItem) => void; compact?: boolean
}) {
  const query = value.trim().toLocaleLowerCase()
  const results = query ? tables.filter(t => t.number.toLocaleLowerCase().includes(query)).slice(0, 8) : []
  return <div className={`search-wrap ${compact ? 'compact' : ''}`}>
    <div className="search-field"><Search size={20} /><input value={value} onChange={e => onChange(e.target.value)} placeholder="搜索桌号" inputMode="search" aria-label="搜索桌号" />{value && <button onClick={() => onChange('')} aria-label="清空"><X size={18} /></button>}</div>
    {results.length > 0 && <div className="search-results">
      {results.map(table => <button key={table.id} onClick={() => onPick(table)}><span><b>{table.number}号桌</b><small>{zones.find(z => z.id === table.zoneId)?.name ?? '未知片区'}</small></span><span>›</span></button>)}
    </div>}
    {query && results.length === 0 && <div className="search-results empty">没有找到“{value}”号桌</div>}
  </div>
}
