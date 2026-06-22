import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { formatCFA } from '@/lib/formatCFA'
import { Plus, Edit2, BookOpen, Package, Stethoscope, FlaskConical } from 'lucide-react'
import { MOCK_CATALOGUE, type CatalogueItem } from '@/lib/constants'

const TYPE_STYLE: Record<string, { bg: string; text: string; Icon: typeof BookOpen }> = {
  Consultation: { bg: 'bg-blue-50 text-blue-700 border border-blue-200',  Icon: Stethoscope, text: 'text-blue-700' },
  Médicament:   { bg: 'bg-green-50 text-green-700 border border-green-200', Icon: Package,    text: 'text-green-700' },
  Analyse:      { bg: 'bg-purple-50 text-purple-700 border border-purple-200', Icon: FlaskConical, text: 'text-purple-700' },
}

const COLS: Column<CatalogueItem>[] = [
  { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-[12px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-lg">{r.code}</span> },
  { key: 'nom', label: 'Acte / Produit', render: (r) => <span className="text-[13px] font-semibold text-zinc-800">{r.nom}</span> },
  { key: 'type', label: 'Catégorie', render: (r) => {
    const s = TYPE_STYLE[r.type] ?? TYPE_STYLE.Analyse
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${s.bg}`}><s.Icon size={11} />{r.type}</span>
  }},
  { key: 'service', label: 'Service', render: (r) => <span className="text-[12px] text-zinc-500">{r.service}</span> },
  { key: 'montant', label: 'Prix', align: 'right', sortable: true, render: (r) => <span className="font-mono font-bold text-[13px] text-zinc-900">{formatCFA(r.montant)}</span> },
  { key: 'stock', label: 'Stock', render: (r) => r.stock !== undefined ? (
    <span className={`font-mono text-[12px] font-bold px-2 py-0.5 rounded-lg ${r.stock < 20 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{r.stock} u.</span>
  ) : <span className="text-zinc-200">—</span> },
  { key: 'actif', label: 'État', render: (r) => (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.actif ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-zinc-100 text-zinc-400'}`}>{r.actif ? 'Actif' : 'Inactif'}</span>
  )},
  { key: 'code', label: '', render: () => (
    <button className="p-1.5 rounded-lg text-zinc-300 hover:text-zinc-700 hover:bg-zinc-100 transition-colors" aria-label="Modifier"><Edit2 size={13} /></button>
  )},
]

export default function Catalogue() {
  const [items] = useState<CatalogueItem[]>(MOCK_CATALOGUE)
  const types = [...new Set(items.map((i) => i.type))]

  return (
    <Layout>
      <PageHeader
        title="Catalogue des actes"
        subtitle={`${items.filter((i) => i.actif).length} actes et produits actifs`}
        actions={<Btn variant="primary" icon={Plus}>Nouvel acte</Btn>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Total</p>
          <p className="font-black text-[32px] text-zinc-900 leading-none">{items.length}</p>
          <p className="text-[12px] text-zinc-400 mt-1.5">actes & produits</p>
        </div>
        {types.map((t) => {
          const s = TYPE_STYLE[t] ?? TYPE_STYLE.Analyse
          return (
            <div key={t} className="bg-white rounded-2xl border border-zinc-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.Icon size={13} className={s.text} />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{t}s</p>
              </div>
              <p className="font-black text-[32px] text-zinc-900 leading-none">{items.filter((i) => i.type === t).length}</p>
            </div>
          )
        })}
      </div>

      <Card padding="sm">
        <DataTable<CatalogueItem>
          columns={COLS} data={items}
          searchable searchKeys={['nom', 'code', 'service', 'type']}
          emptyMessage="Aucun acte dans le catalogue — ajoutez le premier"
        />
      </Card>
    </Layout>
  )
}
