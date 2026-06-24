import { useEffect, useState } from 'react'
import { Download, ScrollText } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatDate } from '@/lib/formatDate'
import { exportAuditLogs, listAuditLogs } from '@/services/auditApi'
import type { AuditLogRecord } from '@/types/audit'


export function AuditJournalPage({ role }: { role: 'auditeur' | 'admin' }) {
  const [items, setItems] = useState<AuditLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actorRole, setActorRole] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listAuditLogs({ search: search.trim() || undefined, actorRole: actorRole || undefined, pageSize: 200 })
      setItems(response.items)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de charger le journal d'audit."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [search, actorRole])

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await exportAuditLogs(format, { search: search.trim() || undefined, actor_role: actorRole || undefined })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `journal-audit.${format}`
      link.click()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'exporter le journal d'audit."))
    }
  }

  return (
    <Layout>
      <PageHeader title="Journal d'audit" subtitle={role === 'admin' ? "Traçabilité administrative append-only." : "Traçabilité append-only de l'ensemble des opérations."} />

      {error && <Card className="mb-5 border border-red-200 bg-red-50"><p className="text-[13px] text-red-600">{error}</p></Card>}

      <div className="mb-5 flex flex-wrap gap-2">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Action, acteur, entite..." className="h-10 w-72 rounded-xl border border-zinc-200 bg-white px-3 text-[13px]" />
        <select value={actorRole} onChange={(event) => setActorRole(event.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px]">
          <option value="">Tous les roles</option>
          <option value="admin">Admin</option>
          <option value="superviseur">Superviseur</option>
          <option value="caissier">Caissier</option>
          <option value="accueil">Accueil</option>
          <option value="auditeur">Auditeur</option>
          <option value="recouvrement">Recouvrement</option>
        </select>
        <button onClick={() => void handleExport('csv')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700"><Download size={14} /> CSV</button>
        <button onClick={() => void handleExport('xlsx')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700"><Download size={14} /> XLSX</button>
      </div>

      <Card padding="none">
        <div className="border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50"><ScrollText size={16} className="text-zinc-600" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">{items.length} entree(s)</h2>
              <p className="text-[12px] text-zinc-400">Aucune suppression ni edition n'est autorisee sur ce journal.</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-zinc-100">
          {loading ? (
            <p className="px-6 py-12 text-center text-[13px] text-zinc-400">Chargement du journal...</p>
          ) : items.length === 0 ? (
            <p className="px-6 py-12 text-center text-[13px] text-zinc-400">Aucune ligne d'audit pour ces filtres.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">{item.actionCode}</span>
                  <span className="text-[12px] text-zinc-500">{item.actorNom || 'Systeme'} · {item.actorRole || '-'}</span>
                </div>
                <p className="text-[14px] font-semibold text-zinc-900">{item.actionLabel}</p>
                <p className="mt-1 text-[12px] text-zinc-500">{item.entityType} · {item.entityId}</p>
                <p className="mt-2 text-[11px] text-zinc-400">{formatDate(item.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </Layout>
  )
}
