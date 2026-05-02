import { Outlet } from 'react-router-dom'
import { AgenciesCatalogProvider } from '../../admin/context/AgenciesCatalogContext'

export function PartnersLayout() {
  return (
    <AgenciesCatalogProvider>
      <Outlet />
    </AgenciesCatalogProvider>
  )
}
