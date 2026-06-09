import { Outlet } from 'react-router-dom'
import { DirectorSidebar } from '../director/components/DirectorSidebar/DirectorSidebar'
import { useDirectorSidebarCollapse } from '../director/hooks/useDirectorSidebarCollapse'
import { NotificationBellDropdown } from '../shared/ui/notifications/NotificationBellDropdown'
import './DirectorPanelLayout.css'
import '../director/styles/directorDataSurfaces.css'

export function DirectorPanelLayout() {
  const { isNarrow, toggle } = useDirectorSidebarCollapse()

  return (
    <div className="th-director-panel">
      <DirectorSidebar narrow={isNarrow} onToggle={toggle} />
      <div className="th-noti-floating">
        <NotificationBellDropdown narrow />
      </div>
      <main className="th-director-main">
        <Outlet />
      </main>
    </div>
  )
}
