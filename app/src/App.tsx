import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { ROLE_HOME_ROUTES } from '@/lib/roleRoutes'
import useAuthStore from '@/store/authStore'

import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/superviseur/Dashboard'
import Encaissement from '@/pages/caissier/Encaissement'
import Enregistrement from '@/pages/accueil/Enregistrement'
import Historique from '@/pages/caissier/Historique'
import HistoriqueDetail from '@/pages/caissier/HistoriqueDetail'
import HistoriquePaiements from '@/pages/caissier/HistoriquePaiements'
import Facture from '@/pages/caissier/Facture'
import Alertes from '@/pages/superviseur/Alertes'
import Versement from '@/pages/superviseur/Versement'
import Rapports from '@/pages/superviseur/Rapports'
import Dossiers from '@/pages/accueil/Dossiers'
import Catalogue from '@/pages/admin/Catalogue'
import Caisses from '@/pages/admin/Caisses'
import Comptes from '@/pages/admin/Comptes'
import HospitalisationAdmin from '@/pages/admin/Hospitalisation'
import StockPharmacie from '@/pages/admin/StockPharmacie'
import StockPharmacieProduits from '@/pages/admin/StockPharmacieProduits'
import StockPharmacieMouvements from '@/pages/admin/StockPharmacieMouvements'
import AdminVersements from '@/pages/admin/Versements'
import AdminAlertes from '@/pages/admin/Alertes'
import AdminRapports from '@/pages/admin/Rapports'
import JournalAudit from '@/pages/admin/JournalAudit'
import Sauvegardes from '@/pages/admin/Sauvegardes'
import Releve from '@/pages/auditeur/Releve'
import Journal from '@/pages/auditeur/Journal'
import SejoursRecouvrement from '@/pages/recouvrement/Sejours'
import SejourDetailRecouvrement from '@/pages/recouvrement/SejourDetail'
import RessourcesRecouvrement from '@/pages/recouvrement/Ressources'

const queryClient = new QueryClient()

function RoleRedirect() {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME_ROUTES[user.role]} replace />
}

function CashierHistoryRedirect() {
  const location = useLocation()
  return <Navigate to={`/caissier/historique/dossiers${location.search}`} replace />
}

function CashierHistoryDetailRedirect() {
  const location = useLocation()
  const { dossierId = '' } = useParams()
  return <Navigate to={`/caissier/historique/dossiers/${encodeURIComponent(dossierId)}${location.search}`} replace />
}

function CashierHospitalizationRedirect() {
  const location = useLocation()
  return <Navigate to={`/caissier/encaissement${location.search}`} replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RoleRedirect />} />
              <Route path="/caissier/encaissement" element={<AuthGuard allowedRoles={['caissier']}><Encaissement /></AuthGuard>} />
              <Route path="/caissier/hospitalisation" element={<AuthGuard allowedRoles={['caissier']}><CashierHospitalizationRedirect /></AuthGuard>} />
              <Route path="/caissier/historique" element={<AuthGuard allowedRoles={['caissier']}><CashierHistoryRedirect /></AuthGuard>} />
              <Route path="/caissier/historique/dossiers" element={<AuthGuard allowedRoles={['caissier']}><Historique /></AuthGuard>} />
              <Route path="/caissier/historique/paiements" element={<AuthGuard allowedRoles={['caissier']}><HistoriquePaiements /></AuthGuard>} />
              <Route path="/caissier/historique/:dossierId" element={<AuthGuard allowedRoles={['caissier']}><CashierHistoryDetailRedirect /></AuthGuard>} />
              <Route path="/caissier/historique/dossiers/:dossierId" element={<AuthGuard allowedRoles={['caissier']}><HistoriqueDetail /></AuthGuard>} />
              <Route path="/caissier/factures"     element={<AuthGuard allowedRoles={['caissier']}><Facture /></AuthGuard>} />
              <Route path="/superviseur/dashboard" element={<AuthGuard allowedRoles={['superviseur']}><Dashboard /></AuthGuard>} />
              <Route path="/superviseur/alertes"   element={<AuthGuard allowedRoles={['superviseur']}><Alertes /></AuthGuard>} />
              <Route path="/superviseur/versement" element={<AuthGuard allowedRoles={['superviseur']}><Versement /></AuthGuard>} />
              <Route path="/superviseur/rapports"  element={<AuthGuard allowedRoles={['superviseur']}><Rapports /></AuthGuard>} />
              <Route path="/accueil/enregistrement" element={<AuthGuard allowedRoles={['accueil']}><Enregistrement /></AuthGuard>} />
              <Route path="/accueil/dossiers"       element={<AuthGuard allowedRoles={['accueil']}><Dossiers /></AuthGuard>} />
              <Route path="/recouvrement/sejours" element={<AuthGuard allowedRoles={['recouvrement']}><SejoursRecouvrement /></AuthGuard>} />
              <Route path="/recouvrement/sejours/:caseNumber" element={<AuthGuard allowedRoles={['recouvrement']}><SejourDetailRecouvrement /></AuthGuard>} />
              <Route path="/recouvrement/ressources" element={<AuthGuard allowedRoles={['recouvrement']}><RessourcesRecouvrement /></AuthGuard>} />
              <Route path="/admin/catalogue" element={<AuthGuard allowedRoles={['admin']}><Catalogue /></AuthGuard>} />
              <Route path="/admin/hospitalisation" element={<AuthGuard allowedRoles={['admin']}><HospitalisationAdmin /></AuthGuard>} />
              <Route path="/admin/stock-pharmacie" element={<AuthGuard allowedRoles={['admin']}><StockPharmacie /></AuthGuard>} />
              <Route path="/admin/stock-pharmacie/produits" element={<AuthGuard allowedRoles={['admin']}><StockPharmacieProduits /></AuthGuard>} />
              <Route path="/admin/stock-pharmacie/mouvements" element={<AuthGuard allowedRoles={['admin']}><StockPharmacieMouvements /></AuthGuard>} />
              <Route path="/admin/caisses"   element={<AuthGuard allowedRoles={['admin']}><Caisses /></AuthGuard>} />
              <Route path="/admin/comptes"   element={<AuthGuard allowedRoles={['admin']}><Comptes /></AuthGuard>} />
              <Route path="/admin/versements" element={<AuthGuard allowedRoles={['admin']}><AdminVersements /></AuthGuard>} />
              <Route path="/admin/alertes" element={<AuthGuard allowedRoles={['admin']}><AdminAlertes /></AuthGuard>} />
              <Route path="/admin/rapports" element={<AuthGuard allowedRoles={['admin']}><AdminRapports /></AuthGuard>} />
              <Route path="/admin/journal-audit" element={<AuthGuard allowedRoles={['admin']}><JournalAudit /></AuthGuard>} />
              <Route path="/admin/sauvegardes" element={<AuthGuard allowedRoles={['admin']}><Sauvegardes /></AuthGuard>} />
              <Route path="/auditeur/releve"  element={<AuthGuard allowedRoles={['auditeur']}><Releve /></AuthGuard>} />
              <Route path="/auditeur/journal" element={<AuthGuard allowedRoles={['auditeur']}><Journal /></AuthGuard>} />
              <Route path="*" element={<RoleRedirect />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </NotificationProvider>
    </QueryClientProvider>
  )
}
