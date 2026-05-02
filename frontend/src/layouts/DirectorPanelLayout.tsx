import { Outlet } from 'react-router-dom'
import { DirectorSidebar } from '../director/components/DirectorSidebar/DirectorSidebar'
import { useDirectorSidebarCollapse } from '../director/hooks/useDirectorSidebarCollapse'
import './DirectorPanelLayout.css'
import '../director/styles/directorDataSurfaces.css'

export function DirectorPanelLayout() {
  const { isNarrow, toggle } = useDirectorSidebarCollapse()

  return (
    <div className="th-director-panel">
      <DirectorSidebar narrow={isNarrow} onToggle={toggle} />
      <main className="th-director-main">
        <Outlet />
      </main>
    </div>
  )
}
