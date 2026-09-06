export type TableShape = 'round' | 'square' | 'long'

export interface Zone {
  id: string
  name: string
  note: string
  order: number
  background?: { dataUrl: string; opacity: number; visible: boolean }
  createdAt: string
  updatedAt: string
}

export interface TableItem {
  id: string
  number: string
  shape: TableShape
  seats?: number
  zoneId: string
  x: number
  y: number
  width: number
  height: number
  note: string
  createdAt: string
  updatedAt: string
}

export interface Landmark {
  id: string
  zoneId: string
  label: string
  icon: string
  kind?: 'house' | 'tree' | 'rock' | 'tent' | 'fence' | 'entrance' | 'parking' | 'kitchen' | 'toilet' | 'custom'
  size?: 'small' | 'medium' | 'large'
  lengthMeters?: number
  widthMeters?: number
  x: number
  y: number
  createdAt: string
  updatedAt: string
}

export interface LayoutTemplate {
  id: string
  zoneId: string
  name: string
  positions: Array<{ id: string; x: number; y: number }>
  createdAt: string
}

export interface CampData {
  version: 1
  zones: Zone[]
  tables: TableItem[]
  landmarks: Landmark[]
  templates: LayoutTemplate[]
  settings: { campName: string }
}
