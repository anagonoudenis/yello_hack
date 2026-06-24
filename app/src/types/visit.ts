export type VisitStatus = 'EN_ATTENTE' | 'EN_CAISSE' | 'SOLDE' | 'PARTIELLEMENT_SOLDE'
export type VisitParcoursType = 'EXTERNE' | 'HOSPITALISATION'

export interface VisitRecord {
  id: number
  idVisite: string
  patientNom: string
  patientPrenom: string
  patientNomComplet: string
  patientTel: string
  contactUrgenceTel?: string | null
  motifVisite: string
  serviceOriente: string
  parcoursType: VisitParcoursType
  agentAccueilId: number
  statut: VisitStatus
  createdAt: string
  updatedAt: string
}

export interface VisitListParams {
  search?: string
  telephoneExact?: string
  status?: VisitStatus
  todayOnly?: boolean
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface VisitCreatePayload {
  patientNom: string
  patientPrenom: string
  patientTel: string
  contactUrgenceTel?: string
  motifVisite: string
  serviceOriente: string
  parcoursType: VisitParcoursType
}

export interface VisitUpdatePayload extends VisitCreatePayload {}
