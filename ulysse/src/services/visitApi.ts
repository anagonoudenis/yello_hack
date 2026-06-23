import api from '@/services/api'
import type { VisitCreatePayload, VisitListParams, VisitRecord } from '@/types/visit'

interface ApiVisitRecord {
  id: number
  id_visite: string
  patient_nom: string
  patient_prenom: string
  patient_tel: string
  motif_visite: string
  service_oriente: string
  agent_accueil_id: number
  statut: VisitRecord['statut']
  created_at: string
  updated_at: string
}

interface ApiVisitList {
  items: ApiVisitRecord[]
  total: number
  page: number
  page_size: number
}

const toVisit = (visit: ApiVisitRecord): VisitRecord => ({
  id: visit.id,
  idVisite: visit.id_visite,
  patientNom: visit.patient_nom,
  patientPrenom: visit.patient_prenom,
  patientNomComplet: `${visit.patient_prenom} ${visit.patient_nom}`.trim(),
  patientTel: visit.patient_tel,
  motifVisite: visit.motif_visite,
  serviceOriente: visit.service_oriente,
  agentAccueilId: visit.agent_accueil_id,
  statut: visit.statut,
  createdAt: visit.created_at,
  updatedAt: visit.updated_at,
})

export async function listVisits(params: VisitListParams = {}) {
  const res = await api.get<ApiVisitList>('/visits', {
    params: {
      search: params.search || undefined,
      telephone_exact: params.telephoneExact || undefined,
      status: params.status || undefined,
      today_only: params.todayOnly || undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 50,
    },
  })
  return {
    items: res.data.items.map(toVisit),
    total: res.data.total,
    page: res.data.page,
    pageSize: res.data.page_size,
  }
}

export async function getVisit(idVisite: string) {
  const res = await api.get<ApiVisitRecord>(`/visits/${encodeURIComponent(idVisite)}`)
  return toVisit(res.data)
}

export async function createVisit(payload: VisitCreatePayload) {
  const res = await api.post<ApiVisitRecord>('/visits', {
    patient_nom: payload.patientNom,
    patient_prenom: payload.patientPrenom,
    patient_tel: payload.patientTel,
    motif_visite: payload.motifVisite,
    service_oriente: payload.serviceOriente,
  })
  return toVisit(res.data)
}

export async function openCashierVisit(idVisite: string) {
  const res = await api.post<ApiVisitRecord>(`/visits/${encodeURIComponent(idVisite)}/open-cashier`)
  return toVisit(res.data)
}
