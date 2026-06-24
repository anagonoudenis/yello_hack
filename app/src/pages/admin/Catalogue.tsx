import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Btn, PageHeader, StatCard } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { RowActionsMenu } from '@/components/shared/RowActionsMenu'
import { Card } from '@/components/ui/Card'
import { formatCFA } from '@/lib/formatCFA'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  createCatalogueItem,
  deactivateCatalogueItem,
  deleteCatalogueItem,
  getCatalogueTariffHistory,
  listCatalogue,
  updateCatalogueItem,
} from '@/services/catalogueApi'
import type { CatalogueItem, CataloguePayload, CatalogueTariffHistory, ProductCategory } from '@/types/catalogue'
import { BookOpen, Edit2, FlaskConical, History, Loader2, Plus, Power, RefreshCw, Search, Trash2, X } from 'lucide-react'


const CATEGORY_LABELS: Record<ProductCategory, string> = {
  CONSOMMABLE_MEDICAL: 'Consommable medical',
  DISPOSITIF_MEDICAL: 'Dispositif medical',
  MEDICAMENT: 'Medicament',
}

const EMPTY_FORM: CataloguePayload = {
  codeElement: '',
  codeLabo: '',
  type: 'Analyse',
  nom: '',
  service: 'Laboratoire',
  montantFcfa: 0,
  hopitalId: 'HSJ-229',
  specialites: '',
  formeGalenique: '',
  classePharmacologique: '',
  categorieProduit: null,
  dateExpiration: null,
  quantiteStock: 0,
  actif: true,
  metadata: {},
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
    specialites: item.specialites,
    formeGalenique: item.formeGalenique,
    classePharmacologique: item.classePharmacologique,
    categorieProduit: item.categorieProduit,
    dateExpiration: item.dateExpiration,
    quantiteStock: item.quantiteStock,
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
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'managed' | 'out' | 'expired'>('all')
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
        search: query || undefined,
        type: typeFilter || undefined,
        service: serviceFilter || undefined,
        actif: actifFilter === 'all' ? undefined : actifFilter === 'active',
        categorieProduit: categoryFilter === 'all' ? undefined : categoryFilter,
        stockManaged: stockFilter === 'managed' ? true : undefined,
        outOfStock: stockFilter === 'out' ? true : undefined,
        expired: stockFilter === 'expired' ? true : undefined,
        pageSize: 300,
      })
      setItems(res.items)
      setTotal(res.total)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Impossible de charger le catalogue.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load()
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [query, typeFilter, serviceFilter, categoryFilter, stockFilter, actifFilter])

  const types = useMemo(() => [...new Set(items.map((item) => item.type))].sort(), [items])
  const services = useMemo(() => [...new Set(items.map((item) => item.service))].sort(), [items])
  const managedItems = items.filter((item) => item.stockManaged)
  const ruptureCount = managedItems.filter((item) => item.quantiteStock <= 0).length
  const expiredCount = managedItems.filter((item) => item.dateExpiration && new Date(item.dateExpiration) <= new Date()).length
  const isAnalyseType = form.type.trim().toLowerCase() === 'analyse'
  const isPharmaProduct = Boolean(form.categorieProduit)

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
          specialites: form.specialites,
          formeGalenique: form.formeGalenique,
          classePharmacologique: form.classePharmacologique,
          categorieProduit: form.categorieProduit,
          dateExpiration: form.dateExpiration,
          actif: form.actif,
          metadata: form.metadata,
        })
      } else {
        await createCatalogueItem({
          ...form,
          montantFcfa: Number(form.montantFcfa),
          quantiteStock: Number(form.quantiteStock ?? 0),
        })
      }
      setFormOpen(false)
      await load()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Enregistrement impossible.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (item: CatalogueItem) => {
    setError('')
    try {
      await deactivateCatalogueItem(item.id)
      await load()
    } catch (deactivateError) {
      setError(getApiErrorMessage(deactivateError, 'Desactivation impossible.'))
    }
  }

  const handleDelete = async (item: CatalogueItem) => {
    setError('')
    try {
      await deleteCatalogueItem(item.id)
      await load()
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'Suppression physique impossible.'))
    }
  }

  const openHistory = async (item: CatalogueItem) => {
    setHistoryItem(item)
    setHistory([])
    setHistoryLoading(true)
    try {
      setHistory(await getCatalogueTariffHistory(item.id))
    } catch (historyError) {
      setError(getApiErrorMessage(historyError, 'Historique tarifaire indisponible.'))
    } finally {
      setHistoryLoading(false)
    }
  }

  const columns: Column<CatalogueItem>[] = useMemo(() => [
    {
      key: 'codeElement',
      label: 'Code',
      render: (row) => (
        <span className="rounded-lg bg-zinc-100 px-2 py-0.5 font-mono text-[12px] font-semibold text-zinc-500">
          {row.codeElement}
        </span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom',
      render: (row) => <span className="text-[13px] font-semibold text-zinc-800">{row.nom}</span>,
    },
    {
      key: 'montantFcfa',
      label: 'Prix',
      align: 'right',
      sortable: true,
      render: (row) => <span className="font-mono text-[13px] font-bold text-zinc-900">{formatCFA(row.montantFcfa)}</span>,
    },
    {
      key: 'actif',
      label: 'Etat',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.actif ? 'border border-green-200 bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'}`}>
          {row.actif ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <RowActionsMenu
          actions={[
            { label: 'Historique tarifaire', icon: History, onSelect: () => openHistory(row) },
            { label: 'Modifier', icon: Edit2, onSelect: () => { openEdit(row) } },
            { label: 'Desactiver', icon: Power, tone: 'danger', hidden: !row.actif, onSelect: () => handleDeactivate(row) },
            { label: 'Supprimer', icon: Trash2, tone: 'danger', onSelect: () => handleDelete(row) },
          ]}
        />
      ),
    },
  ], [])

  return (
    <Layout>
      <PageHeader
        title="Catalogue des actes et produits"
        subtitle={`${items.filter((item) => item.actif).length} actifs sur ${total} elements`}
        actions={(
          <>
            <Btn variant="ghost" icon={RefreshCw} onClick={() => void load()} disabled={loading}>
              Actualiser
            </Btn>
            <Btn variant="primary" icon={Plus} onClick={openCreate}>
              Nouvel element
            </Btn>
          </>
        )}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={total} sub="elements catalogue" icon={BookOpen} accent />
        <StatCard label="Stock gere" value={managedItems.length} sub="produits pharma" icon={FlaskConical} />
        <StatCard label="Rupture" value={ruptureCount} sub="stock nul ou negatif" icon={Power} />
        <StatCard label="Expires" value={expiredCount} sub="date depassee" icon={History} />
      </div>

      <Card padding="sm">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_150px_170px_190px_160px_150px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par nom, type, service ou code..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
            />
          </div>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none">
            <option value="">Tous types</option>
            {types.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none">
            <option value="">Tous services</option>
            {services.map((service) => <option key={service} value={service}>{service}</option>)}
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as 'all' | ProductCategory)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none">
            <option value="all">Toutes categories</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as 'all' | 'managed' | 'out' | 'expired')} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none">
            <option value="all">Tout stock</option>
            <option value="managed">Stock gere</option>
            <option value="out">Rupture</option>
            <option value="expired">Expires</option>
          </select>
          <select value={actifFilter} onChange={(event) => setActifFilter(event.target.value as 'all' | 'active' | 'inactive')} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none">
            <option value="all">Tous etats</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-zinc-400">
            <Loader2 size={16} className="animate-spin" />
            Chargement du catalogue...
          </div>
        ) : (
          <DataTable<CatalogueItem>
            columns={columns}
            data={items}
            searchable={false}
            emptyMessage="Aucun element dans le catalogue"
          />
        )}
      </Card>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={save} className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-[16px] font-bold text-zinc-900">{editing ? 'Modifier un element' : 'Nouvel element'}</h2>
                <p className="text-[12px] text-zinc-400">
                  Les tarifs restent admin-only. Les corrections de stock passent par la page stock.
                </p>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-700" aria-label="Fermer">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <label className="text-[12px] font-semibold text-zinc-500">
                Code element
                <input value={form.codeElement} onChange={(event) => setForm({ ...form, codeElement: event.target.value })} disabled={Boolean(editing)} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] disabled:bg-zinc-100" />
              </label>
              {isAnalyseType && (
                <label className="text-[12px] font-semibold text-zinc-500">
                  Code labo
                  <input value={form.codeLabo ?? ''} onChange={(event) => setForm({ ...form, codeLabo: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
                </label>
              )}
              <label className="text-[12px] font-semibold text-zinc-500 sm:col-span-2">
                Libelle officiel
                <input value={form.nom} onChange={(event) => setForm({ ...form, nom: event.target.value })} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Type
                <input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Service
                <input value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Categorie produit
                <select
                  value={form.categorieProduit ?? ''}
                  onChange={(event) => {
                    const nextCategory = event.target.value ? event.target.value as ProductCategory : null
                    setForm({
                      ...form,
                      categorieProduit: nextCategory,
                      ...(nextCategory ? {} : {
                        dateExpiration: null,
                        specialites: '',
                        formeGalenique: '',
                        classePharmacologique: '',
                        quantiteStock: editing ? form.quantiteStock : 0,
                      }),
                    })
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none"
                >
                  <option value="">Aucune</option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Prix FCFA
                <input type="number" min={0} value={form.montantFcfa} onChange={(event) => setForm({ ...form, montantFcfa: Number(event.target.value) })} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 font-mono text-[14px]" />
              </label>
              {isPharmaProduct && (
                <>
                  <label className="text-[12px] font-semibold text-zinc-500">
                    Date expiration
                    <input type="date" value={form.dateExpiration ?? ''} onChange={(event) => setForm({ ...form, dateExpiration: event.target.value || null })} className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
                  </label>
                  <label className="text-[12px] font-semibold text-zinc-500">
                    {editing ? 'Stock courant' : 'Stock initial'}
                    <input
                      type="number"
                      min={0}
                      value={form.quantiteStock ?? 0}
                      onChange={(event) => setForm({ ...form, quantiteStock: Number(event.target.value) })}
                      disabled={Boolean(editing)}
                      className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 font-mono text-[14px] disabled:bg-zinc-100"
                    />
                  </label>
                  <label className="text-[12px] font-semibold text-zinc-500">
                    Specialites
                    <input value={form.specialites ?? ''} onChange={(event) => setForm({ ...form, specialites: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
                  </label>
                  <label className="text-[12px] font-semibold text-zinc-500">
                    Forme galenique
                    <input value={form.formeGalenique ?? ''} onChange={(event) => setForm({ ...form, formeGalenique: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
                  </label>
                  <label className="text-[12px] font-semibold text-zinc-500 sm:col-span-2">
                    Classe pharmacologique
                    <input value={form.classePharmacologique ?? ''} onChange={(event) => setForm({ ...form, classePharmacologique: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
                  </label>
                </>
              )}
              {editing && (
                <label className="sm:col-span-2 flex items-center gap-2 text-[13px] text-zinc-600">
                  <input type="checkbox" checked={form.actif} onChange={(event) => setForm({ ...form, actif: event.target.checked })} className="accent-[#FFCB00]" />
                  Element actif
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-5 py-4">
              <Btn variant="ghost" onClick={() => setFormOpen(false)}>Annuler</Btn>
              <Btn variant="primary" type="submit" disabled={saving} icon={saving ? Loader2 : undefined}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Btn>
            </div>
          </form>
        </div>
      )}

      {historyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-[16px] font-bold text-zinc-900">Historique tarifaire</h2>
                <p className="text-[12px] text-zinc-400">{historyItem.codeElement} - {historyItem.nom}</p>
              </div>
              <button type="button" onClick={() => setHistoryItem(null)} className="p-2 text-zinc-400 hover:text-zinc-700" aria-label="Fermer">
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              {historyLoading ? (
                <p className="text-[13px] text-zinc-400">Chargement...</p>
              ) : history.length === 0 ? (
                <p className="text-[13px] text-zinc-400">Aucun changement de tarif enregistre.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3">
                      <div>
                        <p className="text-[13px] font-semibold text-zinc-800">
                          {formatCFA(entry.ancienMontantFcfa)} {'->'} {formatCFA(entry.nouveauMontantFcfa)}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {new Date(entry.createdAt).toLocaleString('fr-FR')} par {entry.auteurNom ?? 'Systeme'}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[11px] ${
                        entry.nouveauMontantFcfa > entry.ancienMontantFcfa
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-green-50 text-green-700'
                      }`}>
                        {entry.nouveauMontantFcfa > entry.ancienMontantFcfa ? 'Hausse' : 'Baisse'}
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
