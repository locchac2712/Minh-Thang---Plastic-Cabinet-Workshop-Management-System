import { Link } from 'react-router-dom'
import { appLogoUrl } from '../../../branding/appLogo'
import { sellerPaths } from '../../config/sellerPaths'
import { SellerNavGroup } from '../SellerNav/SellerNavGroup'
import { SellerNavItemLink } from '../SellerNav/SellerNavItemLink'
import { SellerSidebarFooter } from './SellerSidebarFooter'
import './SellerSidebar.css'

type Props = {
  narrow: boolean
  onToggle: () => void
}

export function SellerSidebar({ narrow: isNarrow, onToggle: toggle }: Props) {
  return (
    <aside
      className={`th-seller-sidebar${isNarrow ? ' th-seller-sidebar--collapsed' : ''}`}
      aria-label="Sidebar kinh doanh"
    >
      <div className="th-seller-sidebar-toolbar">
        <button
          type="button"
          className="th-seller-sidebar-tool-btn"
          onClick={toggle}
          aria-label={isNarrow ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          title={isNarrow ? 'Mở rộng' : 'Thu gọn'}
        >
          <span className="material-symbols-outlined" aria-hidden>
            {isNarrow ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
        </button>
      </div>

      <Link
        to={sellerPaths.root}
        className="th-seller-brand"
        aria-label="Minh Thắng — Bán sỉ - Đại lý"
        title={isNarrow ? 'Bán sỉ - Đại lý' : undefined}
      >
        <div className="th-seller-brand-mark" aria-hidden>
          <img src={appLogoUrl} alt="" className="th-app-brand-logo" width={40} height={40} />
        </div>
        <div className="th-seller-brand-text">
          <span className="th-seller-brand-name th-seller-brand-name--shell">Bán sỉ - Đại lý</span>
        </div>
      </Link>

      <nav className="th-seller-nav" aria-label="Menu Seller">
        <SellerNavGroup label="Tổng quan">
          <SellerNavItemLink
            to={sellerPaths.dashboard}
            end
            icon="insights"
            label="Tổng quan doanh thu"
            narrow={isNarrow}
          />
        </SellerNavGroup>

        <SellerNavGroup label="Khách hàng">
          <div className="th-seller-nav-sub" role="group">
            <SellerNavItemLink
              to={sellerPaths.agencies}
              icon="domain"
              label="Danh sách đại lý"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
          </div>
        </SellerNavGroup>

        <SellerNavGroup label="Bán hàng">
          <div className="th-seller-nav-sub" role="group">
            <SellerNavItemLink
              to={sellerPaths.store}
              icon="storefront"
              label="Danh mục sản phẩm"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
            <SellerNavItemLink
              to={sellerPaths.orders}
              icon="receipt_long"
              label="Quản lý đơn hàng"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
            <SellerNavItemLink
              to={sellerPaths.quotations}
              icon="request_quote"
              label="Quản lý báo giá"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
          </div>
        </SellerNavGroup>
      </nav>

      <SellerSidebarFooter narrow={isNarrow} />
    </aside>
  )
}
