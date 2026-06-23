import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn, StatCard } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { createCaisse, deactivateCaisse, listCaisses, updateCaisse } from '@/services/caisseApi'
import type { CaisseItem, CaissePayload } from '@/types/caisse'
import { getApiErrorMessage } from '@/lib/apiError'
import { Building2, Edit2, Loader2, Plus, Power, RefreshCw, ShieldCheck, X } from 'lucide-react'


const EMPTY_FORM: CaissePayload = {
  nom: '',
  actif: true,
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function Caisses() {
  const [caisses, setCaisses] = useState<CaisseItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CaisseItem | null>(null)
  const [form, setForm] = useState<CaissePayload>(EMPTY_FORM)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listCaisses()
      setCaisses(res.items)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Impossible de charger les caisses.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (item: CaisseItem) => {
    setEditing(item)
    setForm({
      nom: item.nom,
      actif: item.actif,
    })
    setFormOpen(true)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateCaisse(editing.id, form)
      } else {
        await createCaisse(form)
      }
      setFormOpen(false)
      await load()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Enregistrement de la caisse impossible.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (item: CaisseItem) => {
    setError('')
    try {
      await deactivateCaisse(item.id)
      await load()
    } catch (deactivateError) {
      setError(getApiErrorMessage(deactivateError, 'Desactivation de la caisse impossible.'))
    }
  }

  const activeCount = caisses.filter((item) => item.actif).length
  const inactiveCount = caisses.length - activeCount

  const columns: Column<CaisseItem>[] = useMemo(() => [
    {
      key: 'nom',
      label: 'Caisse',
      render: (row) => (
        <div>
          <p className="text-[13px] font-semibold text-zinc-900">{row.nom}</p>
          <p className="text-[11px] text-zinc-400">#{row.id}</p>
        </div>
      ),
    },
    {
      key: 'actif',
      label: 'Etat',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.actif ? 'border border-green-200 bg-green-50 text-green-700' : 'border border-zinc-200 bg-zinc-100 text-zinc-500'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${row.actif ? 'bg-green-500' : 'bg-zinc-400'}`} />
          {row.actif ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Creation',
      render: (row) => <span className="text-[12px] text-zinc-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'updatedAt',
      label: 'Mise a jour',
      render: (row) => <span className="text-[12px] text-zinc-500">{formatDate(row.updatedAt)}</span>,
    },
    {
      key: 'id',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Modifier la caisse"
          >
            <Edit2 size={13} />
          </button>
          {row.actif && (
            <button
              type="button"
              onClick={() => void handleDeactivate(row)}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Desactiver la caisse"
            >
              <Power size={13} />
            </button>
          )}
        </div>
      ),
    },
  ], [])

  return (
    <Layout>
      <PageHeader
        title="Gestion des caisses"
        subtitle={`${activeCount} actives sur ${caisses.length} caisses`}
        actions={(
          <>
            <Btn variant="ghost" icon={RefreshCw} onClick={() => void load()} disabled={loading}>
              Actualiser
            </Btn>
            <Btn variant="primary" icon={Plus} onClick={openCreate}>
              Nouvelle caisse
            </Btn>
          </>
        )}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={caisses.length} sub="caisses reelles" icon={Building2} accent />
        <StatCard label="Actives" value={activeCount} sub="postes disponibles" icon={ShieldCheck} />
        <StatCard label="Inactives" value={inactiveCount} sub="hors service" icon={Power} />
      </div>

      <Card padding="sm">
        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-zinc-400">
            <Loader2 size={16} className="animate-spin" />
            Chargement des caisses...
          </div>
        ) : (
          <DataTable<CaisseItem>
            columns={columns}
            data={caisses}
            searchable
            searchKeys={['nom']}
            emptyMessage="Aucune caisse enregistree"
          />
        )}
      </Card>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={save}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-[16px] font-bold text-zinc-900">
                  {editing ? 'Modifier la caisse' : 'Nouvelle caisse'}
                </h2>
                <p className="text-[12px] text-zinc-400">Le nom doit rester unique.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              <label className="text-[12px] font-semibold text-zinc-500">
                Nom de la caisse
                <input
                  value={form.nom}
                  onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                />
              </label>

              <label className="flex items-center gap-2 text-[13px] text-zinc-600">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(event) => setForm((current) => ({ ...current, actif: event.target.checked }))}
                  className="accent-[#FFCB00]"
                />
                Caisse active
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-5 py-4">
              <Btn variant="ghost" onClick={() => setFormOpen(false)}>
                Annuler
              </Btn>
              <Btn variant="primary" type="submit" disabled={saving} icon={saving ? Loader2 : undefined}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Btn>
            </div>
          </form>
        </div>
      )}
    </Layout>
  )
}
