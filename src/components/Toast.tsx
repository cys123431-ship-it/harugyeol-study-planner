import { CheckCircle2, X } from 'lucide-react'
import { useEffect } from 'react'
import { usePlanner } from '../store/PlannerContext'

export function Toast() {
  const { toast, clearToast } = usePlanner()
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(clearToast, 4200)
    return () => window.clearTimeout(timer)
  }, [toast, clearToast])
  if (!toast) return null
  return <div className="toast" role="status"><CheckCircle2 size={18} /><span>{toast}</span><button onClick={clearToast} aria-label="알림 닫기"><X size={16} /></button></div>
}
