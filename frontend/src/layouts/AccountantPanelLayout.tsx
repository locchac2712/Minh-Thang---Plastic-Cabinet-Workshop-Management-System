import { Outlet } from 'react-router-dom'
import { AccountantSidebar } from '../accountant/components/AccountantSidebar/AccountantSidebar'
import { useAccountantSidebarCollapse } from '../accountant/hooks/useAccountantSidebarCollapse'
import { NotificationBellDropdown } from '../shared/ui/notifications/NotificationBellDropdown'
import '../admin/pages/AdminUsersPage.css'
import '../accountant/styles/accountantDataSurfaces.css'
import './AccountantPanelLayout.css'

export function AccountantPanelLayout() {
  const { isNarrow, toggle } = useAccountantSidebarCollapse()

  return (
    <div className="th-accountant-panel">
      <AccountantSidebar narrow={isNarrow} onToggle={toggle} />
      <div className="th-noti-floating">
        <NotificationBellDropdown narrow />
      </div>
      <main className="th-accountant-main">
        <Outlet />
      </main>
    </div>
  )
}
