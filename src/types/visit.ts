export type VisitStatus = 'EN_ATTENTE' | 'EN_CAISSE' | 'SOLDE' | 'PARTIELLEMENT_SOLDE'

export interface VisitRecord {
  id: number
  idVisite: string
  patientNom: string
  patientPrenom: string
  patientNomComplet: string
  patientTel: string
  motifVisite: string
  serviceOriente: string
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
  page?: number
  pageSize?: number
}

export interface VisitCreatePayload {
  patientNom: string
  patientPrenom: string
  patientTel: string
  motifVisite: string
  serviceOriente: string
}
