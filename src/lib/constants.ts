export const ROLES = ['admin', 'superviseur', 'caissier', 'accueil', 'auditeur'] as const
export type Role = typeof ROLES[number]

export const STATUS = {
  EN_CAISSE: 'EN_CAISSE',
  SOLDE: 'SOLDE',
  EN_ATTENTE: 'EN_ATTENTE',
  PARTIELLEMENT_SOLDE: 'PARTIELLEMENT_SOLDE',
} as const
export type StatutDossier = typeof STATUS[keyof typeof STATUS]

export type GraviteAlerte = 'critique' | 'haute' | 'moyenne'

export interface Dossier {
  id: string
  nom: string
  tel: string
  motif: string
  service: string
  statut: StatutDossier
  date: Date
}

export interface CatalogueItem {
  code: string
  type: string
  nom: string
  service: string
  montant: number
  stock?: number
  actif: boolean
}

export interface Alerte {
  code: string
  gravite: GraviteAlerte
  message: string
  heure: string
  caisse: string | null
}

export interface Caisse {
  id: string
  nom: string
  caissier: string
  total: number
  statut: 'ok' | 'alerte'
  transactions: number
  ecart?: number
}

export const MOCK_DOSSIERS: Dossier[] = [
  { id: 'VIS-4792', nom: 'Fatima Kouassi', tel: '+229 97 12 34 56',
    motif: 'Consultation générale', service: 'Médecine générale',
    statut: 'EN_CAISSE', date: new Date('2026-06-23T08:30:00') },
  { id: 'VIS-4793', nom: 'Aïcha Traoré', tel: '+229 95 44 22 11',
    motif: 'Douleurs abdominales', service: 'Médecine générale',
    statut: 'PARTIELLEMENT_SOLDE', date: new Date('2026-06-23T09:15:00') },
  { id: 'VIS-4795', nom: 'Kofi Mensah', tel: '+229 96 55 44 33',
    motif: 'Contrôle tension', service: 'Cardiologie',
    statut: 'EN_ATTENTE', date: new Date('2026-06-23T09:00:00') },
]

export const MOCK_CATALOGUE: CatalogueItem[] = [
  { code: 'CONS-GEN-01', type: 'Consultation', nom: 'Consultation générale',
    service: 'Médecine générale', montant: 2000, actif: true },
  { code: 'CONS-SPEC-01', type: 'Consultation', nom: 'Consultation spécialisée',
    service: 'Chirurgie', montant: 3500, actif: true },
  { code: 'ANAL-GLY-01', type: 'Analyse', nom: 'Glycémie à jeun',
    service: 'Laboratoire', montant: 2000, actif: true },
  { code: 'MED-PARA-500', type: 'Médicament', nom: 'Paracétamol 500mg',
    service: 'Pharmacie', montant: 500, stock: 148, actif: true },
  { code: 'MED-AMOX-500', type: 'Médicament', nom: 'Amoxicilline 500mg',
    service: 'Pharmacie', montant: 420, stock: 67, actif: true },
]

export const MOCK_ALERTES: Alerte[] = [
  { code: 'A7', gravite: 'critique',
    message: 'Montant versé caisse Pharmacie diffère du théorique — écart 15 000 FCFA',
    heure: '17h31', caisse: 'Pharmacie' },
  { code: 'A6', gravite: 'critique',
    message: 'Espèces comptées inférieures au total théorique — Caisse Pharmacie',
    heure: '17h28', caisse: 'Pharmacie' },
  { code: 'A10', gravite: 'haute',
    message: 'VIS-4795 créé à 09h00 — aucun passage en caisse après 4 heures',
    heure: '13h02', caisse: null },
  { code: 'A8', gravite: 'moyenne',
    message: 'Ligne décochée sans motif renseigné — FA-229-000143 · Caisse 2',
    heure: '11h15', caisse: 'Caisse 2' },
]

export const MOCK_CAISSES: Caisse[] = [
  { id: 'C1', nom: 'Caisse principale', caissier: 'Amadou K.',
    total: 168000, statut: 'ok', transactions: 18 },
  { id: 'C2', nom: 'Caisse 2 — Maternité', caissier: 'Béatrice A.',
    total: 97500, statut: 'ok', transactions: 11 },
  { id: 'C3', nom: 'Caisse Pharmacie', caissier: 'Romuald D.',
    total: 31500, statut: 'alerte', transactions: 24, ecart: 15000 },
]

export const MOCK_USERS = [
  { id: '1', nom: 'Amadou Kéïta', initiales: 'AK', role: 'caissier' as Role, caisse: 'Caisse principale', identifiant: 'amadou.k', motDePasse: '1234' },
  { id: '2', nom: 'Marie Dupont', initiales: 'MD', role: 'superviseur' as Role, caisse: null, identifiant: 'marie.d', motDePasse: '1234' },
  { id: '3', nom: 'Jean Accueil', initiales: 'JA', role: 'accueil' as Role, caisse: null, identifiant: 'jean.a', motDePasse: '1234' },
]
