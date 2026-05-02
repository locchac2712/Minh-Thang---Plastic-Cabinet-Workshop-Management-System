import { Outlet } from 'react-router-dom'
import { AccountantSidebar } from '../accountant/components/AccountantSidebar/AccountantSidebar'
import { useAccountantSidebarCollapse } from '../accountant/hooks/useAccountantSidebarCollapse'
import '../admin/pages/AdminUsersPage.css'
import '../accountant/styles/accountantDataSurfaces.css'
import './AccountantPanelLayout.css'

export function AccountantPanelLayout() {
  const { isNarrow, toggle } = useAccountantSidebarCollapse()

  return (
    <div className="th-accountant-panel">
      <AccountantSidebar narrow={isNarrow} onToggle={toggle} />
      <main className="th-accountant-main">
        <Outlet />
      </main>
    </div>
  )
}
