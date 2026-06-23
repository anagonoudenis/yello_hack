import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, FileWarning, Landmark, RefreshCcw, ShieldAlert, XCircle } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { useNotification } from '@/context/NotificationContext'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { listCaisses } from '@/services/caisseApi'
import {
  createVersement,
  downloadVersementReceipt,
  getTheoreticalVersement,
  listChequePayments,
  listVersements,
  updateChequePaymentStatus,
} from '@/services/versementApi'
import type { CaisseItem } from '@/types/caisse'
import type { ChequePaymentRecord, ChequePaymentStatus, VersementRecord, VersementScope, VersementTheoretical } from '@/types/versement'


const today = new Date().toISOString().slice(0, 10)

const chequeTone: Record<ChequePaymentStatus, string> = {
  RECU: 'border-amber-200 bg-amber-50 text-amber-700',
  ENCAISSE: 'border-green-200 bg-green-50 text-green-700',
  REJETE: 'border-red-200 bg-red-50 text-red-700',
}

const scopeLabel: Record<VersementScope, string> = {
  UNIQUE: 'Par caisse',
  CONSOLIDE: 'Consolide multi-caisses',
}

export function OperationsBancaires({ role }: { role: 'superviseur' | 'admin' }) {
  const { toast } = useNotification()
  const [caisses, setCaisses] = useState<CaisseItem[]>([])
  const [cheques, setCheques] = useState<ChequePaymentRecord[]>([])
  const [versements, setVersements] = useState<VersementRecord[]>([])
  const [theoretical, setTheoretical] = useState<VersementTheoretical | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<ChequePaymentStatus | ''>('RECU')
  const [search, setSearch] = useState('')
  const [filterCaisseId, setFilterCaisseId] = useState<number | ''>('')
  const [scope, setScope] = useState<VersementScope>('UNIQUE')
  const [selectedCaisseIds, setSelectedCaisseIds] = useState<number[]>([])
  const [dateVersement, setDateVersement] = useState(today)
  const [montantEspeces, setMontantEspeces] = useState('')
  const [montantCheques, setMontantCheques] = useState('')
  const [note, setNote] = useState('')
  const [justificatif, setJustificatif] = useState<File | null>(null)

  const title = role === 'admin' ? 'Operations bancaires' : 'Versement bancaire'
  const subtitle =
    role === 'admin'
      ? 'Supervision des cheques et declaration des versements'
      : 'Confirmation des cheques et declaration des versements'

  const selectedCaisses = useMemo(
    () => caisses.filter((caisse) => selectedCaisseIds.includes(caisse.id)),
    [caisses, selectedCaisseIds]
  )

  const loadCaisses = async () => {
    const response = await listCaisses()
    setCaisses(response.items.filter((item) => item.actif))
    return response.items.filter((item) => item.actif)
  }

  const loadChequesAndVersements = async () => {
    const [chequeResponse, versementResponse] = await Promise.all([
      listChequePayments({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        caisseId: filterCaisseId || undefined,
        pageSize: 100,
      }),
      listVersements({
        caisseId: filterCaisseId || undefined,
        pageSize: 100,
      }),
    ])
    setCheques(chequeResponse.items)
    setVersements(versementResponse.items)
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const nextCaisses = await loadCaisses()
        if (!cancelled && selectedCaisseIds.length === 0 && nextCaisses.length > 0) {
          setSelectedCaisseIds([nextCaisses[0].id])
        }
        await loadChequesAndVersements()
      } catch (nextError) {
        if (!cancelled) setError(getApiErrorMessage(nextError, "Impossible de charger les operations bancaires."))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadLists = async () => {
      try {
        await loadChequesAndVersements()
      } catch (nextError) {
        if (!cancelled) setError(getApiErrorMessage(nextError, "Impossible d'actualiser les listes bancaires."))
      }
    }

    void loadLists()
    return () => {
      cancelled = true
    }
  }, [filterCaisseId, search, statusFilter])

  useEffect(() => {
    if (!selectedCaisseIds.length) {
      setTheoretical(null)
      return
    }

    let cancelled = false

    const loadTheoretical = async () => {
      try {
        const response = await getTheoreticalVersement({
          date: dateVersement,
          caisseIds: selectedCaisseIds,
        })
        if (!cancelled) setTheoretical(response)
      } catch (nextError) {
        if (!cancelled) setError(getApiErrorMessage(nextError, 'Impossible de calculer le montant theorique.'))
      }
    }

    void loadTheoretical()
    return () => {
      cancelled = true
    }
  }, [dateVersement, selectedCaisseIds])

  const toggleSelectedCaisse = (caisseId: number) => {
    if (scope === 'UNIQUE') {
      setSelectedCaisseIds([caisseId])
      return
    }

    setSelectedCaisseIds((current) =>
      current.includes(caisseId) ? current.filter((id) => id !== caisseId) : [...current, caisseId]
    )
  }

  const setScopeMode = (nextScope: VersementScope) => {
    setScope(nextScope)
    setSelectedCaisseIds((current) => {
      if (nextScope === 'UNIQUE') return current.slice(0, 1)
      return current.length ? current : caisses.slice(0, 1).map((item) => item.id)
    })
  }

  const handleChequeStatus = async (paymentId: number, statut: 'ENCAISSE' | 'REJETE') => {
    try {
      const updated = await updateChequePaymentStatus(paymentId, statut)
      toast(
        statut === 'ENCAISSE' ? 'success' : 'warning',
        statut === 'ENCAISSE' ? 'Cheque confirme' : 'Cheque rejete',
        `${updated.idVisite} · ${updated.chequeNumero}`
      )
      await loadChequesAndVersements()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de mettre a jour le statut du cheque."))
    }
  }

  const handleCreateVersement = async () => {
    if (!justificatif || !selectedCaisseIds.length) return
    setSaving(true)
    setError('')
    try {
      const created = await createVersement({
        dateVersement,
        scope,
        caisseIds: selectedCaisseIds,
        montantCompteEspecesFcfa: Number(montantEspeces || 0),
        montantRemisChequesFcfa: Number(montantCheques || 0),
        note,
        justificatif,
      })
      toast(
        created.ecartFcfa === 0 ? 'success' : 'warning',
        'Versement enregistre',
        `${created.versementId} · ${formatCFA(created.montantVerseFcfa)}`
      )
      setMontantEspeces('')
      setMontantCheques('')
      setNote('')
      setJustificatif(null)
      await Promise.all([
        loadChequesAndVersements(),
        (async () => {
          const next = await getTheoreticalVersement({ date: dateVersement, caisseIds: selectedCaisseIds })
          setTheoretical(next)
        })(),
      ])
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'enregistrer ce versement."))
    } finally {
      setSaving(false)
    }
  }

  const openReceipt = async (versementId: string) => {
    try {
      const { blob } = await downloadVersementReceipt(versementId)
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'ouvrir le justificatif de versement."))
    }
  }

  return (
    <Layout>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={(
          <Btn variant="ghost" icon={RefreshCcw} onClick={() => void loadChequesAndVersements()}>
            Actualiser
          </Btn>
        )}
      />

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50">
                <ShieldAlert size={18} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-900">Cheques a superviser</h2>
                <p className="text-[12px] text-zinc-400">Statuts reels `RECU / ENCAISSE / REJETE`</p>
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Patient, dossier, cheque..."
                className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ChequePaymentStatus | '')}
                className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
              >
                <option value="">Tous les statuts</option>
                <option value="RECU">Recu</option>
                <option value="ENCAISSE">Encaisse</option>
                <option value="REJETE">Rejete</option>
              </select>
              <select
                value={filterCaisseId}
                onChange={(event) => setFilterCaisseId(event.target.value ? Number(event.target.value) : '')}
                className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
              >
                <option value="">Toutes les caisses</option>
                {caisses.map((caisse) => (
                  <option key={caisse.id} value={caisse.id}>
                    {caisse.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="py-10 text-center text-[13px] text-zinc-400">Chargement des cheques...</p>
              ) : cheques.length === 0 ? (
                <p className="py-10 text-center text-[13px] text-zinc-400">Aucun cheque pour ces filtres.</p>
              ) : (
                cheques.map((cheque) => (
                  <div key={cheque.paymentId} className="rounded-2xl border border-zinc-200 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-semibold text-zinc-900">{cheque.patientNom}</p>
                        <p className="text-[12px] text-zinc-400">
                          {cheque.idVisite} · {cheque.patientTel} · {cheque.caisseNom || 'Aucune caisse'}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${chequeTone[cheque.statut]}`}>
                        {cheque.statut}
                      </span>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-xl bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Cheque</p>
                        <p className="font-mono text-[13px] font-bold text-zinc-800">{cheque.chequeNumero}</p>
                        <p className="text-[12px] text-zinc-500">{cheque.chequeBanque} · {cheque.chequeTitulaire}</p>
                      </div>
                      <div className="rounded-xl bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Montant</p>
                        <p className="font-mono text-[16px] font-black text-zinc-900">{formatCFA(cheque.montantFcfa)}</p>
                        <p className="text-[12px] text-zinc-500">{cheque.invoiceNumber || 'Facture a synchroniser'}</p>
                      </div>
                    </div>

                    {cheque.statut === 'RECU' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Btn variant="secondary" icon={CheckCircle2} onClick={() => void handleChequeStatus(cheque.paymentId, 'ENCAISSE')}>
                          Confirmer banque
                        </Btn>
                        <Btn variant="danger" icon={XCircle} onClick={() => void handleChequeStatus(cheque.paymentId, 'REJETE')}>
                          Rejeter le cheque
                        </Btn>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50">
                <Landmark size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-900">Declaration de versement</h2>
                <p className="text-[12px] text-zinc-400">Support unitaire et consolide avec justificatif reel</p>
              </div>
            </div>

            <div className="mb-4 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(scopeLabel) as VersementScope[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScopeMode(value)}
                    className={`h-10 rounded-xl border text-[13px] font-semibold transition-colors ${
                      scope === value
                        ? 'border-[#FFCB00] bg-[#FFFAE6] text-zinc-900'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                    }`}
                  >
                    {scopeLabel[value]}
                  </button>
                ))}
              </div>

              <input
                type="date"
                value={dateVersement}
                onChange={(event) => setDateVersement(event.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
              />

              <div className="rounded-2xl border border-zinc-200 p-3">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Caisses concernees</p>
                <div className="grid gap-2">
                  {caisses.map((caisse) => {
                    const active = selectedCaisseIds.includes(caisse.id)
                    return (
                      <button
                        key={caisse.id}
                        type="button"
                        onClick={() => toggleSelectedCaisse(caisse.id)}
                        className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                          active ? 'border-[#FFCB00] bg-[#FFFAE6]' : 'border-zinc-200 bg-zinc-50 hover:bg-white'
                        }`}
                      >
                        <p className="text-[13px] font-semibold text-zinc-800">{caisse.nom}</p>
                        <p className="text-[11px] text-zinc-400">{scope === 'UNIQUE' ? 'Selection exclusive' : 'Ajoute au versement consolide'}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Montant theorique</p>
                <p className="font-mono text-[24px] font-black text-zinc-900">
                  {formatCFA(theoretical?.montantTheoriqueFcfa || 0)}
                </p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <div className="rounded-xl bg-white px-3 py-2 text-[12px] text-zinc-600">
                    Especes: <span className="font-mono font-semibold text-zinc-900">{formatCFA(theoretical?.montantTheoriqueEspecesFcfa || 0)}</span>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 text-[12px] text-zinc-600">
                    Cheques: <span className="font-mono font-semibold text-zinc-900">{formatCFA(theoretical?.montantTheoriqueChequesFcfa || 0)}</span>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {selectedCaisses.map((caisse) => {
                    const perCaisse = theoretical?.perCaisse.find((line) => line.caisseId === caisse.id)
                    return (
                      <div key={caisse.id} className="flex justify-between text-[12px] text-zinc-500">
                        <span>{caisse.nom}</span>
                        <span className="font-mono">{formatCFA(perCaisse?.montantTheoriqueFcfa || 0)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <input
                type="number"
                min={0}
                value={montantEspeces}
                onChange={(event) => setMontantEspeces(event.target.value)}
                placeholder="Montant compte especes"
                className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-3 font-mono text-[16px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
              />
              <input
                type="number"
                min={0}
                value={montantCheques}
                onChange={(event) => setMontantCheques(event.target.value)}
                placeholder="Montant remis cheques"
                className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-3 font-mono text-[16px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
              />

              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Note eventuelle sur le versement..."
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
              />

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-zinc-300 px-3 py-3 text-[13px] text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50">
                <span>{justificatif ? justificatif.name : 'Joindre le justificatif du versement'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => setJustificatif(event.target.files?.[0] || null)}
                />
                <FileWarning size={16} />
              </label>

              <Btn
                variant="secondary"
                onClick={() => void handleCreateVersement()}
                disabled={saving || !selectedCaisseIds.length || (!montantEspeces && !montantCheques) || !justificatif}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer le versement'}
              </Btn>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-900">Historique des versements</h2>
                <p className="text-[12px] text-zinc-400">{versements.length} operation(s) enregistree(s)</p>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="py-10 text-center text-[13px] text-zinc-400">Chargement des versements...</p>
              ) : versements.length === 0 ? (
                <p className="py-10 text-center text-[13px] text-zinc-400">Aucun versement enregistre.</p>
              ) : (
                versements.map((versement) => (
                  <div key={versement.versementId} className="rounded-2xl border border-zinc-200 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-[12px] font-black text-amber-700">{versement.versementId}</p>
                        <p className="text-[12px] text-zinc-400">
                          {formatDate(versement.dateVersement)} · {scopeLabel[versement.scope]}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        versement.ecartFcfa === 0
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}>
                        {versement.ecartFcfa === 0 ? 'Sans ecart' : `${versement.ecartFcfa > 0 ? '+' : ''}${formatCFA(versement.ecartFcfa)}`}
                      </span>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-xl bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Theorique / verse</p>
                        <p className="font-mono text-[13px] font-bold text-zinc-900">
                          {formatCFA(versement.montantTheoriqueFcfa)} / {formatCFA(versement.montantVerseFcfa)}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Especes {formatCFA(versement.montantCompteEspecesFcfa)} · Cheques {formatCFA(versement.montantRemisChequesFcfa)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Justificatif</p>
                        <button
                          type="button"
                          onClick={() => void openReceipt(versement.versementId)}
                          className="inline-flex items-center gap-2 text-[13px] font-semibold text-blue-700 hover:text-blue-800"
                        >
                          <Download size={14} />
                          {versement.justificatifFilename}
                        </button>
                      </div>
                    </div>

                    {versement.note && <p className="mt-3 text-[12px] text-zinc-500">{versement.note}</p>}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
