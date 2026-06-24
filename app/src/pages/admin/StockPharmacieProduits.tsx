import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Btn, PageHeader, StatCard } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { RowActionsMenu } from '@/components/shared/RowActionsMenu'
import { StockMovementDialog } from '@/components/shared/StockMovementDialog'
import { Card } from '@/components/ui/Card'
import { formatCFA } from '@/lib/formatCFA'
import { getApiErrorMessage } from '@/lib/apiError'
import { listCatalogue } from '@/services/catalogueApi'
import { createStockMovement } from '@/services/stockApi'
import type { CatalogueItem } from '@/types/catalogue'
import type { StockMovementCreatePayload, StockMovementType } from '@/types/stock'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Boxes,
  History,
  Loader2,
  PackageMinus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react'

function isExpired(item: CatalogueItem) {
  if (!item.dateExpiration) return false
  return new Date(item.dateExpiration) <= new Date()
}

export default function StockPharmacieProduits() {
  const navigate = useNavigate()
  const [items, setItems] = useState<CatalogueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [savingMovement, setSavingMovement] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'ok' | 'out' | 'negative' | 'expired'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogItemId, setDialogItemId] = useState<number | undefined>(undefined)
  const [dialogMovementType, setDialogMovementType] = useState<StockMovementType>('ENTREE')

  const loadItems = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listCatalogue({
        search: query || undefined,
        stockManaged: true,
        outOfStock: stockFilter === 'out' ? true : undefined,
        expired: stockFilter === 'expired' ? true : undefined,
        pageSize: 300,
      })
      const filtered = res.items.filter((item) => {
        if (stockFilter === 'ok') return item.quantiteStock > 0
        if (stockFilter === 'negative') return item.quantiteStock < 0
        return true
      })
      setItems(filtered)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Impossible de charger le stock pharmacie.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadItems()
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [query, stockFilter])

  const openMovementDialog = (itemId?: number, movementType: StockMovementType = 'ENTREE') => {
    setDialogItemId(itemId ?? items[0]?.id)
    setDialogMovementType(movementType)
    setDialogOpen(true)
  }

  const handleSaveMovement = async (payload: StockMovementCreatePayload) => {
    setSavingMovement(true)
    setError('')
    try {
      await createStockMovement(payload)
      setDialogOpen(false)
      await loadItems()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Mouvement de stock impossible.'))
    } finally {
      setSavingMovement(false)
    }
  }

  const ruptureCount = items.filter((item) => item.quantiteStock === 0).length
  const negativeCount = items.filter((item) => item.quantiteStock < 0).length
  const expiredCount = items.filter(isExpired).length

  const itemColumns: Column<CatalogueItem>[] = useMemo(() => [
    {
      key: 'nom',
      label: 'Produit',
      render: (row) => (
        <div>
          <p className="text-[13px] font-semibold text-zinc-900">{row.nom}</p>
          <p className="text-[11px] text-zinc-400">{row.codeElement} · {row.service}</p>
        </div>
      ),
    },
    {
      key: 'categorieProduit',
      label: 'Categorie',
      render: (row) => (
        <span className="text-[12px] text-zinc-500">{row.categorieProduit?.replaceAll('_', ' ') ?? '-'}</span>
      ),
    },
    {
      key: 'quantiteStock',
      label: 'Stock',
      align: 'right',
      render: (row) => (
        <span className={`font-mono text-[13px] font-bold ${
          row.quantiteStock < 0 ? 'text-red-600' : row.quantiteStock === 0 ? 'text-amber-600' : 'text-zinc-800'
        }`}>
          {row.quantiteStock}
        </span>
      ),
    },
    {
      key: 'dateExpiration',
      label: 'Expiration',
      render: (row) => (
        <span className="text-[12px] text-zinc-500">
          {row.dateExpiration ? new Date(row.dateExpiration).toLocaleDateString('fr-FR') : '-'}
        </span>
      ),
    },
    {
      key: 'montantFcfa',
      label: 'Prix',
      align: 'right',
      render: (row) => <span className="font-mono text-[12px] font-semibold text-zinc-700">{formatCFA(row.montantFcfa)}</span>,
    },
    {
      key: 'id',
      label: '',
      align: 'right',
      render: (row) => (
        <RowActionsMenu
          actions={[
            {
              label: 'Voir les mouvements',
              icon: History,
              onSelect: () => {
                navigate(`/admin/stock-pharmacie/mouvements?catalogueItemId=${row.id}`)
              },
            },
            { label: 'Entree', icon: ArrowDown, tone: 'success', onSelect: () => { openMovementDialog(row.id, 'ENTREE') } },
            { label: 'Sortie', icon: ArrowUp, tone: 'warning', onSelect: () => { openMovementDialog(row.id, 'SORTIE') } },
            { label: 'Ajustement', icon: SlidersHorizontal, onSelect: () => { openMovementDialog(row.id, 'AJUSTEMENT') } },
          ]}
        />
      ),
    },
  ], [navigate, items])

  return (
    <Layout>
      <PageHeader
        title="Stock pharmacie · Produits"
        subtitle={`${items.length} produits stockes suivis en temps reel`}
        actions={(
          <>
            <Btn variant="ghost" icon={RefreshCw} onClick={() => void loadItems()} disabled={loading}>
              Actualiser
            </Btn>
            <Btn variant="primary" icon={Activity} onClick={() => openMovementDialog()}>
              Nouveau mouvement
            </Btn>
          </>
        )}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Produits suivis" value={items.length} sub="stock pharma reel" icon={Boxes} accent />
        <StatCard label="Rupture" value={ruptureCount} sub="stock a zero" icon={PackageMinus} />
        <StatCard label="Negatif" value={negativeCount} sub="confirmation differee" icon={ArrowUp} />
        <StatCard label="Expires" value={expiredCount} sub="a verifier" icon={History} />
      </div>

      {error && (
        <Card padding="sm" className="mb-5 border border-red-200 bg-red-50/50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <Card padding="sm">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Produit, code ou service..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
            />
          </div>
          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value as typeof stockFilter)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none"
          >
            <option value="all">Tous les stocks</option>
            <option value="ok">Stock positif</option>
            <option value="out">Rupture</option>
            <option value="negative">Stock negatif</option>
            <option value="expired">Expires</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-zinc-400">
            <Loader2 size={16} className="animate-spin" />
            Chargement des produits stockes...
          </div>
        ) : (
          <DataTable<CatalogueItem>
            columns={itemColumns}
            data={items}
            searchable={false}
            emptyMessage="Aucun produit stocke trouve"
          />
        )}
      </Card>

      <StockMovementDialog
        open={dialogOpen}
        items={items}
        defaultItemId={dialogItemId}
        defaultMovementType={dialogMovementType}
        saving={savingMovement}
        error={error}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSaveMovement}
      />
    </Layout>
  )
}
