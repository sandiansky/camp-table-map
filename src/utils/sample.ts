import type { CampData, Landmark, TableItem } from '../types'
import { makeId, now } from './id'

export const emptyData = (): CampData => ({
  version: 1, zones: [], tables: [], landmarks: [], templates: [], settings: { campName: '我的营地' }
})

export const sampleData = (): CampData => {
  const zoneId = makeId()
  const timestamp = now()
  const nums = ['01', '02', '03', '05', '08', '11', '12']
  const tables: TableItem[] = nums.map((number, i) => ({
    id: makeId(), number, shape: i % 3 === 0 ? 'round' : 'square', seats: 4, zoneId,
    x: 150 + (i % 3) * 190, y: 170 + Math.floor(i / 3) * 170,
    width: 92, height: 68, note: '', createdAt: timestamp, updatedAt: timestamp
  }))
  const landmarks: Landmark[] = [
    ['入口', '↗️', 90, 620], ['大树', '🌳', 450, 400], ['出餐口', '🍳', 650, 90]
  ].map(([label, icon, x, y]) => ({ id: makeId(), zoneId, label: String(label), icon: String(icon), x: Number(x), y: Number(y), createdAt: timestamp, updatedAt: timestamp }))
  return {
    version: 1,
    zones: [{ id: zoneId, name: '草坪 A 区', note: '示例片区', order: 0, createdAt: timestamp, updatedAt: timestamp }],
    tables, landmarks, templates: [], settings: { campName: '我的营地' }
  }
}
