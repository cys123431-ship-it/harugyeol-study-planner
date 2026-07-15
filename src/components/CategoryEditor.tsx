import { Plus, Tag, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { usePlanner } from '../store/PlannerContext'
import type { CategoryType } from '../types'

const categoryTypes: { value: CategoryType; label: string }[] = [
  { value: 'study', label: '학습' },
  { value: 'exam', label: '시험' },
  { value: 'assignment', label: '과제' },
  { value: 'habit', label: '습관' },
  { value: 'event', label: '일정' },
  { value: 'project', label: '프로젝트' },
  { value: 'other', label: '기타' },
]

export function CategoryEditor() {
  const { data, addCategory, updateCategory, deleteCategory } = usePlanner()
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>('study')
  const [color, setColor] = useState('#75a99f')
  if (!data) return null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    addCategory(name, type, color)
    setName('')
  }

  return <section className="settings-group category-settings">
    <header><span><Tag /></span><div><h2>카테고리</h2><p>계획과 직접 추가한 일정을 분류하는 이름과 색을 관리합니다.</p></div></header>
    <div className="category-editor-list">
      {data.categories.map((category) => <div className="category-editor-row" key={category.id}>
        <input className="category-color" type="color" value={category.color} onChange={(event) => updateCategory(category.id, { color: event.target.value })} aria-label={`${category.name} 색상`} />
        <input defaultValue={category.name} onBlur={(event) => updateCategory(category.id, { name: event.target.value })} aria-label="카테고리 이름" />
        <select value={category.type} onChange={(event) => updateCategory(category.id, { type: event.target.value as CategoryType })} aria-label={`${category.name} 종류`}>{categoryTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <button className="icon-button danger" onClick={() => { if (window.confirm(`“${category.name}” 카테고리를 삭제할까요? 연결된 항목은 다른 카테고리로 이동합니다.`)) deleteCategory(category.id) }} aria-label={`${category.name} 삭제`}><Trash2 size={17} /></button>
      </div>)}
    </div>
    <form className="category-add-form" onSubmit={submit}>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="새 카테고리 이름" aria-label="새 카테고리 이름" />
      <select value={type} onChange={(event) => setType(event.target.value as CategoryType)} aria-label="새 카테고리 종류">{categoryTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <input className="category-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label="새 카테고리 색상" />
      <button className="secondary-button" type="submit"><Plus size={17} /> 추가</button>
    </form>
  </section>
}
