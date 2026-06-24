import HospitalizationResourcesPage from '@/pages/shared/HospitalizationResourcesPage'

export default function RessourcesRecouvrement() {
  return (
    <HospitalizationResourcesPage
      title="Ressources hospitalisation"
      subtitle="Lits et tarifs utiles au suivi des sejours et du recouvrement"
      canManageTariffs={false}
    />
  )
}
