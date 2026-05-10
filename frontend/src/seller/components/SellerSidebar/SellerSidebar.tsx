import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { appLogoUrl } from '../../../branding/appLogo'
import { sellerPaths } from '../../config/sellerPaths'
import { useNavigate } from 'react-router-dom'
import { clearAuthStorage } from '../../../auth/storage'
import './SellerSidebar.css'

type Props = {
  narrow: boolean
  onToggle: () => void
}

function SellerNavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <p className="th-seller-nav-label">{label}</p>
      {children}
    </>
  )
}

function SellerNavItemLink({
  to,
  icon,
  label,
  end,
  narrow = false,
  className = 'th-seller-nav-link',
  isActiveOverride,
}: {
  to: string
  icon: string
  label: string
  end?: boolean
  narrow?: boolean
  className?: string
  isActiveOverride?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const active = isActiveOverride ?? isActive
        return active ? `${className} ${className}--active` : className
      }}
      title={narrow ? label : undefined}
    >
      <span className="material-symbols-outlined" aria-hidden>
        {icon}
      </span>
      <span className="th-seller-nav-link-label">{label}</span>
    </NavLink>
  )
}

export function SellerSidebar({ narrow: isNarrow, onToggle: toggle }: Props) {
  const navigate = useNavigate()

  return (
    <aside
      className={`th-seller-sidebar${isNarrow ? ' th-seller-sidebar--collapsed' : ''}`}
      aria-label="Sidebar kinh doanh"
    >

      <Link
        to={sellerPaths.root}
        className="th-seller-brand"
        aria-label="Minh Thắng — Kinh doanh"
        title={isNarrow ? 'Kinh doanh bán sỉ' : undefined}
      >
        <div className="th-seller-brand-mark" aria-hidden>
          <img src={appLogoUrl} alt="" className="th-app-brand-logo" width={40} height={40} />
        </div>
        <div className="th-seller-brand-text">
          <span className="th-seller-brand-name">Kinh doanh</span>
        </div>
      </Link>

      <nav className="th-seller-nav" aria-label="Menu Seller">
        <SellerNavGroup label="Tổng quan">
          <SellerNavItemLink
            to={sellerPaths.dashboard}
            end
            icon="dashboard"
            label="Tổng quan kinh doanh"
            narrow={isNarrow}
          />
        </SellerNavGroup>

        <SellerNavGroup label="Đối tác & Đại lý">
          <div className="th-seller-nav-sub" role="group">
            <SellerNavItemLink
              to={sellerPaths.agencies}
              icon="groups"
              label="Danh sách đại lý"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
          </div>
        </SellerNavGroup>

        <SellerNavGroup label="Bán hàng & Báo giá">
          <div className="th-seller-nav-sub" role="group">
            <SellerNavItemLink
              to={sellerPaths.store}
              icon="inventory_2"
              label="Sản phẩm & Đặt hàng"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
            <SellerNavItemLink
              to={sellerPaths.orders}
              icon="receipt_long"
              label="Danh sách đơn hàng"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
            <SellerNavItemLink
              to={sellerPaths.quotations}
              icon="description"
              label="Danh sách báo giá"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
          </div>
        </SellerNavGroup>

        <SellerNavGroup label="Thanh toán & Công nợ">
          <div className="th-seller-nav-sub" role="group">
            <SellerNavItemLink
              to={sellerPaths.payments}
              icon="account_balance_wallet"
              label="Giao dịch & Công nợ"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
          </div>
        </SellerNavGroup>

        <SellerNavGroup label="Theo dõi sản xuất">
          <div className="th-seller-nav-sub" role="group">
            <SellerNavItemLink
              to={sellerPaths.tracking}
              icon="factory"
              label="Tiến độ sản xuất"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
          </div>
        </SellerNavGroup>
      </nav>

      <div className="th-seller-sidebar-footer">
        <p className="th-seller-nav-label">Hệ thống</p>
        <button
          type="button"
          className="th-seller-nav-link th-seller-nav-link-btn th-seller-nav-link--btn"
          onClick={toggle}
          title={isNarrow ? 'Mở rộng sidebar' : undefined}
        >
          <span className="material-symbols-outlined" aria-hidden>
            {isNarrow ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
          <span className="th-seller-nav-link-label">
            {isNarrow ? 'Mở rộng' : 'Thu gọn sidebar'}
          </span>
        </button>

        <p className="th-seller-nav-label">Phiên làm việc</p>
        <button
          type="button"
          className="th-seller-nav-link th-seller-nav-link-btn th-seller-nav-link--logout"
          onClick={() => {
            clearAuthStorage()
            navigate('/login', { replace: true })
          }}
          title={isNarrow ? 'Đăng xuất' : undefined}
        >
          <span className="material-symbols-outlined" aria-hidden>
            logout
          </span>
          <span className="th-seller-nav-link-label">Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
