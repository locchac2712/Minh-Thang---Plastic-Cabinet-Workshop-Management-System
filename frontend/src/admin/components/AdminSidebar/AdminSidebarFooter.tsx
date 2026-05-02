import { useNavigate } from 'react-router-dom'
import { clearAuthStorage } from '../../../auth/storage'

type Props = {
  narrow: boolean
}

export function AdminSidebarFooter({ narrow }: Props) {
  const navigate = useNavigate()

  function handleLogout() {
    clearAuthStorage()
    navigate('/login', { replace: true })
  }

  return (
    <div className="th-admin-sidebar-footer">
      <p className="th-admin-nav-label th-admin-nav-label--footer">Phiên làm việc</p>
      <button
        type="button"
        className="th-admin-nav-link th-admin-nav-link--logout"
        onClick={handleLogout}
        title={narrow ? 'Đăng xuất' : undefined}
      >
        <span className="material-symbols-outlined" aria-hidden>
          logout
        </span>
        <span className="th-admin-nav-link-label">Đăng xuất</span>
      </button>
    </div>
  )
}
