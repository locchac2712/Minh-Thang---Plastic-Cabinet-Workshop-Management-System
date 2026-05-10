import { Outlet } from 'react-router-dom'
import { SellerSidebar } from '../seller/components/SellerSidebar/SellerSidebar'
import { useSellerSidebarCollapse } from '../seller/hooks/useSellerSidebarCollapse'
import './SellerPanelLayout.css'
import '../seller/styles/sellerSharedStyles.css'

export function SellerPanelLayout() {
  const { isNarrow, toggle } = useSellerSidebarCollapse()

  return (
    <div className="th-seller-panel">
      <SellerSidebar narrow={isNarrow} onToggle={toggle} />
      <main className="th-seller-main">
        <Outlet />
      </main>
    </div>
  )
}
