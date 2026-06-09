import { Outlet } from 'react-router-dom'
import { AdminSidebar } from '../admin/components/AdminSidebar/AdminSidebar'
import { ProductsCatalogProvider } from '../admin/context/ProductsCatalogContext'
import { useAdminSidebarCollapse } from '../admin/hooks/useAdminSidebarCollapse'
import { NotificationBellDropdown } from '../shared/ui/notifications/NotificationBellDropdown'
import '../admin/styles/adminDarkTheme.css'
import './AdminPanelLayout.css'

export function AdminPanelLayout() {
  const { isNarrow, toggle } = useAdminSidebarCollapse()

  return (
    <ProductsCatalogProvider>
      <div className="th-admin-panel">
        <AdminSidebar narrow={isNarrow} onToggle={toggle} />
        <div className="th-noti-floating">
          <NotificationBellDropdown narrow />
        </div>
        <main className="th-admin-main">
          <Outlet />
        </main>
      </div>
    </ProductsCatalogProvider>
  )
}
