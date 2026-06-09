import { useNavigate } from 'react-router-dom'
import { sellerPaths } from '../../config/sellerPaths'
import { clearAuthStorage } from '../../../auth/storage'
import { SellerNavItemLink } from '../SellerNav/SellerNavItemLink'

type Props = {
  narrow: boolean
}

export function SellerSidebarFooter({ narrow }: Props) {
  const navigate = useNavigate()

  function handleLogout() {
    clearAuthStorage()
    navigate('/login', { replace: true })
  }

  return (
    <div className="th-seller-sidebar-footer">
      <p className="th-seller-nav-label th-seller-nav-label--footer">Phiên làm việc</p>
      <SellerNavItemLink
        to={sellerPaths.account}
        icon="manage_accounts"
        label="Tài khoản"
        narrow={narrow}
      />
      <button
        type="button"
        className="th-seller-nav-link th-seller-nav-link--logout"
        onClick={handleLogout}
        title={narrow ? 'Đăng xuất' : undefined}
      >
        <span className="material-symbols-outlined" aria-hidden>
          logout
        </span>
        <span className="th-seller-nav-link-label">Đăng xuất</span>
      </button>
    </div>
  )
}
