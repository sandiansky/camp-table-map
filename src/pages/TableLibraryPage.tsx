import { ArrowLeft, LibraryBig, MapPin, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CampData, TableItem, TableShape } from '../types'
import { BottomSheet } from '../components/Modal'
import { makeId, now } from '../utils/id'

export function tablePrefix(number: string) {
  const match = number.trim().match(/^([^0-9]*)(.*)$/)
  return match?.[1].trim().toLocaleUpperCase() || '无前缀'
}

function freePosition(existing: TableItem[], zoneId: string, width: number, height: number) {
  const gap=10
  for(let y=130;y<=800-height;y+=height+gap) for(let x=70;x<=930-width;x+=width+gap) {
    const blocked=existing.some(table=>table.zoneId===zoneId&&x<table.x+table.width+gap&&x+width+gap>table.x&&y<table.y+table.height+gap&&y+height+gap>table.y)
    if(!blocked)return {x,y}
  }
  return {x:20,y:20}
}

export function TableLibraryPage({ data, onBack, onPick, update }: {
  data: CampData; onBack: () => void; onPick: (table: TableItem) => void;
  update: (recipe: (data: CampData) => CampData) => void
}) {
  const [query, setQuery] = useState(''), [adding, setAdding] = useState(false), [batch, setBatch] = useState(false)
  const groups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const filtered = data.tables.filter(table => table.number.toLocaleLowerCase().includes(normalized) || tablePrefix(table.number).toLocaleLowerCase().includes(normalized))
    return filtered.reduce<Record<string, TableItem[]>>((result, table) => { const key=tablePrefix(table.number); (result[key]??=[]).push(table); return result }, {})
  }, [data.tables, query])
  const remove = (table: TableItem) => { if(confirm(`确定从桌位库删除 ${table.number} 号桌？`)) update(d=>({...d,tables:d.tables.filter(value=>value.id!==table.id)})) }

  return <div className="page library-page">
    <header className="sub-head"><button className="icon-btn" onClick={onBack}><ArrowLeft size={23}/></button><h1>桌位库</h1><button className="icon-btn" onClick={()=>setAdding(true)} aria-label="新增桌位"><Plus size={22}/></button></header>
    <div className="library-intro"><div><LibraryBig size={25}/></div><span><b>{data.tables.length} 张桌位</b><small>按前缀分组，桌号由“前缀 + 号数”组成</small></span></div>
    <div className="library-actions"><button className="btn primary" onClick={()=>setAdding(true)}><Plus size={17}/>新增桌位</button><button className="btn secondary" onClick={()=>setBatch(true)}>批量添加</button></div>
    <div className="library-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索桌号或前缀"/></div>
    {Object.entries(groups).sort(([a],[b]) => a.localeCompare(b, 'zh-CN')).map(([name, tables]) => <section className="table-group" key={name}>
      <header><h2>{name === '无前缀' ? '无前缀' : `${name} 前缀`}</h2><span>{tables.length} 张</span></header>
      <div>{tables.sort((a,b)=>a.number.localeCompare(b.number, undefined, {numeric:true})).map(table => {
        const zone = data.zones.find(value=>value.id===table.zoneId)
        return <div className="library-table" key={table.id}><button onClick={()=>onPick(table)}><b>{table.number}</b><span><MapPin size={13}/>{zone?.name??'未知片区'}</span></button><button className="library-delete" onClick={()=>remove(table)} aria-label={`删除 ${table.number}`}><Trash2 size={17}/></button></div>
      })}</div>
    </section>)}
    {data.tables.length===0&&<div className="library-empty"><LibraryBig/><h2>桌位库还是空的</h2><p>点击“新增桌位”并选择所属片区。</p></div>}
    {adding&&<LibraryTableForm data={data} onClose={()=>setAdding(false)} onSave={table=>{update(d=>({...d,tables:[...d.tables,table]}));setAdding(false)}}/>}
    {batch&&<LibraryBatchForm data={data} onClose={()=>setBatch(false)} onSave={items=>{update(d=>({...d,tables:[...d.tables,...items]}));setBatch(false)}}/>}
  </div>
}

function LibraryTableForm({data,onClose,onSave}:{data:CampData;onClose:()=>void;onSave:(table:TableItem)=>void}){
 const [prefix,setPrefix]=useState(''),[number,setNumber]=useState(''),[zoneId,setZoneId]=useState(data.zones[0]?.id??''),[shape,setShape]=useState<TableShape>('square')
 const save=()=>{const full=`${prefix.trim().toLocaleUpperCase()}${number.trim()}`;if(!zoneId)return alert('请先创建片区');if(!number.trim())return alert('请输入号数');if(data.tables.some(t=>t.number.toLocaleLowerCase()===full.toLocaleLowerCase()))return alert('桌号已存在');const stamp=now(),width=shape==='long'?126:92,height=shape==='round'?82:68,position=freePosition(data.tables,zoneId,width,height);onSave({id:makeId(),number:full,shape,zoneId,...position,width,height,note:'',createdAt:stamp,updatedAt:stamp})}
 return <BottomSheet title="新增桌位" onClose={onClose}><div className="form"><div className="form-row"><label>前缀<input value={prefix} onChange={e=>setPrefix(e.target.value)} placeholder="如 A、VIP"/></label><label>号数 *<input autoFocus value={number} onChange={e=>setNumber(e.target.value)} placeholder="如 01、12"/></label></div><label>所属片区<select value={zoneId} onChange={e=>setZoneId(e.target.value)}>{data.zones.map(zone=><option value={zone.id} key={zone.id}>{zone.name}</option>)}</select></label><label>桌型<div className="segmented">{([['round','圆桌'],['square','方桌'],['long','长桌']] as const).map(([value,text])=><button className={shape===value?'active':''} onClick={()=>setShape(value)} key={value}>{text}</button>)}</div></label><div className="preview">桌号预览：{prefix.trim().toLocaleUpperCase()}{number.trim()||'01'}</div><button className="btn primary wide" onClick={save}>添加到片区中央</button></div></BottomSheet>
}

function LibraryBatchForm({data,onClose,onSave}:{data:CampData;onClose:()=>void;onSave:(tables:TableItem[])=>void}){
 const [prefix,setPrefix]=useState('A'),[start,setStart]=useState(1),[end,setEnd]=useState(20),[digits,setDigits]=useState(2),[zoneId,setZoneId]=useState(data.zones[0]?.id??'')
 const numbers=Array.from({length:Math.max(0,Math.min(100,end-start+1))},(_,index)=>prefix.trim().toLocaleUpperCase()+String(start+index).padStart(digits,'0'))
 const save=()=>{if(!zoneId)return alert('请先创建片区');if(end<start||end-start>99)return alert('一次最多添加 100 张桌');if(numbers.some(number=>data.tables.some(t=>t.number.toLocaleLowerCase()===number.toLocaleLowerCase())))return alert('生成的桌号中有桌号已存在');const stamp=now(),placed=[...data.tables];const created=numbers.map(number=>{const position=freePosition(placed,zoneId,92,68);const table:TableItem={id:makeId(),number,shape:'square',zoneId,...position,width:92,height:68,note:'',createdAt:stamp,updatedAt:stamp};placed.push(table);return table});onSave(created)}
 return <BottomSheet title="批量添加桌位" onClose={onClose}><div className="form"><label>所属片区<select value={zoneId} onChange={e=>setZoneId(e.target.value)}>{data.zones.map(zone=><option value={zone.id} key={zone.id}>{zone.name}</option>)}</select></label><label>分组前缀<input value={prefix} onChange={e=>setPrefix(e.target.value)} placeholder="如 A、B、VIP"/></label><div className="form-row"><label>起始号数<input type="number" value={start} onChange={e=>setStart(Number(e.target.value))}/></label><label>结束号数<input type="number" value={end} onChange={e=>setEnd(Number(e.target.value))}/></label></div><label>号数位数<div className="segmented">{[1,2,3].map(value=><button className={digits===value?'active':''} onClick={()=>setDigits(value)} key={value}>{String(1).padStart(value,'0')}</button>)}</div></label><div className="preview">{numbers.length} 张：{numbers.slice(0,6).join('、')}{numbers.length>6?'…':''}</div><button className="btn primary wide" onClick={save}>确认添加</button></div></BottomSheet>
}
