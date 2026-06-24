import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { listDossiers } from '@/services/transactionApi'
import type { DossierSummaryRecord } from '@/types/transaction'

const financialStatusVariant = (status: DossierSummaryRecord['financialStatus']) => {
  if (status === 'SOLDE') return 'solde'
  if (status === 'TENTATIVE_NON_ABOUTIE') return 'tentative'
  return 'non_solde'
}

export default function Historique() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const querySearch = searchParams.get('q') ?? ''
  const [items, setItems] = useState<DossierSummaryRecord[]>([])
  const [search, setSearch] = useState(querySearch)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDossiers = async (nextSearch = querySearch) => {
    setLoading(true)
    setError('')
    try {
      const response = await listDossiers(nextSearch || undefined)
      setItems(response.items)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de charger l'historique des dossiers."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSearch(querySearch)
  }, [querySearch])

  useEffect(() => {
    void loadDossiers(querySearch)
  }, [querySearch])

  useEffect(() => {
    const trimmedSearch = search.trim()
    if (trimmedSearch === querySearch) return

    const timeoutId = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams)

      if (trimmedSearch) {
        nextParams.set('q', trimmedSearch)
      } else {
        nextParams.delete('q')
      }

      setSearchParams(nextParams)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [search, querySearch, searchParams, setSearchParams])

  const openDetail = (dossierId: string) => {
    const encodedDossierId = encodeURIComponent(dossierId)
    const querySuffix = querySearch ? `?q=${encodeURIComponent(querySearch)}` : ''
    navigate(`/caissier/historique/dossiers/${encodedDossierId}${querySuffix}`)
  }

  return (
    <Layout>
      <PageHeader
        title="Historique dossiers"
        subtitle="Suivi patient et vision financiere par dossier"
        actions={<Btn variant="secondary" onClick={() => void loadDossiers()} disabled={loading}>Actualiser</Btn>}
      />

      <Card className="mb-5">
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="VIS, HOSP, patient, telephone..."
            className="h-10 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
          />
        </div>
      </Card>

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Dossier</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Patient</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Statut financier</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Total</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Paye</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Reste</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Dernier encaissement</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[13px] text-zinc-400">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[13px] text-zinc-400">Aucun dossier trouve.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.dossierId} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70">
                    <td className="px-4 py-3">
                      <p className="font-mono text-[12px] font-black text-amber-700">{item.dossierId}</p>
                      <p className="text-[11px] text-zinc-400">{item.visitId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-zinc-800">{item.patientNom}</p>
                      <p className="text-[11px] text-zinc-400">{item.patientTel}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-zinc-700">{item.dossierType}</td>
                    <td className="px-4 py-3"><StatusBadge variant={financialStatusVariant(item.financialStatus)} /></td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] font-bold text-zinc-900">{formatCFA(item.montantTotalFcfa)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] font-bold text-emerald-700">{formatCFA(item.montantTotalPayeFcfa)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] font-bold text-red-600">{formatCFA(item.montantRestantFcfa)}</td>
                    <td className="px-4 py-3 text-[12px] text-zinc-500">{item.dernierEncaissementAt ? formatDate(item.dernierEncaissementAt) : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <Btn variant="ghost" onClick={() => openDetail(item.dossierId)}>
                        Voir detail
                      </Btn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  )
}
