import HospitalizationResourcesPage from '@/pages/shared/HospitalizationResourcesPage'

export default function HospitalisationAdmin() {
  return (
    <HospitalizationResourcesPage
      title="Hospitalisation"
      subtitle="Referentiel des lits et grille tarifaire du sejour"
      canManageTariffs
    />
  )
}
