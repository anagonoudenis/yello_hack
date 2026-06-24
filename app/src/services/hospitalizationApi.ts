import api from '@/services/api'
import type {
  HospitalBed,
  HospitalBedMovementRecord,
  HospitalizationCase,
  HospitalizationCaseTransactionRecord,
  HospitalizationCharge,
  HospitalizationPreparedPayment,
  HospitalizationTariff,
} from '@/types/hospitalization'

interface ApiHospitalBed {
  id: number
  pavilion_name: string
  room_name: string
  bed_code: string
  room_category: string
  service: string
  actif: boolean
  occupied: boolean
}

interface ApiHospitalizationCharge {
  id: number
  charge_type: HospitalizationCharge['chargeType']
  origin: HospitalizationCharge['origin']
  code_reference: string
  label: string
  service_snapshot: string | null
  charge_date: string | null
  quantite: number
  montant_fcfa: number
  status_reglement: HospitalizationCharge['statusReglement']
  transaction_id: number | null
}

interface ApiHospitalizationCase {
  id: number
  case_number: string
  visit_id: string
  patient_nom: string
  patient_tel: string
  service_oriente: string
  status: HospitalizationCase['status']
  admission_at: string
  discharge_medical_at: string | null
  actual_discharge_at: string | null
  discharge_admin_at: string | null
  opened_by_id: number
  closed_by_id: number | null
  active_bed: ApiHospitalBed | null
  clearance: {
    total_cumule_fcfa: number
    total_paye_fcfa: number
    reste_a_payer_fcfa: number
    statut_cloture: string
  }
  prochain_jalon_at: string | null
  bed_movements: Array<{
    id: number
    movement_type: string
    from_bed_code: string | null
    to_bed_code: string | null
    moved_by_id: number
    created_at: string
  }>
  charges: ApiHospitalizationCharge[]
  created_at: string
  updated_at: string
}

interface ApiHospitalizationListResponse {
  items: ApiHospitalizationCase[]
  total: number
}

interface ApiPreparedPayment {
  case_number: string
  transaction_kind: HospitalizationPreparedPayment['transactionKind']
  montant_total_fcfa: number
  montant_restant_fcfa: number
  prochain_jalon_at: string | null
  charges: ApiHospitalizationCharge[]
}

interface ApiHospitalizationTariff {
  id: number
  pavilion_name: string | null
  room_category: string
  service: string
  montant_journalier_fcfa: number
  effective_from: string
  effective_to: string | null
  actif: boolean
}

interface ApiHospitalizationCaseTransaction {
  id: number
  transaction_kind: HospitalizationCaseTransactionRecord['transactionKind']
  statut: string
  montant_total_fcfa: number
  montant_encaisse_fcfa: number
  created_at: string
  invoice_number: string | null
  payment: {
    moyen_paiement: HospitalizationCaseTransactionRecord['paymentMethod']
    statut: HospitalizationCaseTransactionRecord['paymentStatus']
  }
}

const toBed = (item: ApiHospitalBed): HospitalBed => ({
  id: item.id,
  pavilionName: item.pavilion_name,
  roomName: item.room_name,
  bedCode: item.bed_code,
  roomCategory: item.room_category,
  service: item.service,
  actif: item.actif,
  occupied: item.occupied,
})

const toCharge = (item: ApiHospitalizationCharge): HospitalizationCharge => ({
  id: item.id,
  chargeType: item.charge_type,
  origin: item.origin,
  codeReference: item.code_reference,
  label: item.label,
  serviceSnapshot: item.service_snapshot,
  chargeDate: item.charge_date,
  quantite: item.quantite,
  montantFcfa: item.montant_fcfa,
  statusReglement: item.status_reglement,
  transactionId: item.transaction_id,
})

const toBedMovement = (item: ApiHospitalizationCase['bed_movements'][number]): HospitalBedMovementRecord => ({
  id: item.id,
  movementType: item.movement_type,
  fromBedCode: item.from_bed_code,
  toBedCode: item.to_bed_code,
  movedById: item.moved_by_id,
  createdAt: item.created_at,
})

const toCase = (item: ApiHospitalizationCase): HospitalizationCase => ({
  id: item.id,
  caseNumber: item.case_number,
  visitId: item.visit_id,
  patientNom: item.patient_nom,
  patientTel: item.patient_tel,
  serviceOriente: item.service_oriente,
  status: item.status,
  admissionAt: item.admission_at,
  dischargeMedicalAt: item.discharge_medical_at,
  actualDischargeAt: item.actual_discharge_at,
  dischargeAdminAt: item.discharge_admin_at,
  openedById: item.opened_by_id,
  closedById: item.closed_by_id,
  activeBed: item.active_bed ? toBed(item.active_bed) : null,
  clearance: {
    totalCumuleFcfa: item.clearance.total_cumule_fcfa,
    totalPayeFcfa: item.clearance.total_paye_fcfa,
    resteAPayerFcfa: item.clearance.reste_a_payer_fcfa,
    statutCloture: item.clearance.statut_cloture,
  },
  prochainJalonAt: item.prochain_jalon_at,
  bedMovements: item.bed_movements.map(toBedMovement),
  charges: item.charges.map(toCharge),
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const toPreparedPayment = (item: ApiPreparedPayment): HospitalizationPreparedPayment => ({
  caseNumber: item.case_number,
  transactionKind: item.transaction_kind,
  montantTotalFcfa: item.montant_total_fcfa,
  montantRestantFcfa: item.montant_restant_fcfa,
  prochainJalonAt: item.prochain_jalon_at,
  charges: item.charges.map(toCharge),
})

const toTariff = (item: ApiHospitalizationTariff): HospitalizationTariff => ({
  id: item.id,
  pavilionName: item.pavilion_name,
  roomCategory: item.room_category,
  service: item.service,
  montantJournalierFcfa: item.montant_journalier_fcfa,
  effectiveFrom: item.effective_from,
  effectiveTo: item.effective_to,
  actif: item.actif,
})

const toCaseTransaction = (item: ApiHospitalizationCaseTransaction): HospitalizationCaseTransactionRecord => ({
  id: item.id,
  transactionKind: item.transaction_kind,
  statut: item.statut,
  montantTotalFcfa: item.montant_total_fcfa,
  montantEncaisseFcfa: item.montant_encaisse_fcfa,
  createdAt: item.created_at,
  paymentMethod: item.payment.moyen_paiement,
  paymentStatus: item.payment.statut,
  invoiceNumber: item.invoice_number,
})

export async function listHospitalizations(search?: string, status?: string) {
  const res = await api.get<ApiHospitalizationListResponse>('/hospitalizations', {
    params: { search: search || undefined, status: status || undefined, page_size: 200 },
  })
  return {
    items: res.data.items.map(toCase),
    total: res.data.total,
  }
}

export async function getHospitalization(caseNumber: string) {
  const res = await api.get<ApiHospitalizationCase>(`/hospitalizations/${encodeURIComponent(caseNumber)}`)
  return toCase(res.data)
}

export async function getHospitalizationByVisit(idVisite: string) {
  const res = await api.get<ApiHospitalizationCase>(`/hospitalizations/by-visit/${encodeURIComponent(idVisite)}`)
  return toCase(res.data)
}

export async function getHospitalizationTransactions(caseNumber: string) {
  const res = await api.get<ApiHospitalizationCaseTransaction[]>(`/hospitalizations/${encodeURIComponent(caseNumber)}/transactions`)
  return res.data.map(toCaseTransaction)
}

export async function createHospitalization(payload: {
  idVisite: string
  admissionAt?: string | null
  initialBedId?: number | null
}) {
  const res = await api.post<ApiHospitalizationCase>('/hospitalizations', {
    id_visite: payload.idVisite,
    admission_at: payload.admissionAt || undefined,
    initial_bed_id: payload.initialBedId || undefined,
  })
  return toCase(res.data)
}

export async function assignHospitalBed(caseNumber: string, bedId: number) {
  const res = await api.post<ApiHospitalizationCase>(`/hospitalizations/${encodeURIComponent(caseNumber)}/assign-bed`, {
    bed_id: bedId,
  })
  return toCase(res.data)
}

export async function transferHospitalBed(caseNumber: string, bedId: number) {
  const res = await api.post<ApiHospitalizationCase>(`/hospitalizations/${encodeURIComponent(caseNumber)}/transfer-bed`, {
    bed_id: bedId,
  })
  return toCase(res.data)
}

export async function markMedicalDischarge(caseNumber: string) {
  const res = await api.post<ApiHospitalizationCase>(`/hospitalizations/${encodeURIComponent(caseNumber)}/mark-medical-discharge`)
  return toCase(res.data)
}

export async function markActualDischarge(caseNumber: string) {
  const res = await api.post<ApiHospitalizationCase>(`/hospitalizations/${encodeURIComponent(caseNumber)}/mark-actual-discharge`)
  return toCase(res.data)
}

export async function prepareIntermediatePayment(caseNumber: string) {
  const res = await api.post<ApiPreparedPayment>(`/hospitalizations/${encodeURIComponent(caseNumber)}/prepare-intermediate-payment`)
  return toPreparedPayment(res.data)
}

export async function prepareFinalPayment(caseNumber: string) {
  const res = await api.post<ApiPreparedPayment>(`/hospitalizations/${encodeURIComponent(caseNumber)}/prepare-final-payment`)
  return toPreparedPayment(res.data)
}

export async function closeHospitalizationAdmin(caseNumber: string) {
  const res = await api.post<ApiHospitalizationCase>(`/hospitalizations/${encodeURIComponent(caseNumber)}/close-admin`)
  return toCase(res.data)
}

export async function createHospitalizationManualCharge(
  caseNumber: string,
  payload:
    | { chargeType: 'MANUAL'; label: string; montantFcfa: number; service?: string; chargeDate?: string }
    | { chargeType: 'CATALOGUE'; catalogueItemId: number; chargeDate?: string }
) {
  const body =
    payload.chargeType === 'MANUAL'
      ? {
          charge_type: 'MANUAL',
          label: payload.label,
          montant_fcfa: payload.montantFcfa,
          service: payload.service,
          charge_date: payload.chargeDate,
        }
      : {
          charge_type: 'CATALOGUE',
          catalogue_item_id: payload.catalogueItemId,
          charge_date: payload.chargeDate,
        }
  const res = await api.post<ApiHospitalizationCharge>(`/hospitalizations/${encodeURIComponent(caseNumber)}/charges`, body)
  return toCharge(res.data)
}

export async function listHospitalBeds() {
  const res = await api.get<ApiHospitalBed[]>('/hospital-beds')
  return res.data.map(toBed)
}

export async function createHospitalBed(payload: {
  pavilionName: string
  roomName: string
  bedCode: string
  roomCategory: string
  service: string
  actif?: boolean
}) {
  const res = await api.post<ApiHospitalBed>('/hospital-beds', {
    pavilion_name: payload.pavilionName,
    room_name: payload.roomName,
    bed_code: payload.bedCode,
    room_category: payload.roomCategory,
    service: payload.service,
    actif: payload.actif ?? true,
  })
  return toBed(res.data)
}

export async function listHospitalizationTariffs() {
  const res = await api.get<ApiHospitalizationTariff[]>('/hospitalization-tariffs')
  return res.data.map(toTariff)
}

export async function createHospitalizationTariff(payload: {
  pavilionName?: string
  roomCategory: string
  service: string
  montantJournalierFcfa: number
  effectiveFrom: string
  effectiveTo?: string | null
  actif?: boolean
}) {
  const res = await api.post<ApiHospitalizationTariff>('/hospitalization-tariffs', {
    pavilion_name: payload.pavilionName || undefined,
    room_category: payload.roomCategory,
    service: payload.service,
    montant_journalier_fcfa: payload.montantJournalierFcfa,
    effective_from: payload.effectiveFrom,
    effective_to: payload.effectiveTo || undefined,
    actif: payload.actif ?? true,
  })
  return toTariff(res.data)
}
