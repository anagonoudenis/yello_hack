import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { AuthGuard } from '@/components/layout/AuthGuard'

import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/superviseur/Dashboard'
import Encaissement from '@/pages/caissier/Encaissement'
import Enregistrement from '@/pages/accueil/Enregistrement'
import Historique from '@/pages/caissier/Historique'
import Facture from '@/pages/caissier/Facture'
import Alertes from '@/pages/superviseur/Alertes'
import Versement from '@/pages/superviseur/Versement'
import Rapports from '@/pages/superviseur/Rapports'
import Dossiers from '@/pages/accueil/Dossiers'
import Catalogue from '@/pages/admin/Catalogue'
import Caisses from '@/pages/admin/Caisses'
import Comptes from '@/pages/admin/Comptes'
import Releve from '@/pages/auditeur/Releve'
import Journal from '@/pages/auditeur/Journal'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/caissier/encaissement" element={<AuthGuard><Encaissement /></AuthGuard>} />
              <Route path="/caissier/historique"   element={<AuthGuard><Historique /></AuthGuard>} />
              <Route path="/caissier/factures"     element={<AuthGuard><Facture /></AuthGuard>} />
              <Route path="/superviseur/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
              <Route path="/superviseur/alertes"   element={<AuthGuard><Alertes /></AuthGuard>} />
              <Route path="/superviseur/versement" element={<AuthGuard><Versement /></AuthGuard>} />
              <Route path="/superviseur/rapports"  element={<AuthGuard><Rapports /></AuthGuard>} />
              <Route path="/accueil/enregistrement" element={<AuthGuard><Enregistrement /></AuthGuard>} />
              <Route path="/accueil/dossiers"       element={<AuthGuard><Dossiers /></AuthGuard>} />
              <Route path="/admin/catalogue" element={<AuthGuard><Catalogue /></AuthGuard>} />
              <Route path="/admin/caisses"   element={<AuthGuard><Caisses /></AuthGuard>} />
              <Route path="/admin/comptes"   element={<AuthGuard><Comptes /></AuthGuard>} />
              <Route path="/auditeur/releve"  element={<AuthGuard><Releve /></AuthGuard>} />
              <Route path="/auditeur/journal" element={<AuthGuard><Journal /></AuthGuard>} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </NotificationProvider>
    </QueryClientProvider>
  )
}
