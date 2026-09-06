import { useCallback, useEffect, useState } from 'react'
import type { CampData } from '../types'
import { emptyData } from '../utils/sample'

const KEY = 'camp-table-map:data:v1'

const read = (): CampData => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    const value = JSON.parse(raw) as CampData
    return { ...emptyData(), ...value, templates: value.templates ?? [] }
  } catch { return emptyData() }
}

export function useCampStore() {
  const [data, setDataState] = useState<CampData>(read)
  const [storageError, setStorageError] = useState('')

  const setData = useCallback((next: CampData | ((value: CampData) => CampData)) => {
    setDataState(current => typeof next === 'function' ? next(current) : next)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
      setStorageError('')
    } catch {
      setStorageError('本机存储空间不足。请删除较大的背景图，或先导出备份。')
    }
  }, [data])

  return { data, setData, storageError }
}
