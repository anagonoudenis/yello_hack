import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn, StatCard } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { RowActionsMenu } from '@/components/shared/RowActionsMenu'
import { createAdminUser, deactivateAdminUser, listAdminUsers, updateAdminUser } from '@/services/adminUserApi'
import { listCaisses } from '@/services/caisseApi'
import type { AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload } from '@/types/adminUser'
import type { CaisseItem } from '@/types/caisse'
import { getApiErrorMessage } from '@/lib/apiError'
import { ROLES, type Role } from '@/lib/constants'
import { Edit2, Loader2, Plus, Power, RefreshCw, Shield, UserCog, X } from 'lucide-react'


interface UserFormState {
  nom: string
  identifiant: string
  motDePasse: string
  role: Role
  caisseId: number | ''
  actif: boolean
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  superviseur: 'Superviseur',
  caissier: 'Caissier',
  accueil: 'Accueil',
  auditeur: 'Auditeur',
  recouvrement: 'Recouvrement',
}

const ROLE_STYLE: Record<Role, string> = {
  admin: 'border border-purple-200 bg-purple-50 text-purple-700',
  superviseur: 'border border-amber-200 bg-amber-50 text-amber-700',
  caissier: 'border border-green-200 bg-green-50 text-green-700',
  accueil: 'border border-blue-200 bg-blue-50 text-blue-700',
  auditeur: 'border border-zinc-200 bg-zinc-100 text-zinc-600',
  recouvrement: 'border border-pink-200 bg-pink-50 text-pink-700',
}

const EMPTY_FORM: UserFormState = {
  nom: '',
  identifiant: '',
  motDePasse: '',
  role: 'accueil',
  caisseId: '',
  actif: true,
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function userToForm(user: AdminUser): UserFormState {
  return {
    nom: user.nom,
    identifiant: user.identifiant,
    motDePasse: '',
    role: user.role,
    caisseId: user.caisseId ?? '',
    actif: user.actif,
  }
}

export default function Comptes() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [caisses, setCaisses] = useState<CaisseItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [actifFilter, setActifFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [caisseFilter, setCaisseFilter] = useState<number | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM)

  const activeCaisses = useMemo(() => caisses.filter((item) => item.actif), [caisses])

  const loadCaisses = async () => {
    const res = await listCaisses()
    setCaisses(res.items)
  }

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listAdminUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        actif: actifFilter === 'all' ? undefined : actifFilter === 'active',
        caisseId: caisseFilter === '' ? undefined : Number(caisseFilter),
      })
      setUsers(res.items)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Impossible de charger les comptes.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCaisses()
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadUsers()
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [search, roleFilter, actifFilter, caisseFilter])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...EMPTY_FORM,
      caisseId: activeCaisses[0]?.id ?? '',
    })
    setFormOpen(true)
  }

  const openEdit = (user: AdminUser) => {
    setEditing(user)
    setForm(userToForm(user))
    setFormOpen(true)
  }

  const handleRoleChange = (nextRole: Role) => {
    setForm((current) => ({
      ...current,
      role: nextRole,
      caisseId: nextRole === 'caissier'
        ? current.caisseId === '' ? (activeCaisses[0]?.id ?? '') : current.caisseId
        : '',
    }))
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    if (form.role === 'caissier' && form.caisseId === '') {
      setError('Une caisse active est obligatoire pour un caissier.')
      setSaving(false)
      return
    }

    if (!editing && !form.motDePasse.trim()) {
      setError('Le mot de passe est obligatoire a la creation.')
      setSaving(false)
      return
    }

    try {
      const caisseId = form.role === 'caissier' && form.caisseId !== '' ? Number(form.caisseId) : null

      if (editing) {
        const payload: AdminUserUpdatePayload = {
          nom: form.nom,
          identifiant: form.identifiant,
          role: form.role,
          caisseId,
          actif: form.actif,
        }
        await updateAdminUser(editing.id, payload)
      } else {
        const payload: AdminUserCreatePayload = {
          nom: form.nom,
          identifiant: form.identifiant,
          motDePasse: form.motDePasse,
          role: form.role,
          caisseId,
          actif: form.actif,
        }
        await createAdminUser(payload)
      }

      setFormOpen(false)
      await loadUsers()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Enregistrement du compte impossible.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (user: AdminUser) => {
    setError('')
    try {
      await deactivateAdminUser(user.id)
      await loadUsers()
    } catch (deactivateError) {
      setError(getApiErrorMessage(deactivateError, 'Desactivation du compte impossible.'))
    }
  }

  const activeCount = users.filter((user) => user.actif).length
  const cashierCount = users.filter((user) => user.role === 'caissier').length

  const columns: Column<AdminUser>[] = useMemo(() => [
    {
      key: 'nom',
      label: 'Compte',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFCB00] text-[11px] font-black text-[#1A1A1A]">
            {row.initiales}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-zinc-900">{row.nom}</p>
            <p className="font-mono text-[11px] text-zinc-400">{row.identifiant}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${ROLE_STYLE[row.role]}`}>
          {ROLE_LABELS[row.role]}
        </span>
      ),
    },
    {
      key: 'caisseNom',
      label: 'Caisse',
      render: (row) => (
        <span className="text-[12px] text-zinc-500">
          {row.caisseNom ?? 'Aucune'}
        </span>
      ),
    },
    {
      key: 'actif',
      label: 'Etat',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.actif ? 'border border-green-200 bg-green-50 text-green-700' : 'border border-zinc-200 bg-zinc-100 text-zinc-500'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${row.actif ? 'bg-green-500' : 'bg-zinc-400'}`} />
          {row.actif ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Creation',
      render: (row) => <span className="text-[12px] text-zinc-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'id',
      label: '',
      align: 'right',
      render: (row) => (
        <RowActionsMenu
          actions={[
            { label: 'Modifier', icon: Edit2, onSelect: () => { openEdit(row) } },
            { label: 'Desactiver', icon: Power, tone: 'danger', hidden: !row.actif, onSelect: () => handleDeactivate(row) },
          ]}
        />
      ),
    },
  ], [])

  return (
    <Layout>
      <PageHeader
        title="Gestion des comptes"
        subtitle={`${users.length} comptes charges`}
        actions={(
          <>
            <Btn variant="ghost" icon={RefreshCw} onClick={() => void loadUsers()} disabled={loading}>
              Actualiser
            </Btn>
            <Btn variant="primary" icon={Plus} onClick={openCreate}>
              Nouveau compte
            </Btn>
          </>
        )}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Comptes charges" value={users.length} sub="resultat courant" icon={UserCog} accent />
        <StatCard label="Actifs" value={activeCount} sub="comptes utilisables" icon={Shield} />
        <StatCard label="Caissiers" value={cashierCount} sub="avec affectation caisse" icon={UserCog} />
      </div>

      <Card padding="sm">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_160px_150px_220px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par nom ou identifiant..."
            className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as Role | '')}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none"
          >
            <option value="">Tous les roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <select
            value={actifFilter}
            onChange={(event) => setActifFilter(event.target.value as 'all' | 'active' | 'inactive')}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none"
          >
            <option value="all">Tous etats</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <select
            value={caisseFilter}
            onChange={(event) => setCaisseFilter(event.target.value ? Number(event.target.value) : '')}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none"
          >
            <option value="">Toutes les caisses</option>
            {caisses.map((caisse) => (
              <option key={caisse.id} value={caisse.id}>
                {caisse.nom}{caisse.actif ? '' : ' (inactive)'}
              </option>
            ))}
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
            Chargement des comptes...
          </div>
        ) : (
          <DataTable<AdminUser>
            columns={columns}
            data={users}
            searchable={false}
            emptyMessage="Aucun compte pour ces filtres"
          />
        )}
      </Card>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={save}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-[16px] font-bold text-zinc-900">
                  {editing ? 'Modifier le compte' : 'Nouveau compte'}
                </h2>
                <p className="text-[12px] text-zinc-400">
                  Le mot de passe n&apos;est gere qu&apos;a la creation dans ce sprint.
                </p>
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

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="text-[12px] font-semibold text-zinc-500">
                Nom complet
                <input
                  value={form.nom}
                  onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                />
              </label>

              <label className="text-[12px] font-semibold text-zinc-500">
                Identifiant
                <input
                  value={form.identifiant}
                  onChange={(event) => setForm((current) => ({ ...current, identifiant: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                />
              </label>

              {!editing && (
                <label className="text-[12px] font-semibold text-zinc-500 sm:col-span-2">
                  Mot de passe initial
                  <input
                    type="password"
                    value={form.motDePasse}
                    onChange={(event) => setForm((current) => ({ ...current, motDePasse: event.target.value }))}
                    required
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                  />
                </label>
              )}

              <label className="text-[12px] font-semibold text-zinc-500">
                Role
                <select
                  value={form.role}
                  onChange={(event) => handleRoleChange(event.target.value as Role)}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-[12px] font-semibold text-zinc-500">
                Caisse
                <select
                  value={form.caisseId}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    caisseId: event.target.value ? Number(event.target.value) : '',
                  }))}
                  disabled={form.role !== 'caissier'}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none disabled:bg-zinc-100"
                >
                  <option value="">Aucune</option>
                  {activeCaisses.map((caisse) => (
                    <option key={caisse.id} value={caisse.id}>
                      {caisse.nom}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-[13px] text-zinc-600 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(event) => setForm((current) => ({ ...current, actif: event.target.checked }))}
                  className="accent-[#FFCB00]"
                />
                Compte actif
              </label>

              {form.role === 'caissier' && activeCaisses.length === 0 && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700 sm:col-span-2">
                  Creez ou reactivez une caisse avant d&apos;activer un compte caissier.
                </p>
              )}
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
