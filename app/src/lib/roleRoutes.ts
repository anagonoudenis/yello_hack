import type { Role } from '@/lib/constants'


export const ROLE_HOME_ROUTES: Record<Role, string> = {
  caissier: '/caissier/encaissement',
  superviseur: '/superviseur/dashboard',
  accueil: '/accueil/enregistrement',
  admin: '/admin/catalogue',
  auditeur: '/auditeur/releve',
}
