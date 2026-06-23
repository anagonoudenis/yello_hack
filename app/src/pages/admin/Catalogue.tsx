import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { formatCFA } from '@/lib/formatCFA'
import { cn } from '@/lib/utils'
import {
  createCatalogueItem,
  deactivateCatalogueItem,
  getCatalogueTariffHistory,
  listCatalogue,
  updateCatalogueItem,
} from '@/services/catalogueApi'
import type { CatalogueItem, CataloguePayload, CatalogueTariffHistory } from '@/types/catalogue'
import { BookOpen, Edit2, FlaskConical, History, Loader2, Plus, Power, RefreshCw, Search, X } from 'lucide-react'

const EMPTY_FORM: CataloguePayload = {
  codeElement: '',
  codeLabo: '',
  type: 'Analyse',
  nom: '',
  service: 'Laboratoire',
  montantFcfa: 0,
  hopitalId: 'HSJ-229',
  actif: true,
  metadata: {},
}

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  Analyse: { bg: 'bg-purple-50 text-purple-700 border border-purple-200', text: 'text-purple-700' },
  Consultation: { bg: 'bg-blue-50 text-blue-700 border border-blue-200', text: 'text-blue-700' },
  Medicament: { bg: 'bg-green-50 text-green-700 border border-green-200', text: 'text-green-700' },
  Acte: { bg: 'bg-amber-50 text-amber-700 border border-amber-200', text: 'text-amber-700' },
}

function itemToForm(item: CatalogueItem): CataloguePayload {
  return {
    codeElement: item.codeElement,
    codeLabo: item.codeLabo,
    type: item.type,
    nom: item.nom,
    service: item.service,
    montantFcfa: item.montantFcfa,
    hopitalId: item.hopitalId,
    actif: item.actif,
    metadata: item.metadata,
  }
}

export default function Catalogue() {
  const [items, setItems] = useState<CatalogueItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [actifFilter, setActifFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [editing, setEditing] = useState<CatalogueItem | null>(null)
  const [form, setForm] = useState<CataloguePayload>(EMPTY_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [historyItem, setHistoryItem] = useState<CatalogueItem | null>(null)
  const [history, setHistory] = useState<CatalogueTariffHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listCatalogue({
        search: query,
        type: typeFilter || undefined,
        service: serviceFilter || undefined,
        actif: actifFilter === 'all' ? undefined : actifFilter === 'active',
        pageSize: 300,
      })
      setItems(res.items)
      setTotal(res.total)
    } catch {
      setError('Impossible de charger le catalogue. Verifiez que le backend est lance.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = window.setTimeout(load, 250)
    return () => window.clearTimeout(id)
  }, [query, typeFilter, serviceFilter, actifFilter])

  const types = useMemo(() => [...new Set(items.map((i) => i.type))].sort(), [items])
  const services = useMemo(() => [...new Set(items.map((i) => i.service))].sort(), [items])
  const activeCount = items.filter((i) => i.actif).length

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (item: CatalogueItem) => {
    setEditing(item)
    setForm(itemToForm(item))
    setFormOpen(true)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateCatalogueItem(editing.id, {
          codeLabo: form.codeLabo,
          type: form.type,
          nom: form.nom,
          service: form.service,
          montantFcfa: Number(form.montantFcfa),
          hopitalId: form.hopitalId,
          actif: form.actif,
          metadata: form.metadata,
        })
      } else {
        await createCatalogueItem({
          ...form,
          montantFcfa: Number(form.montantFcfa),
        })
      }
      setFormOpen(false)
      await load()
    } catch {
      setError('Enregistrement impossible. Verifiez les champs et vos droits admin.')
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (item: CatalogueItem) => {
    setError('')
    try {
      await deactivateCatalogueItem(item.id)
      await load()
    } catch {
      setError('Desactivation impossible. Seul un admin peut modifier le catalogue.')
    }
  }

  const openHistory = async (item: CatalogueItem) => {
    setHistoryItem(item)
    setHistory([])
    setHistoryLoading(true)
    try {
      setHistory(await getCatalogueTariffHistory(item.id))
    } catch {
      setError('Historique tarifaire indisponible.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const cols: Column<CatalogueItem>[] = [
    { key: 'codeElement', label: 'Code', render: (r) => (
      <div>
        <span className="font-mono text-[12px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-lg">{r.codeElement}</span>
        {r.codeLabo && <p className="text-[10px] text-zinc-300 mt-1">{r.codeLabo}</p>}
      </div>
    ) },
    { key: 'nom', label: 'Acte / produit', render: (r) => <span className="text-[13px] font-semibold text-zinc-800">{r.nom}</span> },
    { key: 'type', label: 'Categorie', render: (r) => {
      const style = TYPE_STYLE[r.type] ?? TYPE_STYLE.Analyse
      return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${style.bg}`}><FlaskConical size={11} />{r.type}</span>
    } },
    { key: 'service', label: 'Service', render: (r) => <span className="text-[12px] text-zinc-500">{r.service}</span> },
    { key: 'montantFcfa', label: 'Prix', align: 'right', sortable: true, render: (r) => <span className="font-mono font-bold text-[13px] text-zinc-900">{formatCFA(r.montantFcfa)}</span> },
    { key: 'actif', label: 'Etat', render: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.actif ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-zinc-100 text-zinc-400'}`}>
        {r.actif ? 'Actif' : 'Inactif'}
      </span>
    ) },
    { key: 'id', label: '', render: (r) => (
      <div className="flex justify-end gap-1">
        <button onClick={() => openHistory(r)} className="p-1.5 rounded-lg text-zinc-300 hover:text-zinc-700 hover:bg-zinc-100 transition-colors" aria-label="Historique">
          <History size={13} />
        </button>
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-zinc-300 hover:text-zinc-700 hover:bg-zinc-100 transition-colors" aria-label="Modifier">
          <Edit2 size={13} />
        </button>
        {r.actif && (
          <button onClick={() => deactivate(r)} className="p-1.5 rounded-lg text-zinc-300 hover:text-red-600 hover:bg-red-50 transition-colors" aria-label="Desactiver">
            <Power size={13} />
          </button>
        )}
      </div>
    ) },
  ]

  return (
    <Layout>
      <PageHeader
        title="Catalogue des actes"
        subtitle={`${activeCount} actifs sur ${total} elements`}
        actions={
          <>
            <Btn variant="ghost" icon={RefreshCw} onClick={load} disabled={loading}>Actualiser</Btn>
            <Btn variant="primary" icon={Plus} onClick={openCreate}>Nouvel acte</Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Total</p>
          <p className="font-black text-[32px] text-zinc-900 leading-none">{total}</p>
          <p className="text-[12px] text-zinc-400 mt-1.5">elements</p>
        </div>
        {types.slice(0, 3).map((type) => {
          const style = TYPE_STYLE[type] ?? TYPE_STYLE.Analyse
          return (
            <div key={type} className="bg-white rounded-2xl border border-zinc-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={13} className={style.text} />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{type}</p>
              </div>
              <p className="font-black text-[32px] text-zinc-900 leading-none">{items.filter((i) => i.type === type).length}</p>
            </div>
          )
        })}
      </div>

      <Card padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_180px_150px] gap-3 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom, type ou service..."
              className="w-full h-10 pl-9 pr-3 rounded-xl text-[14px] border border-zinc-200 bg-zinc-50 focus:border-[#FFCB00] outline-none transition-all"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 px-3 rounded-xl text-[13px] border border-zinc-200 bg-white outline-none">
            <option value="">Tous types</option>
            {types.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="h-10 px-3 rounded-xl text-[13px] border border-zinc-200 bg-white outline-none">
            <option value="">Tous services</option>
            {services.map((service) => <option key={service} value={service}>{service}</option>)}
          </select>
          <select value={actifFilter} onChange={(e) => setActifFilter(e.target.value as 'all' | 'active' | 'inactive')} className="h-10 px-3 rounded-xl text-[13px] border border-zinc-200 bg-white outline-none">
            <option value="all">Tous etats</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>

        {error && <p className="mb-3 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-zinc-400 text-[13px]">
            <Loader2 size={16} className="animate-spin" /> Chargement du catalogue...
          </div>
        ) : (
          <DataTable<CatalogueItem>
            columns={cols}
            data={items}
            searchable={false}
            emptyMessage="Aucun element dans le catalogue"
          />
        )}
      </Card>

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={save} className="w-full max-w-2xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-zinc-900">{editing ? 'Modifier un element' : 'Nouvel element'}</h2>
                <p className="text-[12px] text-zinc-400">Seul un admin peut changer les tarifs.</p>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-700" aria-label="Fermer"><X size={16} /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-[12px] font-semibold text-zinc-500">
                Code element
                <input value={form.codeElement} onChange={(e) => setForm({ ...form, codeElement: e.target.value })} disabled={!!editing} required className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-[14px] disabled:bg-zinc-100" />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Code labo
                <input value={form.codeLabo ?? ''} onChange={(e) => setForm({ ...form, codeLabo: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-[14px]" />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500 sm:col-span-2">
                Libelle officiel
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-[14px]" />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Type
                <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-[14px]" />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Service
                <input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} required className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-[14px]" />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Prix FCFA
                <input type="number" min={0} value={form.montantFcfa} onChange={(e) => setForm({ ...form, montantFcfa: Number(e.target.value) })} required className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-[14px] font-mono" />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Hopital
                <input value={form.hopitalId} onChange={(e) => setForm({ ...form, hopitalId: e.target.value })} required className="mt-1 w-full h-10 px-3 rounded-xl border border-zinc-200 text-[14px]" />
              </label>
              <label className="sm:col-span-2 flex items-center gap-2 text-[13px] text-zinc-600">
                <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} className="accent-[#FFCB00]" />
                Element actif
              </label>
            </div>
            <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setFormOpen(false)}>Annuler</Btn>
              <Btn variant="primary" type="submit" disabled={saving} icon={saving ? Loader2 : undefined}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Btn>
            </div>
          </form>
        </div>
      )}

      {historyItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-zinc-900">Historique tarifaire</h2>
                <p className="text-[12px] text-zinc-400">{historyItem.codeElement} - {historyItem.nom}</p>
              </div>
              <button type="button" onClick={() => setHistoryItem(null)} className="p-2 text-zinc-400 hover:text-zinc-700" aria-label="Fermer"><X size={16} /></button>
            </div>
            <div className="p-5">
              {historyLoading ? (
                <p className="text-[13px] text-zinc-400">Chargement...</p>
              ) : history.length === 0 ? (
                <p className="text-[13px] text-zinc-400">Aucun changement de tarif enregistre.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="p-3 rounded-xl border border-zinc-200 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-zinc-800">
                          {formatCFA(h.ancienMontantFcfa)} {'->'} {formatCFA(h.nouveauMontantFcfa)}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {new Date(h.createdAt).toLocaleString('fr-FR')} par {h.auteurNom ?? 'Systeme'}
                        </p>
                      </div>
                      <span className={cn('text-[11px] px-2 py-1 rounded-full', h.nouveauMontantFcfa > h.ancienMontantFcfa ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700')}>
                        {h.nouveauMontantFcfa > h.ancienMontantFcfa ? 'Hausse' : 'Baisse'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
