import { useEffect, useState } from 'react'
import type { CampData, Zone } from './types'
import { useCampStore } from './store/useCampStore'
import { HomePage } from './pages/HomePage'
import { MapPage } from './pages/MapPage'
import { SettingsPage } from './pages/SettingsPage'
import { BottomSheet, ConfirmDialog } from './components/Modal'
import { makeId, now } from './utils/id'
import { sampleData, emptyData } from './utils/sample'

type Route = { page:'home'|'settings' } | { page:'map'; zoneId:string; tableId?:string }

export default function App(){
 const {data,setData,storageError}=useCampStore(); const [route,setRoute]=useState<Route>({page:'home'});const [zoneForm,setZoneForm]=useState<Zone|null|undefined>(undefined);const [clearConfirm,setClearConfirm]=useState(false)
 useEffect(()=>{const readHash=()=>{const p=new URLSearchParams(location.hash.replace(/^#/,''));const id=p.get('zone');if(id)setRoute({page:'map',zoneId:id,tableId:p.get('table')??undefined})};readHash();addEventListener('hashchange',readHash);return()=>removeEventListener('hashchange',readHash)},[])
 const navigate=(next:Route)=>{setRoute(next);if(next.page==='map')location.hash=`zone=${next.zoneId}${next.tableId?`&table=${next.tableId}`:''}`;else history.replaceState(null,'',location.pathname+location.search)}
 const update=(recipe:(d:CampData)=>CampData)=>setData(recipe)
 const zone=route.page==='map'?data.zones.find(z=>z.id===route.zoneId):undefined
 return <><div className="app-shell">{route.page==='home'&&<HomePage data={data} onOpenZone={(zoneId,tableId)=>navigate({page:'map',zoneId,tableId})} onCreateZone={()=>setZoneForm(null)} onEditZone={setZoneForm} onSettings={()=>navigate({page:'settings'})} onLoadSample={()=>setData(sampleData())}/>} {route.page==='settings'&&<SettingsPage data={data} onBack={()=>navigate({page:'home'})} onName={name=>update(d=>({...d,settings:{...d.settings,campName:name}}))} onImport={value=>{setData({...emptyData(),...value,templates:value.templates??[],landmarks:value.landmarks??[]});navigate({page:'home'})}} onClear={()=>setClearConfirm(true)}/>} {route.page==='map'&&zone&&<MapPage zone={zone} data={data} initialTableId={route.tableId} onBack={()=>navigate({page:'home'})} update={update}/>} {route.page==='map'&&!zone&&<div className="missing"><p>片区不存在或已被删除。</p><button className="btn primary" onClick={()=>navigate({page:'home'})}>返回首页</button></div>}</div>
 {storageError&&<div className="toast error">{storageError}</div>}
 {zoneForm!==undefined&&<ZoneForm initial={zoneForm??undefined} count={data.zones.length} onClose={()=>setZoneForm(undefined)} onSave={value=>{update(d=>({...d,zones:zoneForm?d.zones.map(z=>z.id===value.id?value:z):[...d.zones,value]}));setZoneForm(undefined);if(!zoneForm)navigate({page:'map',zoneId:value.id})}} onDelete={zoneForm?()=>{if(confirm(`确定删除“${zoneForm.name}”及其中所有桌位和地标？`)){update(d=>({...d,zones:d.zones.filter(z=>z.id!==zoneForm.id),tables:d.tables.filter(t=>t.zoneId!==zoneForm.id),landmarks:d.landmarks.filter(t=>t.zoneId!==zoneForm.id),templates:d.templates.filter(t=>t.zoneId!==zoneForm.id)}));setZoneForm(undefined)}}:undefined} onMove={zoneForm?(delta)=>update(d=>({...d,zones:d.zones.map(z=>z.id===zoneForm.id?{...z,order:Math.max(0,z.order+delta)}:z)})):undefined}/>} 
 {clearConfirm&&<ConfirmDialog title="清空全部数据？" message="所有片区、桌位、地标和模板都会被删除，且无法恢复。建议先导出备份。" confirmText="清空" danger onCancel={()=>setClearConfirm(false)} onConfirm={()=>{setData(emptyData());setClearConfirm(false);navigate({page:'home'})}}/>}
 </>
}

function ZoneForm({initial,count,onClose,onSave,onDelete,onMove}:{initial?:Zone;count:number;onClose:()=>void;onSave:(z:Zone)=>void;onDelete?:()=>void;onMove?:(delta:number)=>void}){const [name,setName]=useState(initial?.name??''),[note,setNote]=useState(initial?.note??'');const save=()=>{if(!name.trim())return alert('请输入片区名称');const stamp=now();onSave({...initial,id:initial?.id??makeId(),name:name.trim(),note:note.trim(),order:initial?.order??count,createdAt:initial?.createdAt??stamp,updatedAt:stamp})};return <BottomSheet title={initial?'管理片区':'创建片区'} onClose={onClose}><div className="form"><label>片区名称 *<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="如 草坪 A 区"/></label><label>片区备注<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="如 靠近停车场（可选）"/></label><button className="btn primary wide" onClick={save}>{initial?'保存修改':'创建片区'}</button>{onMove&&<div className="form-row"><button className="btn secondary" onClick={()=>onMove(-1)}>上移</button><button className="btn secondary" onClick={()=>onMove(1)}>下移</button></div>}{onDelete&&<button className="btn text-danger wide" onClick={onDelete}>删除片区</button>}</div></BottomSheet>}
