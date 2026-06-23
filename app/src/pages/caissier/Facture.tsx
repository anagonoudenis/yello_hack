import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, Search, Send } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { useNotification } from '@/context/NotificationContext'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { getInvoice, listInvoices, openInvoicePdf, resendInvoiceSms } from '@/services/invoiceApi'
import type { InvoiceRecord, InvoiceSmsStatus, InvoiceStatus } from '@/types/invoice'


const statusTone: Record<InvoiceStatus, string> = {
  EMISE: 'border-green-200 bg-green-50 text-green-700',
  EN_ATTENTE_CONFIRMATION_BANCAIRE: 'border-amber-200 bg-amber-50 text-amber-700',
  CHEQUE_REJETE: 'border-red-200 bg-red-50 text-red-700',
}

const smsTone: Record<InvoiceSmsStatus, string> = {
  A_ENVOYER: 'border-zinc-200 bg-zinc-50 text-zinc-600',
  ENVOYE: 'border-green-200 bg-green-50 text-green-700',
  ECHEC: 'border-red-200 bg-red-50 text-red-700',
  LOCAL_LOG: 'border-blue-200 bg-blue-50 text-blue-700',
}

const methodLabel: Record<InvoiceRecord['moyenPaiement'], string> = {
  MOBILE_MONEY: 'Mobile Money',
  ESPECES: 'Especes',
  CHEQUE: 'Cheque',
}

const statusLabel: Record<InvoiceStatus, string> = {
  EMISE: 'Emise',
  EN_ATTENTE_CONFIRMATION_BANCAIRE: 'En attente bancaire',
  CHEQUE_REJETE: 'Cheque rejete',
}

const smsLabel: Record<InvoiceSmsStatus, string> = {
  A_ENVOYER: 'A envoyer',
  ENVOYE: 'Envoye',
  ECHEC: 'Echec',
  LOCAL_LOG: 'Journal local',
}

export default function Facture() {
  const { toast } = useNotification()
  const [items, setItems] = useState<InvoiceRecord[]>([])
  const [selected, setSelected] = useState<InvoiceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [smsLoading, setSmsLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<InvoiceRecord['moyenPaiement'] | ''>('')
  const [status, setStatus] = useState<InvoiceStatus | ''>('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await listInvoices({
          search: search.trim() || undefined,
          paymentMethod: paymentMethod || undefined,
          status: status || undefined,
          pageSize: 200,
        })
        if (cancelled) return
        setItems(response.items)
        setSelected((current) => {
          if (!response.items.length) return null
          if (current) {
            const nextSelected = response.items.find((item) => item.numeroFacture === current.numeroFacture)
            if (nextSelected) return nextSelected
          }
          return response.items[0]
        })
      } catch (nextError) {
        if (!cancelled) setError(getApiErrorMessage(nextError, 'Impossible de charger les factures.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [paymentMethod, search, status])

  const openInvoiceDetail = async (invoice: InvoiceRecord) => {
    setSelected(invoice)
    setDetailLoading(true)
    try {
      const detail = await getInvoice(invoice.numeroFacture)
      setSelected(detail)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Impossible de charger le detail de la facture.'))
    } finally {
      setDetailLoading(false)
    }
  }

  const handleOpenPdf = async () => {
    if (!selected) return
    setPdfLoading(true)
    try {
      await openInvoicePdf(selected.numeroFacture)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'ouvrir le PDF de la facture."))
    } finally {
      setPdfLoading(false)
    }
  }

  const handleResendSms = async () => {
    if (!selected) return
    setSmsLoading(true)
    try {
      const updated = await resendInvoiceSms(selected.numeroFacture)
      setSelected(updated)
      setItems((current) => current.map((item) => (item.numeroFacture === updated.numeroFacture ? updated : item)))
      if (updated.smsStatus === 'ENVOYE') {
        toast('success', 'SMS envoye', `${updated.numeroFacture} transmis au patient.`)
      } else if (updated.smsStatus === 'LOCAL_LOG') {
        toast('info', 'SMS journalise localement', `${updated.numeroFacture} est pret pour un envoi reel avec Brevo.`)
      } else {
        toast('warning', 'Envoi SMS echoue', updated.smsError || 'Brevo a refuse la tentative.')
      }
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de renvoyer le SMS de facture."))
    } finally {
      setSmsLoading(false)
    }
  }

  return (
    <Layout>
      <PageHeader title="Factures" subtitle="PDF reel, lien public tokenise et suivi SMS" />

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card padding="none">
          <div className="space-y-3 border-b border-zinc-100 p-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Facture, dossier, patient..."
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as InvoiceRecord['moyenPaiement'] | '')}
                className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
              >
                <option value="">Tous les modes</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="ESPECES">Especes</option>
                <option value="CHEQUE">Cheque</option>
              </select>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as InvoiceStatus | '')}
                className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
              >
                <option value="">Tous les statuts</option>
                <option value="EMISE">Emise</option>
                <option value="EN_ATTENTE_CONFIRMATION_BANCAIRE">En attente</option>
                <option value="CHEQUE_REJETE">Cheque rejete</option>
              </select>
            </div>
          </div>

          <div className="max-h-[620px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-10 text-center text-[13px] text-zinc-400">Chargement des factures...</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-zinc-400">Aucune facture pour ces filtres.</p>
            ) : (
              items.map((invoice) => (
                <button
                  key={invoice.numeroFacture}
                  onClick={() => void openInvoiceDetail(invoice)}
                  className={`w-full border-b border-zinc-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-zinc-50 ${
                    selected?.numeroFacture === invoice.numeroFacture ? 'bg-[#FFFAE6]' : ''
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] font-black text-amber-700">{invoice.numeroFacture}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone[invoice.statutDocument]}`}>
                      {statusLabel[invoice.statutDocument]}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-zinc-800">{invoice.patientNom}</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-[12px] text-zinc-400">
                      {invoice.visitId} · {methodLabel[invoice.moyenPaiement]}
                    </p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${smsTone[invoice.smsStatus]}`}>
                      {smsLabel[invoice.smsStatus]}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card>
          {!selected ? (
            <div className="py-16 text-center text-[13px] text-zinc-400">Selectionnez une facture pour afficher son detail.</div>
          ) : (
            <>
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-zinc-100 pb-5">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] font-black text-amber-700">{selected.numeroFacture}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusTone[selected.statutDocument]}`}>
                      {statusLabel[selected.statutDocument]}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${smsTone[selected.smsStatus]}`}>
                      SMS {smsLabel[selected.smsStatus]}
                    </span>
                  </div>
                  <p className="text-[16px] font-bold text-zinc-900">{selected.patientNom}</p>
                  <p className="text-[12px] text-zinc-400">
                    {selected.patientTel} · {selected.visitId}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => void handleOpenPdf()}
                    disabled={pdfLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
                  >
                    {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                    Voir PDF
                  </button>
                  <button
                    onClick={() => void handleResendSms()}
                    disabled={smsLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#FFCB00] px-4 py-2 text-[13px] font-semibold text-zinc-900 transition-colors hover:bg-[#f0c100] disabled:opacity-60"
                  >
                    {smsLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Renvoyer SMS
                  </button>
                </div>
              </div>

              {detailLoading && (
                <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] text-zinc-500">
                  Actualisation du detail facture...
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Mode de paiement</p>
                  <p className="text-[14px] font-semibold text-zinc-800">{methodLabel[selected.moyenPaiement]}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Reference</p>
                  <p className="font-mono text-[13px] font-semibold text-zinc-700">{selected.reference || '-'}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Date d'emission</p>
                  <p className="text-[13px] text-zinc-700">{formatDate(selected.createdAt)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Dernier envoi SMS</p>
                  <p className="text-[13px] text-zinc-700">{selected.smsSentAt ? formatDate(selected.smsSentAt) : '-'}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Mention de paiement</p>
                  <p className="text-[14px] leading-relaxed text-zinc-700">
                    {selected.mentionPaiement || 'Aucune mention supplementaire pour cette facture.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Lien public patient</p>
                  <p className="break-all text-[12px] leading-relaxed text-zinc-600">{selected.publicDownloadUrl}</p>
                  {selected.smsError && (
                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
                      {selected.smsError}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </Layout>
  )
}
