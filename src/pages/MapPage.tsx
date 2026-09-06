import { ArrowLeft, Check, Download, Image as ImageIcon, Layers3, LocateFixed, MapPinned, MoreHorizontal, Plus, Search, Share2, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { CampData, Landmark, LayoutTemplate, TableItem, TableShape, Zone } from '../types'
import { BottomSheet, ConfirmDialog } from '../components/Modal'
import { SearchBox } from '../components/SearchBox'
import { compressImage } from '../utils/image'
import { makeId, now } from '../utils/id'

const CANVAS_W = 1000, CANVAS_H = 900
type Updater = (recipe: (data: CampData) => CampData) => void

export function MapPage({ zone, data, initialTableId, onBack, update }: {
  zone: Zone; data: CampData; initialTableId?: string; onBack: () => void; update: Updater
}) {
  const [editing, setEditing] = useState(false), [confirmEdit, setConfirmEdit] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false), [search, setSearch] = useState('')
  const [sheet, setSheet] = useState<'add'|'batch'|'background'|'landmark'|'more'|null>(null)
  const [selected, setSelected] = useState<TableItem | null>(null)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.72 })
  const viewportRef = useRef<HTMLDivElement>(null), exportRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef({ x: 0, y: 0, tx: 0, ty: 0, distance: 0, scale: 1 })
  const tables = useMemo(() => data.tables.filter(t => t.zoneId === zone.id), [data.tables, zone.id])
  const landmarks = useMemo(() => data.landmarks.filter(t => t.zoneId === zone.id), [data.landmarks, zone.id])

  const locate = (table: TableItem) => {
    const view = viewportRef.current; if (!view) return
    const scale = Math.max(transform.scale, .9)
    setTransform({ scale, x: view.clientWidth / 2 - (table.x + table.width / 2) * scale, y: view.clientHeight / 2 - (table.y + table.height / 2) * scale })
    setHighlight(table.id); setSearch(''); setSearchOpen(false); window.setTimeout(() => setHighlight(null), 2000)
  }
  useEffect(() => { const table = data.tables.find(t => t.id === initialTableId); if (table) window.setTimeout(() => locate(table), 120) }, [initialTableId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onCanvasDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const all = [...pointers.current.values()]; gesture.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y, distance: all.length > 1 ? Math.hypot(all[0].x-all[1].x, all[0].y-all[1].y) : 0, scale: transform.scale }
  }
  const onCanvasMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); const all = [...pointers.current.values()]
    if (all.length > 1) {
      const distance = Math.hypot(all[0].x-all[1].x, all[0].y-all[1].y)
      setTransform(v => ({ ...v, scale: Math.min(2.5, Math.max(.35, gesture.current.scale * distance / Math.max(1, gesture.current.distance))) }))
    } else if (!editing) setTransform(v => ({ ...v, x: gesture.current.tx + e.clientX-gesture.current.x, y: gesture.current.ty + e.clientY-gesture.current.y }))
  }
  const endPointer = (e: React.PointerEvent) => { pointers.current.delete(e.pointerId) }

  const startItemDrag = (e: React.PointerEvent, item: TableItem | Landmark, kind: 'table'|'landmark') => {
    e.stopPropagation()
    if (!editing) { if (kind === 'table') setSelected(item as TableItem); return }
    e.currentTarget.setPointerCapture(e.pointerId); const sx=e.clientX, sy=e.clientY, ox=item.x, oy=item.y
    const move = (event: PointerEvent) => {
      const x = Math.max(0, Math.min(CANVAS_W-50, ox+(event.clientX-sx)/transform.scale)), y = Math.max(0, Math.min(CANVAS_H-44, oy+(event.clientY-sy)/transform.scale))
      update(d => ({ ...d, [kind === 'table' ? 'tables':'landmarks']: d[kind === 'table' ? 'tables':'landmarks'].map(value => value.id===item.id ? {...value,x,y,updatedAt:now()} : value) } as CampData))
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true })
  }

  const exportImage = async (share: boolean) => {
    if (!exportRef.current) return
    try {
      const dataUrl = await toPng(exportRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#f0f1f3' })
      const filename = `${zone.name.replace(/\s/g,'')}-桌位图-${new Date().toISOString().slice(0,10)}.png`
      if (share && navigator.share) {
        const blob = await (await fetch(dataUrl)).blob(); const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) { await navigator.share({ title: zone.name, files: [file] }); return }
      }
      const a=document.createElement('a'); a.href=dataUrl; a.download=filename; a.click()
    } catch { alert('图片导出失败，请稍后再试。') }
  }

  return <div className={`map-page ${editing ? 'is-editing':''}`}>
    <header className="map-head"><button className="icon-btn" onClick={onBack}><ArrowLeft size={23}/></button><div><h1>{zone.name}</h1><small>{tables.length} 张桌</small></div><div className="head-actions"><button className="icon-btn" onClick={() => setSearchOpen(v=>!v)}><Search size={21}/></button><button className={`edit-btn ${editing?'active':''}`} onClick={() => editing ? setEditing(false) : setConfirmEdit(true)}>{editing ? '完成':'编辑'}</button></div></header>
    {searchOpen && <div className="map-search"><SearchBox compact value={search} onChange={setSearch} tables={data.tables} zones={data.zones} onPick={t => t.zoneId===zone.id ? locate(t) : location.assign(`${location.pathname}#zone=${t.zoneId}&table=${t.id}`)} /></div>}
    <div ref={viewportRef} className="map-viewport" onPointerDown={onCanvasDown} onPointerMove={onCanvasMove} onPointerUp={endPointer} onPointerCancel={endPointer}>
      <div ref={exportRef} className="map-canvas" style={{ width: CANVAS_W, height: CANVAS_H, transform:`translate(${transform.x}px,${transform.y}px) scale(${transform.scale})` }}>
        <div className="export-title">{zone.name}<small>{data.settings.campName} · 桌位图</small></div>
        {zone.background?.visible && <img className="map-bg" src={zone.background.dataUrl} style={{opacity:zone.background.opacity}} alt="地图背景" draggable={false}/>} 
        {tables.map(table => <button key={table.id} className={`table-node shape-${table.shape} ${highlight===table.id?'highlight':''} ${highlight&&highlight!==table.id?'dim':''}`} style={{left:table.x,top:table.y,width:table.width,height:table.height}} onPointerDown={e => startItemDrag(e,table,'table')} onClick={e=>{e.stopPropagation(); if(editing)setSelected(table)}}><b>{table.number}</b><small>{table.seats}座</small></button>)}
        {landmarks.map(mark => <button key={mark.id} className="landmark-node" style={{left:mark.x,top:mark.y}} onPointerDown={e => startItemDrag(e,mark,'landmark')}><span>{mark.icon}</span>{mark.label}</button>)}
      </div>
      <div className="zoom-controls"><button onClick={()=>setTransform(v=>({...v,scale:Math.min(2.5,v.scale+.15)}))}>＋</button><button onClick={()=>setTransform(v=>({...v,scale:Math.max(.35,v.scale-.15)}))}>−</button><button onClick={()=>setTransform({x:0,y:0,scale:.72})}><LocateFixed size={18}/></button></div>
      {!editing && <div className="view-hint">双指缩放 · 拖动查看</div>}
    </div>
    {editing && <nav className="tool-bar"><button onClick={()=>setSheet('add')}><Plus/><span>桌位</span></button><button onClick={()=>setSheet('background')}><ImageIcon/><span>背景</span></button><button onClick={()=>setSheet('landmark')}><MapPinned/><span>地标</span></button><button onClick={()=>setSheet('more')}><MoreHorizontal/><span>更多</span></button><button className="save" onClick={()=>setEditing(false)}><Check/><span>保存</span></button></nav>}
    {confirmEdit && <ConfirmDialog title="进入编辑模式？" message="进入后可以拖动、添加或修改桌位。" confirmText="进入编辑" onCancel={()=>setConfirmEdit(false)} onConfirm={()=>{setConfirmEdit(false);setEditing(true)}}/>}
    {sheet==='add' && <TableForm title="新建桌位" all={data.tables} zoneId={zone.id} onClose={()=>setSheet(null)} onBatch={()=>setSheet('batch')} onSave={table=>{update(d=>({...d,tables:[...d.tables,table]}));setSheet(null)}}/>}
    {sheet==='batch' && <BatchForm all={data.tables} zoneId={zone.id} onClose={()=>setSheet(null)} onSave={items=>{update(d=>({...d,tables:[...d.tables,...items]}));setSheet(null)}}/>}
    {selected && (editing ? <TableForm title="桌位设置" initial={selected} all={data.tables} zoneId={zone.id} onClose={()=>setSelected(null)} onSave={table=>{update(d=>({...d,tables:d.tables.map(t=>t.id===table.id?table:t)}));setSelected(null)}} onCopy={()=>{const copy={...selected,id:makeId(),number:`${selected.number}副本`,x:selected.x+30,y:selected.y+30,createdAt:now(),updatedAt:now()};update(d=>({...d,tables:[...d.tables,copy]}));setSelected(null)}} onDelete={()=>{if(confirm(`确定删除 ${selected.number} 号桌？`)){update(d=>({...d,tables:d.tables.filter(t=>t.id!==selected.id)}));setSelected(null)}}}/> : <BottomSheet title={`${selected.number} 号桌`} onClose={()=>setSelected(null)}><div className="table-detail"><div><span>桌型</span><b>{{round:'圆桌',square:'方桌',long:'长桌'}[selected.shape]}</b></div><div><span>座位数</span><b>{selected.seats} 人</b></div>{selected.note&&<div className="detail-note"><span>备注</span><b>{selected.note}</b></div>}</div></BottomSheet>)} 
    {sheet==='background' && <BackgroundSheet zone={zone} update={update} onClose={()=>setSheet(null)}/>} 
    {sheet==='landmark' && <LandmarkForm zoneId={zone.id} onClose={()=>setSheet(null)} onSave={mark=>{update(d=>({...d,landmarks:[...d.landmarks,mark]}));setSheet(null)}}/>}
    {sheet==='more' && <MoreSheet zone={zone} data={data} update={update} onClose={()=>setSheet(null)} exportImage={exportImage}/>} 
  </div>
}

function TableForm({title,initial,all,zoneId,onClose,onSave,onBatch,onCopy,onDelete}:{title:string;initial?:TableItem;all:TableItem[];zoneId:string;onClose:()=>void;onSave:(v:TableItem)=>void;onBatch?:()=>void;onCopy?:()=>void;onDelete?:()=>void}){
  const [number,setNumber]=useState(initial?.number??''),[shape,setShape]=useState<TableShape>(initial?.shape??'square'),[seats,setSeats]=useState(initial?.seats??4),[note,setNote]=useState(initial?.note??'')
  const save=()=>{const n=number.trim();if(!n)return alert('请输入桌号');if(all.some(t=>t.number.toLowerCase()===n.toLowerCase()&&t.id!==initial?.id))return alert('桌号已存在');const stamp=now();onSave({...initial,id:initial?.id??makeId(),number:n,shape,seats,zoneId,x:initial?.x??454,y:initial?.y??416,width:shape==='long'?126:92,height:shape==='round'?82:68,note,createdAt:initial?.createdAt??stamp,updatedAt:stamp})}
  return <BottomSheet title={title} onClose={onClose}><div className="form"><label>桌号 *<input autoFocus value={number} onChange={e=>setNumber(e.target.value)} placeholder="如 32、A01、VIP01"/></label><label>桌型<div className="segmented">{([['round','圆桌'],['square','方桌'],['long','长桌']] as const).map(([v,l])=><button className={shape===v?'active':''} onClick={()=>setShape(v)} key={v}>{l}</button>)}</div></label><label>座位数<input type="number" min="1" max="99" value={seats} onChange={e=>setSeats(Number(e.target.value))}/></label><label>备注<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="可选"/></label><button className="btn primary wide" onClick={save}>{initial?'保存修改':'添加桌位'}</button>{onBatch&&<button className="btn secondary wide" onClick={onBatch}>批量添加</button>}{onCopy&&<button className="btn secondary wide" onClick={onCopy}>复制桌位</button>}{onDelete&&<button className="btn text-danger wide" onClick={onDelete}>删除桌位</button>}</div></BottomSheet>
}

function BatchForm({all,zoneId,onClose,onSave}:{all:TableItem[];zoneId:string;onClose:()=>void;onSave:(v:TableItem[])=>void}){
  const [prefix,setPrefix]=useState(''),[start,setStart]=useState(1),[end,setEnd]=useState(20),[digits,setDigits]=useState(2)
  const numbers=Array.from({length:Math.max(0,Math.min(100,end-start+1))},(_,i)=>prefix+String(start+i).padStart(digits,'0'))
  const save=()=>{if(end<start||end-start>99)return alert('一次最多添加 100 张桌');if(numbers.some(n=>all.some(t=>t.number.toLowerCase()===n.toLowerCase())))return alert('生成的桌号中有桌号已存在');const stamp=now();onSave(numbers.map((number,i)=>({id:makeId(),number,shape:'square',seats:4,zoneId,x:100+(i%5)*150,y:160+Math.floor(i/5)*120,width:92,height:68,note:'',createdAt:stamp,updatedAt:stamp})))}
  return <BottomSheet title="批量添加桌位" onClose={onClose}><div className="form"><label>前缀<input value={prefix} onChange={e=>setPrefix(e.target.value)} placeholder="如 A（可选）"/></label><div className="form-row"><label>起始<input type="number" value={start} onChange={e=>setStart(Number(e.target.value))}/></label><label>结束<input type="number" value={end} onChange={e=>setEnd(Number(e.target.value))}/></label></div><label>数字位数<div className="segmented">{[1,2,3].map(n=><button className={digits===n?'active':''} onClick={()=>setDigits(n)} key={n}>{String(1).padStart(n,'0')}</button>)}</div></label><div className="preview">将生成 {numbers.length} 张桌：{numbers.slice(0,6).join('、')}{numbers.length>6?'…':''}</div><button className="btn primary wide" onClick={save}>确认添加</button></div></BottomSheet>
}

function BackgroundSheet({zone,update,onClose}:{zone:Zone;update:Updater;onClose:()=>void}){
  const pick=async(file?:File)=>{if(!file)return;const dataUrl=await compressImage(file);update(d=>({...d,zones:d.zones.map(z=>z.id===zone.id?{...z,background:{dataUrl,opacity:.55,visible:true},updatedAt:now()}:z)}))}
  const change=(patch:Partial<NonNullable<Zone['background']>>)=>update(d=>({...d,zones:d.zones.map(z=>z.id===zone.id&&z.background?{...z,background:{...z.background,...patch}}:z)}))
  return <BottomSheet title="地图背景" onClose={onClose}><div className="form"><label className="upload"><ImageIcon/>选择现场照片、航拍图或平面图<input hidden type="file" accept="image/*" onChange={e=>void pick(e.target.files?.[0])}/></label>{zone.background&&<><label>透明度 <span>{Math.round(zone.background.opacity*100)}%</span><input type="range" min="0.1" max="1" step=".05" value={zone.background.opacity} onChange={e=>change({opacity:Number(e.target.value)})}/></label><button className="btn secondary wide" onClick={()=>change({visible:!zone.background?.visible})}>{zone.background.visible?'隐藏背景':'显示背景'}</button><button className="btn text-danger wide" onClick={()=>update(d=>({...d,zones:d.zones.map(z=>z.id===zone.id?{...z,background:undefined}:z)}))}>删除背景</button></>}</div></BottomSheet>
}

function LandmarkForm({zoneId,onClose,onSave}:{zoneId:string;onClose:()=>void;onSave:(v:Landmark)=>void}){const [label,setLabel]=useState(''),[icon,setIcon]=useState('📍');return <BottomSheet title="添加地标" onClose={onClose}><div className="form"><label>类型<div className="emoji-grid">{['📍','🌳','🚗','🍳','🚻','🚪','💰','🏞️'].map(v=><button className={icon===v?'active':''} onClick={()=>setIcon(v)} key={v}>{v}</button>)}</div></label><label>名称<input value={label} onChange={e=>setLabel(e.target.value)} placeholder="如 入口、厨房、大树"/></label><button className="btn primary wide" onClick={()=>{if(!label.trim())return alert('请输入地标名称');const stamp=now();onSave({id:makeId(),zoneId,label:label.trim(),icon,x:450,y:420,createdAt:stamp,updatedAt:stamp})}}>添加地标</button></div></BottomSheet>}

function MoreSheet({zone,data,update,onClose,exportImage}:{zone:Zone;data:CampData;update:Updater;onClose:()=>void;exportImage:(s:boolean)=>Promise<void>}){
 const [templateName,setTemplateName]=useState('');const templates=data.templates.filter(t=>t.zoneId===zone.id)
 const saveTemplate=()=>{if(!templateName.trim())return alert('请输入模板名称');const value:LayoutTemplate={id:makeId(),zoneId:zone.id,name:templateName.trim(),positions:data.tables.filter(t=>t.zoneId===zone.id).map(t=>({id:t.id,x:t.x,y:t.y})),createdAt:now()};update(d=>({...d,templates:[...d.templates,value]}));setTemplateName('')}
 const restore=(tpl:LayoutTemplate)=>{if(!confirm(`确定恢复“${tpl.name}”？当前桌位位置将被替换。`))return;update(d=>({...d,tables:d.tables.map(t=>{const p=tpl.positions.find(v=>v.id===t.id);return p?{...t,x:p.x,y:p.y,updatedAt:now()}:t})}));onClose()}
 return <BottomSheet title="更多" onClose={onClose}><div className="form"><button className="menu-button" onClick={()=>void exportImage(false)}><Download/>导出 PNG</button><button className="menu-button" onClick={()=>void exportImage(true)}><Share2/>分享图片</button><h3>布局模板</h3><div className="inline-add"><input value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="如 周末布局"/><button onClick={saveTemplate}>保存</button></div>{templates.map(t=><button className="template-row" key={t.id} onClick={()=>restore(t)}><Layers3/>{t.name}<span>恢复</span></button>)}{templates.length===0&&<p className="muted">还没有保存布局模板</p>}</div></BottomSheet>
}
