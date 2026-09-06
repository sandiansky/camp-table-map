import { ArrowLeft, MapPin, Plus, Shapes, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { CampData, Landmark } from '../types'
import { BottomSheet } from '../components/Modal'
import { makeId, now } from '../utils/id'

const objectTypes = [
  {kind:'house',icon:'🏠',label:'房子'},{kind:'tree',icon:'🌳',label:'树木'},{kind:'rock',icon:'🪨',label:'石头'},
  {kind:'tent',icon:'⛺',label:'帐篷'},{kind:'fence',icon:'🪵',label:'围栏'},{kind:'entrance',icon:'🚪',label:'入口'},
  {kind:'parking',icon:'🚗',label:'停车场'},{kind:'kitchen',icon:'🍳',label:'出餐口'},{kind:'toilet',icon:'🚻',label:'厕所'},
  {kind:'custom',icon:'📍',label:'其他'}
] as const

export function FixedObjectLibraryPage({data,onBack,update}:{data:CampData;onBack:()=>void;update:(recipe:(data:CampData)=>CampData)=>void}){
  const [adding,setAdding]=useState(false)
  const remove=(item:Landmark)=>{if(confirm(`确定删除固定物“${item.label}”？`))update(d=>({...d,landmarks:d.landmarks.filter(value=>value.id!==item.id)}))}
  return <div className="page library-page"><header className="sub-head"><button className="icon-btn" onClick={onBack}><ArrowLeft size={23}/></button><h1>固定物库</h1><button className="icon-btn" onClick={()=>setAdding(true)}><Plus size={22}/></button></header>
    <div className="library-intro object"><div><Shapes size={25}/></div><span><b>{data.landmarks.length} 个固定物</b><small>先加入片区，再到地图编辑模式拖动位置</small></span></div>
    <button className="btn primary wide library-add-wide" onClick={()=>setAdding(true)}><Plus size={18}/>新增固定物</button>
    <div className="object-library-grid">{data.landmarks.map(item=>{const zone=data.zones.find(value=>value.id===item.zoneId);return <article key={item.id} className={`object-library-card ${item.kind==='house'?'house':''}`}><span>{item.icon}</span><div><b>{item.label}</b><small><MapPin size={12}/>{zone?.name??'未知片区'}</small>{item.kind==='house'&&<em>{item.lengthMeters??6}m × {item.widthMeters??4}m</em>}</div><button onClick={()=>remove(item)} aria-label={`删除 ${item.label}`}><Trash2 size={17}/></button></article>})}</div>
    {data.landmarks.length===0&&<div className="library-empty"><Shapes/><h2>固定物库还是空的</h2><p>可以添加房子、树木、石头等现场物体。</p></div>}
    {adding&&<FixedObjectForm data={data} onClose={()=>setAdding(false)} onSave={item=>{update(d=>({...d,landmarks:[...d.landmarks,item]}));setAdding(false)}}/>}
  </div>
}

function FixedObjectForm({data,onClose,onSave}:{data:CampData;onClose:()=>void;onSave:(item:Landmark)=>void}){
  const [type,setType]=useState<(typeof objectTypes)[number]>(objectTypes[0]),[label,setLabel]=useState('房子'),[zoneId,setZoneId]=useState(data.zones[0]?.id??''),[size,setSize]=useState<NonNullable<Landmark['size']>>('medium'),[length,setLength]=useState(6),[width,setWidth]=useState(4)
  const choose=(next:(typeof objectTypes)[number])=>{setType(next);setLabel(next.label)}
  const save=()=>{if(!zoneId)return alert('请先创建片区');if(!label.trim())return alert('请输入名称');if(type.kind==='house'&&(length<=0||width<=0))return alert('房屋长宽必须大于 0 米');const stamp=now();onSave({id:makeId(),zoneId,label:label.trim(),icon:type.icon,kind:type.kind,size,x:360,y:330,lengthMeters:type.kind==='house'?length:undefined,widthMeters:type.kind==='house'?width:undefined,createdAt:stamp,updatedAt:stamp})}
  return <BottomSheet title="新增固定物" onClose={onClose}><div className="form"><label>固定物类型<div className="scenery-grid">{objectTypes.map(item=><button className={type.kind===item.kind?'active':''} onClick={()=>choose(item)} key={item.kind}><span>{item.icon}</span><small>{item.label}</small></button>)}</div></label><label>所属片区<select value={zoneId} onChange={e=>setZoneId(e.target.value)}>{data.zones.map(zone=><option value={zone.id} key={zone.id}>{zone.name}</option>)}</select></label><label>显示名称<input value={label} onChange={e=>setLabel(e.target.value)} placeholder="如 木屋、老槐树"/></label>{type.kind==='house'?<><div className="form-row"><label>长度（米）<input type="number" min="1" step="0.5" value={length} onChange={e=>setLength(Number(e.target.value))}/></label><label>宽度（米）<input type="number" min="1" step="0.5" value={width} onChange={e=>setWidth(Number(e.target.value))}/></label></div><div className="house-size-preview"><span>房屋占地</span><b>{length}m × {width}m</b><small>桌位可直接拖入房屋内部</small></div></>:<label>显示大小<div className="segmented">{([['small','小'],['medium','中'],['large','大']] as const).map(([value,text])=><button className={size===value?'active':''} onClick={()=>setSize(value)} key={value}>{text}</button>)}</div></label>}<button className="btn primary wide" onClick={save}>添加到片区中央</button></div></BottomSheet>
}
