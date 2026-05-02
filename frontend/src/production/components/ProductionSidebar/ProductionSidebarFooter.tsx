import { useNavigate } from 'react-router-dom'
import { clearAuthStorage } from '../../../auth/storage'

type Props = {
  narrow: boolean
}

export function ProductionSidebarFooter({ narrow }: Props) {
  const navigate = useNavigate()

  function handleLogout() {
    clearAuthStorage()
    navigate('/login', { replace: true })
  }

  return (
    <div className="th-production-sidebar-footer">
      <p className="th-production-nav-label th-production-nav-label--footer">Phiên làm việc</p>
      <button
        type="button"
        className="th-production-nav-link th-production-nav-link--logout"
        onClick={handleLogout}
        title={narrow ? 'Đăng xuất' : undefined}
      >
        <span className="material-symbols-outlined" aria-hidden>
          logout
        </span>
        <span className="th-production-nav-link-label">Đăng xuất</span>
      </button>
    </div>
  )
}
