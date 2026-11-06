import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { InventoryItem } from '../../types'
import { createId } from '../../lib/character'

interface InventoryListProps {
  items: InventoryItem[]
  onChange: (items: InventoryItem[]) => void
}

const CATEGORY_LABEL: Record<InventoryItem['category'], string> = {
  arma: 'Arma',
  protecao: 'Proteção',
  geral: 'Geral',
  paranormal: 'Paranormal',
}

export function InventoryList({ items, onChange }: InventoryListProps) {
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [category, setCategory] = useState<InventoryItem['category']>('geral')
  const [notes, setNotes] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    onChange([
      ...items,
      {
        id: createId(),
        name: name.trim(),
        qty: Math.max(1, qty),
        category,
        notes: notes.trim(),
      },
    ])
    setName('')
    setQty(1)
    setCategory('geral')
    setNotes('')
  }

  return (
    <div>
      {items.length ? (
        <div className="inventory-list">
          {items.map((item) => (
            <div className="inventory-item" key={item.id}>
              <input
                className="inventory-qty"
                type="number"
                min={1}
                value={item.qty}
                aria-label={`Quantidade de ${item.name}`}
                onChange={(event) =>
                  onChange(
                    items.map((entry) =>
                      entry.id === item.id
                        ? { ...entry, qty: Math.max(1, Number(event.target.value) || 1) }
                        : entry,
                    ),
                  )
                }
              />
              <div className="inventory-info">
                <strong>{item.name}</strong>
                <small>
                  {CATEGORY_LABEL[item.category]}
                  {item.notes ? ` · ${item.notes}` : ''}
                </small>
              </div>
              <button
                type="button"
                className="icon-btn danger"
                aria-label={`Remover ${item.name}`}
                onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="small muted">Inventário vazio.</p>
      )}

      <form className="inventory-form" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder="Item"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="Nome do item"
        />
        <input
          className="input"
          type="number"
          min={1}
          value={qty}
          onChange={(event) => setQty(Number(event.target.value) || 1)}
          aria-label="Quantidade"
        />
        <select
          className="select"
          value={category}
          onChange={(event) => setCategory(event.target.value as InventoryItem['category'])}
          aria-label="Categoria"
        >
          <option value="geral">Geral</option>
          <option value="arma">Arma</option>
          <option value="protecao">Proteção</option>
          <option value="paranormal">Paranormal</option>
        </select>
        <button type="submit" className="btn" aria-label="Adicionar item">
          <Plus size={14} aria-hidden="true" /> Item
        </button>
        <input
          className="input"
          placeholder="Observações (opcional)"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          aria-label="Observações do item"
          style={{ gridColumn: '1 / -1' }}
        />
      </form>
    </div>
  )
}
