import { ArrowLeft, LibraryBig, MapPin, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CampData, TableItem } from '../types'

function groupName(number: string) {
  const first = number.trim().charAt(0).toLocaleUpperCase()
  if (/\d/.test(first)) return '数字桌号'
  return first ? `${first} 组` : '其他'
}

export function TableLibraryPage({ data, onBack, onPick }: {
  data: CampData; onBack: () => void; onPick: (table: TableItem) => void
}) {
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const filtered = data.tables.filter(table => table.number.toLocaleLowerCase().includes(normalized) || groupName(table.number).toLocaleLowerCase().includes(normalized))
    return filtered.reduce<Record<string, TableItem[]>>((result, table) => {
      const key = groupName(table.number); (result[key] ??= []).push(table); return result
    }, {})
  }, [data.tables, query])

  return <div className="page library-page">
    <header className="sub-head"><button className="icon-btn" onClick={onBack}><ArrowLeft size={23}/></button><h1>桌位库</h1><span/></header>
    <div className="library-intro"><div><LibraryBig size={25}/></div><span><b>{data.tables.length} 张桌位</b><small>按桌号首字符自动分组</small></span></div>
    <div className="library-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索桌号或分组"/></div>
    {Object.entries(groups).sort(([a],[b]) => a.localeCompare(b, 'zh-CN')).map(([name, tables]) => <section className="table-group" key={name}>
      <header><h2>{name}</h2><span>{tables.length} 张</span></header>
      <div>{tables.sort((a,b)=>a.number.localeCompare(b.number, undefined, {numeric:true})).map(table => {
        const zone = data.zones.find(value=>value.id===table.zoneId)
        return <button className="library-table" key={table.id} onClick={()=>onPick(table)}><b>{table.number}</b><span><MapPin size={13}/>{zone?.name??'未知片区'}</span><i>›</i></button>
      })}</div>
    </section>)}
    {data.tables.length===0&&<div className="library-empty"><LibraryBig/><h2>桌位库还是空的</h2><p>进入任意片区的编辑模式添加桌位。</p></div>}
    {data.tables.length>0&&Object.keys(groups).length===0&&<div className="library-empty"><p>没有找到匹配的桌位。</p></div>}
  </div>
}
