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
        aria-label="Minh Thắng — Kinh doanh"
        title={isNarrow ? 'Kinh doanh bán sỉ' : undefined}
      >
        <div className="th-seller-brand-mark" aria-hidden>
          <img src={appLogoUrl} alt="" className="th-app-brand-logo" width={40} height={40} />
        </div>
        <div className="th-seller-brand-text">
          <span className="th-seller-brand-name">Kinh doanh</span>
          <span className="th-seller-brand-role">Bán sỉ · Đại lý</span>
        </div>
      </Link>

      <nav className="th-seller-nav" aria-label="Menu Seller">
        <SellerNavGroup label="Tổng quan">
          <SellerNavItemLink
            to={sellerPaths.dashboard}
            end
            icon="insights"
            label="Sale Dashboard"
            narrow={isNarrow}
          />
        </SellerNavGroup>

        <SellerNavGroup label="Khách hàng">
          <div className="th-seller-nav-sub" role="group">
            <SellerNavItemLink
              to={sellerPaths.agencies}
              icon="domain"
              label="Khách sỉ trực thuộc"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
          </div>
        </SellerNavGroup>

        <SellerNavGroup label="Giao dịch & đơn">
          <div className="th-seller-nav-sub" role="group">
            <SellerNavItemLink
              to={sellerPaths.store}
              icon="storefront"
              label="Menu hàng hóa"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
            <SellerNavItemLink
              to={sellerPaths.orders}
              icon="receipt_long"
              label="Đơn đặt hàng"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
            <SellerNavItemLink
              to={sellerPaths.quotations}
              icon="request_quote"
              label="Báo giá"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
          </div>
        </SellerNavGroup>

        <SellerNavGroup label="Tài chính">
          <div className="th-seller-nav-sub" role="group">
            <SellerNavItemLink
              to={sellerPaths.payments}
              icon="payments"
              label="Thanh toán & đối soát"
              narrow={isNarrow}
              className="th-seller-nav-sublink"
            />
          </div>
        </SellerNavGroup>

        <SellerNavGroup label="Xưởng">
          <div className="th-seller-nav-sub" role="group">
            <SellerNavItemLink
              to={sellerPaths.tracking}
              icon="photo_library"
              label="Nhật ký theo dõi xưởng"
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
