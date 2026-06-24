import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Btn, PageHeader, StatCard } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StockMovementDialog } from '@/components/shared/StockMovementDialog'
import { Card } from '@/components/ui/Card'
import { formatCFA } from '@/lib/formatCFA'
import { getApiErrorMessage } from '@/lib/apiError'
import { listCatalogue } from '@/services/catalogueApi'
import { createStockMovement, listStockMovements } from '@/services/stockApi'
import type { CatalogueItem } from '@/types/catalogue'
import type {
  StockMovementCreatePayload,
  StockMovementRecord,
  StockMovementType,
} from '@/types/stock'
import { Activity, ArrowDown, ArrowUp, Boxes, Loader2, RefreshCw, Search } from 'lucide-react'

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatSourceType(value: StockMovementSourceType) {
  switch (value) {
    case 'MANUAL':
      return 'Manuel'
    case 'PRODUCT_CREATION':
      return 'Creation produit'
    case 'TRANSACTION_PAYMENT_FINALIZATION':
      return 'Paiement finalise'
    case 'BENIN_SEED':
      return 'Seed Benin'
    default:
      return value
  }
}

export default function StockPharmacieMouvements() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCatalogueItemId = Number(searchParams.get('catalogueItemId') || 0) || undefined

  const [items, setItems] = useState<CatalogueItem[]>([])
  const [movements, setMovements] = useState<StockMovementRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [savingMovement, setSavingMovement] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | StockMovementType>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogItemId, setDialogItemId] = useState<number | undefined>(selectedCatalogueItemId)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const loadItems = async () => {
    try {
      const res = await listCatalogue({
        stockManaged: true,
        pageSize: 300,
      })
      setItems(res.items)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Impossible de charger les produits stockes.'))
    }
  }

  const loadMovements = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listStockMovements({
        catalogueItemId: selectedCatalogueItemId,
        movementType: movementTypeFilter === 'all' ? undefined : movementTypeFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        pageSize: 300,
      })
      setMovements(res.items)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Impossible de charger les mouvements de stock.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [])

  useEffect(() => {
    void loadMovements()
  }, [selectedCatalogueItemId, movementTypeFilter, dateFrom, dateTo])

  useEffect(() => {
    setDialogItemId(selectedCatalogueItemId)
  }, [selectedCatalogueItemId])

  const filteredMovements = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return movements.filter((movement) => {
      const textMatch = !normalized
        ? true
        : [
            movement.catalogueItemNom,
            movement.codeElement,
            movement.motif,
            movement.auteurNom ?? '',
            formatSourceType(movement.sourceType),
          ].some((value) => value.toLowerCase().includes(normalized))
      return textMatch
    })
  }, [movements, query])

  const selectedItem = items.find((item) => item.id === selectedCatalogueItemId) ?? null
  const totalEntries = filteredMovements.filter((movement) => movement.movementType === 'ENTREE').length
  const totalSorties = filteredMovements.filter((movement) => movement.movementType === 'SORTIE').length
  const totalAdjustments = filteredMovements.filter((movement) => movement.movementType === 'AJUSTEMENT').length

  const handleSaveMovement = async (payload: StockMovementCreatePayload) => {
    setSavingMovement(true)
    setError('')
    try {
      await createStockMovement(payload)
      setDialogOpen(false)
      await Promise.all([loadItems(), loadMovements()])
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Mouvement de stock impossible.'))
    } finally {
      setSavingMovement(false)
    }
  }

  const movementColumns: Column<StockMovementRecord>[] = useMemo(() => [
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => <span className="text-[12px] text-zinc-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'catalogueItemNom',
      label: 'Produit',
      render: (row) => (
        <div>
          <p className="text-[13px] font-semibold text-zinc-900">{row.catalogueItemNom}</p>
          <p className="text-[11px] text-zinc-400">{row.codeElement}</p>
        </div>
      ),
    },
    {
      key: 'movementType',
      label: 'Mouvement',
      render: (row) => <span className="text-[12px] font-semibold text-zinc-700">{row.movementType}</span>,
    },
    {
      key: 'sourceType',
      label: 'Source',
      render: (row) => <span className="text-[12px] text-zinc-500">{formatSourceType(row.sourceType)}</span>,
    },
    {
      key: 'quantity',
      label: 'Variation',
      align: 'right',
      render: (row) => <span className="font-mono text-[12px] font-semibold text-zinc-700">{row.quantity}</span>,
    },
    {
      key: 'quantityAfter',
      label: 'Stock apres',
      align: 'right',
      render: (row) => (
        <span className={`font-mono text-[12px] font-bold ${
          row.quantityAfter < 0 ? 'text-red-600' : row.quantityAfter === 0 ? 'text-amber-600' : 'text-zinc-800'
        }`}>
          {row.quantityAfter}
        </span>
      ),
    },
    {
      key: 'motif',
      label: 'Motif',
      render: (row) => <span className="text-[12px] text-zinc-500">{row.motif}</span>,
    },
    {
      key: 'auteurNom',
      label: 'Auteur',
      render: (row) => <span className="text-[12px] text-zinc-500">{row.auteurNom ?? '-'}</span>,
    },
  ], [])

  return (
    <Layout>
      <PageHeader
        title="Stock pharmacie · Mouvements"
        subtitle={selectedItem ? `Historique filtre sur ${selectedItem.nom}` : 'Journal global des mouvements de stock'}
        actions={(
          <>
            <Btn variant="ghost" icon={RefreshCw} onClick={() => void Promise.all([loadItems(), loadMovements()])} disabled={loading}>
              Actualiser
            </Btn>
            <Btn variant="primary" icon={Activity} onClick={() => setDialogOpen(true)}>
              Nouveau mouvement
            </Btn>
          </>
        )}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Mouvements" value={filteredMovements.length} sub="periode et filtres actifs" icon={Boxes} accent />
        <StatCard label="Entrees" value={totalEntries} sub="reassorts et stock initial" icon={ArrowDown} />
        <StatCard label="Sorties" value={totalSorties} sub="ventes et pertes" icon={ArrowUp} />
        <StatCard label="Ajustements" value={totalAdjustments} sub="corrections exceptionnelles" icon={Activity} />
      </div>

      {error && (
        <Card padding="sm" className="mb-5 border border-red-200 bg-red-50/50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <Card padding="sm">
        <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_180px_180px_180px_180px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Produit, code, motif ou auteur..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
            />
          </div>
          <select
            value={selectedCatalogueItemId ?? 0}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (value > 0) setSearchParams({ catalogueItemId: String(value) })
              else setSearchParams({})
            }}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none"
          >
            <option value={0}>Tous les produits</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nom} ({item.codeElement})
              </option>
            ))}
          </select>
          <select
            value={movementTypeFilter}
            onChange={(event) => setMovementTypeFilter(event.target.value as typeof movementTypeFilter)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none"
          >
            <option value="all">Tous mouvements</option>
            <option value="ENTREE">Entrees</option>
            <option value="SORTIE">Sorties</option>
            <option value="AJUSTEMENT">Ajustements</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-zinc-400">
            <Loader2 size={16} className="animate-spin" />
            Chargement des mouvements...
          </div>
        ) : (
          <DataTable<StockMovementRecord>
            columns={movementColumns}
            data={filteredMovements}
            searchable={false}
            emptyMessage="Aucun mouvement enregistre"
          />
        )}
      </Card>

      <StockMovementDialog
        open={dialogOpen}
        items={items}
        defaultItemId={dialogItemId}
        saving={savingMovement}
        error={error}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSaveMovement}
      />
    </Layout>
  )
}
