export type HospitalizationStatus = 'OPEN' | 'PENDING_EXIT' | 'CLOSED' | 'TRANSFERRED' | 'CANCELED'
export type HospitalizationChargeType = 'BED_DAY' | 'CATALOGUE' | 'MANUAL'
export type HospitalizationChargeStatus = 'A_REGLER' | 'EN_ATTENTE_PAIEMENT' | 'REGLE'
export type HospitalizationChargeOrigin = 'SYSTEM_BED_DAY' | 'RECOUVREMENT' | 'CASHIER'
export type HospitalizationTransactionKind = 'HOSPITALIZATION_INTERMEDIATE' | 'HOSPITALIZATION_FINAL'
export type HospitalizationTransactionPaymentMethod = 'ESPECES' | 'CHEQUE' | 'MOBILE_MONEY'
export type HospitalizationTransactionPaymentStatus = 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE' | 'RECU' | 'ENCAISSE' | 'REJETE'

export interface HospitalBed {
  id: number
  pavilionName: string
  roomName: string
  bedCode: string
  roomCategory: string
  service: string
  actif: boolean
  occupied: boolean
}

export interface HospitalizationTariff {
  id: number
  pavilionName: string | null
  roomCategory: string
  service: string
  montantJournalierFcfa: number
  effectiveFrom: string
  effectiveTo: string | null
  actif: boolean
}

export interface HospitalizationCharge {
  id: number
  chargeType: HospitalizationChargeType
  origin: HospitalizationChargeOrigin
  codeReference: string
  label: string
  serviceSnapshot: string | null
  chargeDate: string | null
  quantite: number
  montantFcfa: number
  statusReglement: HospitalizationChargeStatus
  transactionId: number | null
}

export interface HospitalizationClearance {
  totalCumuleFcfa: number
  totalPayeFcfa: number
  resteAPayerFcfa: number
  statutCloture: string
}

export interface HospitalBedMovementRecord {
  id: number
  movementType: string
  fromBedCode: string | null
  toBedCode: string | null
  movedById: number
  createdAt: string
}

export interface HospitalizationCaseTransactionRecord {
  id: number
  transactionKind: HospitalizationTransactionKind
  statut: string
  montantTotalFcfa: number
  montantEncaisseFcfa: number
  createdAt: string
  paymentMethod: HospitalizationTransactionPaymentMethod
  paymentStatus: HospitalizationTransactionPaymentStatus
  invoiceNumber: string | null
}

export interface HospitalizationCase {
  id: number
  caseNumber: string
  visitId: string
  patientNom: string
  patientTel: string
  serviceOriente: string
  status: HospitalizationStatus
  admissionAt: string
  dischargeMedicalAt: string | null
  actualDischargeAt: string | null
  dischargeAdminAt: string | null
  openedById: number
  closedById: number | null
  activeBed: HospitalBed | null
  clearance: HospitalizationClearance
  prochainJalonAt: string | null
  bedMovements: HospitalBedMovementRecord[]
  charges: HospitalizationCharge[]
  createdAt: string
  updatedAt: string
}

export interface HospitalizationPreparedPayment {
  caseNumber: string
  transactionKind: 'HOSPITALIZATION_INTERMEDIATE' | 'HOSPITALIZATION_FINAL'
  montantTotalFcfa: number
  montantRestantFcfa: number
  prochainJalonAt: string | null
  charges: HospitalizationCharge[]
}
