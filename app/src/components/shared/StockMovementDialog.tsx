import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Btn } from '@/components/layout/PageHeader'
import { formatCFA } from '@/lib/formatCFA'
import type { CatalogueItem } from '@/types/catalogue'
import type { StockMovementCreatePayload, StockMovementType } from '@/types/stock'

interface StockMovementDialogProps {
  open: boolean
  items: CatalogueItem[]
  defaultItemId?: number
  defaultMovementType?: StockMovementType
  saving?: boolean
  error?: string
  onClose: () => void
  onSubmit: (payload: StockMovementCreatePayload) => void | Promise<void>
}

const EMPTY_MOVEMENT: StockMovementCreatePayload = {
  catalogueItemId: 0,
  movementType: 'ENTREE',
  quantity: 1,
  motif: '',
}

export function StockMovementDialog({
  open,
  items,
  defaultItemId,
  defaultMovementType = 'ENTREE',
  saving = false,
  error = '',
  onClose,
  onSubmit,
}: StockMovementDialogProps) {
  const [movementQuery, setMovementQuery] = useState('')
  const [form, setForm] = useState<StockMovementCreatePayload>(EMPTY_MOVEMENT)

  useEffect(() => {
    if (!open) return
    setMovementQuery('')
    setForm({
      catalogueItemId: defaultItemId ?? items[0]?.id ?? 0,
      movementType: defaultMovementType,
      quantity: 1,
      motif: '',
    })
  }, [open, defaultItemId, defaultMovementType, items])

  const movementOptions = useMemo(() => {
    const normalized = movementQuery.trim().toLowerCase()
    if (!normalized) return items

    return items.filter((item) =>
      [item.nom, item.codeElement, item.service]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized)),
    )
  }, [items, movementQuery])

  const selectedMovementItem = items.find((item) => item.id === form.catalogueItemId) ?? null

  if (!open) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-zinc-900">Mouvement de stock</h2>
            <p className="text-[12px] text-zinc-400">Entree, sortie ou ajustement exceptionnel.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-700" aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
              {error}
            </div>
          )}
          <label className="text-[12px] font-semibold text-zinc-500">
            Recherche produit
            <input
              value={movementQuery}
              onChange={(event) => setMovementQuery(event.target.value)}
              placeholder="Nom, code ou service..."
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
            />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Produit
            <select
              value={form.catalogueItemId}
              onChange={(event) => setForm({ ...form, catalogueItemId: Number(event.target.value) })}
              required
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none"
            >
              <option value={0}>Choisir un produit</option>
              {movementOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nom} ({item.codeElement}) - stock {item.quantiteStock} - {formatCFA(item.montantFcfa)}
                </option>
              ))}
            </select>
          </label>
          {selectedMovementItem && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-[13px] font-semibold text-zinc-900">{selectedMovementItem.nom}</p>
              <p className="mt-1 text-[12px] text-zinc-500">
                {selectedMovementItem.codeElement} · stock {selectedMovementItem.quantiteStock} · prix {formatCFA(selectedMovementItem.montantFcfa)}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-[12px] font-semibold text-zinc-500">
              Type de mouvement
              <select
                value={form.movementType}
                onChange={(event) => setForm({ ...form, movementType: event.target.value as StockMovementType })}
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none"
              >
                <option value="ENTREE">Entree</option>
                <option value="SORTIE">Sortie</option>
                <option value="AJUSTEMENT">Ajustement</option>
              </select>
            </label>
            <label className="text-[12px] font-semibold text-zinc-500">
              Quantite
              <input
                type="number"
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
                required
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 font-mono text-[14px]"
              />
            </label>
          </div>
          <label className="text-[12px] font-semibold text-zinc-500">
            Motif
            <textarea
              value={form.motif}
              onChange={(event) => setForm({ ...form, motif: event.target.value })}
              required
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-5 py-4">
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Valider le mouvement'}
          </Btn>
        </div>
      </form>
    </div>
  )
}
