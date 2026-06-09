import { Outlet } from 'react-router-dom'
import { SellerSidebar } from '../seller/components/SellerSidebar/SellerSidebar'
import { useSellerSidebarCollapse } from '../seller/hooks/useSellerSidebarCollapse'
import { NotificationBellDropdown } from '../shared/ui/notifications/NotificationBellDropdown'
import './SellerPanelLayout.css'
import '../seller/styles/sellerDataSurfaces.css'

export function SellerPanelLayout() {
  const { isNarrow, toggle } = useSellerSidebarCollapse()

  return (
    <div className="th-seller-panel">
      <SellerSidebar narrow={isNarrow} onToggle={toggle} />
      <div className="th-noti-floating">
        <NotificationBellDropdown narrow />
      </div>
      <main className="th-seller-main">
        <Outlet />
      </main>
    </div>
  )
}
