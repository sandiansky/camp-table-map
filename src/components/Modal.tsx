import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props { title: string; children: ReactNode; onClose: () => void }

export function BottomSheet({ title, children, onClose }: Props) {
  return <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-handle" />
      <header className="sheet-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="关闭"><X size={21} /></button></header>
      <div className="sheet-body">{children}</div>
    </section>
  </div>
}

export function ConfirmDialog({ title, message, confirmText = '确认', danger = false, onCancel, onConfirm }: {
  title: string; message: string; confirmText?: string; danger?: boolean; onCancel: () => void; onConfirm: () => void
}) {
  return <div className="overlay center"><section className="dialog" role="alertdialog">
    <h2>{title}</h2><p>{message}</p>
    <div className="dialog-actions"><button className="btn secondary" onClick={onCancel}>取消</button><button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>{confirmText}</button></div>
  </section></div>
}
