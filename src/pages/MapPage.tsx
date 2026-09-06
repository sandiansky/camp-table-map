import { ArrowLeft, Check, Download, Image as ImageIcon, Layers3, LocateFixed, MoreHorizontal, Search, Share2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { CampData, Landmark, LayoutTemplate, TableItem, Zone } from '../types'
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
  const [moreOpen,setMoreOpen]=useState(false), [backgroundOpen,setBackgroundOpen]=useState(false)
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
    if (!editing) return
    e.currentTarget.setPointerCapture(e.pointerId); const sx=e.clientX, sy=e.clientY, ox=item.x, oy=item.y
    const move = (event: PointerEvent) => {
      const x = Math.max(0, Math.min(CANVAS_W-50, ox+(event.clientX-sx)/transform.scale)), y = Math.max(0, Math.min(CANVAS_H-44, oy+(event.clientY-sy)/transform.scale))
      if (kind === 'table') {
        const table=item as TableItem, gap=7
        const overlaps=data.tables.some(other=>other.zoneId===table.zoneId&&other.id!==table.id&&x<other.x+other.width+gap&&x+table.width+gap>other.x&&y<other.y+other.height+gap&&y+table.height+gap>other.y)
        if(overlaps)return
      }
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
    <header className="map-head"><button className="icon-btn" onClick={onBack}><ArrowLeft size={23}/></button><div><h1>{zone.name}</h1><small>{tables.length} 张桌</small></div><div className="head-actions"><button className="icon-btn" onClick={() => setSearchOpen(v=>!v)}><Search size={21}/></button><button className="icon-btn" onClick={()=>setMoreOpen(true)}><MoreHorizontal size={21}/></button><button className={`edit-btn ${editing?'active':''}`} onClick={() => editing ? setEditing(false) : setConfirmEdit(true)}>{editing ? '完成':'编辑'}</button></div></header>
    {searchOpen && <div className="map-search"><SearchBox compact value={search} onChange={setSearch} tables={data.tables} zones={data.zones} onPick={t => t.zoneId===zone.id ? locate(t) : location.assign(`${location.pathname}#zone=${t.zoneId}&table=${t.id}`)} /></div>}
    <div ref={viewportRef} className="map-viewport" onPointerDown={onCanvasDown} onPointerMove={onCanvasMove} onPointerUp={endPointer} onPointerCancel={endPointer}>
      <div ref={exportRef} className="map-canvas" style={{ width: CANVAS_W, height: CANVAS_H, transform:`translate(${transform.x}px,${transform.y}px) scale(${transform.scale})` }}>
        <div className="export-title">{zone.name}<small>{data.settings.campName} · 桌位图</small></div>
        {zone.background?.visible && <img className="map-bg" src={zone.background.dataUrl} style={{opacity:zone.background.opacity}} alt="地图背景" draggable={false}/>} 
        {tables.map(table => <button key={table.id} className={`table-node shape-${table.shape} ${highlight===table.id?'highlight':''} ${highlight&&highlight!==table.id?'dim':''}`} style={{left:table.x,top:table.y,width:table.width,height:table.height}} onPointerDown={e => startItemDrag(e,table,'table')}><b>{table.number}</b></button>)}
        {landmarks.map(mark => {const isHouse=mark.kind==='house';const houseStyle=isHouse?{width:Math.max(150,(mark.lengthMeters??6)*32),height:Math.max(105,(mark.widthMeters??4)*32)}:{};return <button key={mark.id} className={`landmark-node scenery-${mark.kind??'custom'} size-${isHouse?'medium':mark.size??'medium'}`} style={{left:mark.x,top:mark.y,...houseStyle}} onPointerDown={e => startItemDrag(e,mark,'landmark')}><span>{mark.icon}</span><b>{mark.label}</b>{isHouse&&<small>{mark.lengthMeters??6}m × {mark.widthMeters??4}m</small>}</button>})}
      </div>
      <div className="zoom-controls"><button onClick={()=>setTransform(v=>({...v,scale:Math.min(2.5,v.scale+.15)}))}>＋</button><button onClick={()=>setTransform(v=>({...v,scale:Math.max(.35,v.scale-.15)}))}>−</button><button onClick={()=>setTransform({x:0,y:0,scale:.72})}><LocateFixed size={18}/></button></div>
      {!editing && <div className="view-hint">双指缩放 · 拖动查看</div>}
    </div>
    {editing && <nav className="drag-only-bar"><span>只可拖动桌位和固定物 · 桌位不会互相重叠</span><button onClick={()=>setEditing(false)}><Check size={18}/>完成</button></nav>}
    {confirmEdit && <ConfirmDialog title="进入编辑模式？" message="编辑模式只用于拖动桌位和固定物，新增操作请前往对应资料库。" confirmText="进入编辑" onCancel={()=>setConfirmEdit(false)} onConfirm={()=>{setConfirmEdit(false);setEditing(true)}}/>}
    {moreOpen&&<MoreSheet zone={zone} data={data} update={update} onClose={()=>setMoreOpen(false)} exportImage={exportImage} onBackground={()=>{setMoreOpen(false);setBackgroundOpen(true)}}/>}
    {backgroundOpen&&<BackgroundSheet zone={zone} update={update} onClose={()=>setBackgroundOpen(false)}/>}
  </div>
}

function BackgroundSheet({zone,update,onClose}:{zone:Zone;update:Updater;onClose:()=>void}){
  const pick=async(file?:File)=>{if(!file)return;const dataUrl=await compressImage(file);update(d=>({...d,zones:d.zones.map(z=>z.id===zone.id?{...z,background:{dataUrl,opacity:.55,visible:true},updatedAt:now()}:z)}))}
  const change=(patch:Partial<NonNullable<Zone['background']>>)=>update(d=>({...d,zones:d.zones.map(z=>z.id===zone.id&&z.background?{...z,background:{...z.background,...patch}}:z)}))
  return <BottomSheet title="地图背景" onClose={onClose}><div className="form"><label className="upload"><ImageIcon/>选择现场照片、航拍图或平面图<input hidden type="file" accept="image/*" onChange={e=>void pick(e.target.files?.[0])}/></label>{zone.background&&<><label>透明度 <span>{Math.round(zone.background.opacity*100)}%</span><input type="range" min="0.1" max="1" step=".05" value={zone.background.opacity} onChange={e=>change({opacity:Number(e.target.value)})}/></label><button className="btn secondary wide" onClick={()=>change({visible:!zone.background?.visible})}>{zone.background.visible?'隐藏背景':'显示背景'}</button><button className="btn text-danger wide" onClick={()=>update(d=>({...d,zones:d.zones.map(z=>z.id===zone.id?{...z,background:undefined}:z)}))}>删除背景</button></>}</div></BottomSheet>
}

function MoreSheet({zone,data,update,onClose,exportImage,onBackground}:{zone:Zone;data:CampData;update:Updater;onClose:()=>void;exportImage:(s:boolean)=>Promise<void>;onBackground:()=>void}){
 const [templateName,setTemplateName]=useState('');const templates=data.templates.filter(t=>t.zoneId===zone.id)
 const saveTemplate=()=>{if(!templateName.trim())return alert('请输入模板名称');const value:LayoutTemplate={id:makeId(),zoneId:zone.id,name:templateName.trim(),positions:data.tables.filter(t=>t.zoneId===zone.id).map(t=>({id:t.id,x:t.x,y:t.y})),createdAt:now()};update(d=>({...d,templates:[...d.templates,value]}));setTemplateName('')}
 const restore=(tpl:LayoutTemplate)=>{if(!confirm(`确定恢复“${tpl.name}”？当前桌位位置将被替换。`))return;update(d=>({...d,tables:d.tables.map(t=>{const p=tpl.positions.find(v=>v.id===t.id);return p?{...t,x:p.x,y:p.y,updatedAt:now()}:t})}));onClose()}
 return <BottomSheet title="更多" onClose={onClose}><div className="form"><button className="menu-button" onClick={onBackground}><ImageIcon/>地图背景</button><button className="menu-button" onClick={()=>void exportImage(false)}><Download/>导出 PNG</button><button className="menu-button" onClick={()=>void exportImage(true)}><Share2/>分享图片</button><h3>布局模板</h3><div className="inline-add"><input value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="如 周末布局"/><button onClick={saveTemplate}>保存</button></div>{templates.map(t=><button className="template-row" key={t.id} onClick={()=>restore(t)}><Layers3/>{t.name}<span>恢复</span></button>)}{templates.length===0&&<p className="muted">还没有保存布局模板</p>}</div></BottomSheet>
}
