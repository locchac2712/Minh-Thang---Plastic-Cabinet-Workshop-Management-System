import { Outlet } from 'react-router-dom'
import { ProductionSidebar } from '../production/components/ProductionSidebar/ProductionSidebar'
import { useProductionSidebarCollapse } from '../production/hooks/useProductionSidebarCollapse'
import '../admin/pages/AdminUsersPage.css'
import '../production/styles/productionDataSurfaces.css'
import './ProductionPanelLayout.css'

export function ProductionPanelLayout() {
  const { isNarrow, toggle } = useProductionSidebarCollapse()

  return (
    <div className="th-production-panel">
      <ProductionSidebar narrow={isNarrow} onToggle={toggle} />
      <main className="th-production-main">
        <Outlet />
      </main>
    </div>
  )
}
