import { useNavigate } from 'react-router-dom'
import { clearAuthStorage } from '../../../auth/storage'

type Props = {
  narrow: boolean
}

export function DirectorSidebarFooter({ narrow }: Props) {
  const navigate = useNavigate()

  function handleLogout() {
    clearAuthStorage()
    navigate('/login', { replace: true })
  }

  return (
    <div className="th-director-sidebar-footer">
      <p className="th-director-nav-label th-director-nav-label--footer">Phiên làm việc</p>
      <button
        type="button"
        className="th-director-nav-link th-director-nav-link--logout"
        onClick={handleLogout}
        title={narrow ? 'Đăng xuất' : undefined}
      >
        <span className="material-symbols-outlined" aria-hidden>
          logout
        </span>
        <span className="th-director-nav-link-label">Đăng xuất</span>
      </button>
    </div>
  )
}
