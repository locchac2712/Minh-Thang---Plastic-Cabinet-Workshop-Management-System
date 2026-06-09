import { Link } from 'react-router-dom'
import { appLogoUrl } from '../../../branding/appLogo'
import { directorPaths } from '../../config/directorPaths'
import { DirectorNavGroup } from '../DirectorNav/DirectorNavGroup'
import { DirectorNavItemLink } from '../DirectorNav/DirectorNavItemLink'
import { DirectorSidebarFooter } from './DirectorSidebarFooter'
import './DirectorSidebar.css'

/** Tạm ẩn lệnh MTS ở sidebar; đặt `true` khi cần hiện lại. */
const SHOW_DIRECTOR_MTS_SIDEBAR_LINK = false

type Props = {
  narrow: boolean
  onToggle: () => void
}

export function DirectorSidebar({ narrow: isNarrow, onToggle: toggle }: Props) {
  return (
    <aside
      className={`th-director-sidebar${isNarrow ? ' th-director-sidebar--collapsed' : ''}`}
      aria-label="Sidebar Giám đốc"
    >
      <div className="th-director-sidebar-toolbar">
        <button
          type="button"
          className="th-director-sidebar-tool-btn"
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
        to={directorPaths.root}
        className="th-director-brand"
        aria-label="Minh Thắng — Giám đốc"
        title={isNarrow ? 'Ban Giám đốc' : undefined}
      >
        <div className="th-director-brand-mark" aria-hidden>
          <img src={appLogoUrl} alt="" className="th-app-brand-logo" width={40} height={40} />
        </div>
        <div className="th-director-brand-text">
          <span className="th-director-brand-name">Ban Giám đốc</span>
          <span className="th-director-brand-role">OLAP · Điều hành</span>
        </div>
      </Link>

      <nav className="th-director-nav" aria-label="Menu Director">
        <DirectorNavGroup label="Thống kê">
          <DirectorNavItemLink
            to={directorPaths.dashboard}
            end
            icon="monitoring"
            label="Doanh thu & phân tích"
            narrow={isNarrow}
          />
        </DirectorNavGroup>

        <DirectorNavGroup label="Phê duyệt & khủng hoảng">
          <div className="th-director-nav-sub" role="group">
            <DirectorNavItemLink
              to={directorPaths.approvals.pricing}
              icon="price_check"
              label="Duyệt đơn"
              narrow={isNarrow}
              className="th-director-nav-sublink"
            />
            <DirectorNavItemLink
              to={directorPaths.approvals.debt}
              icon="account_balance"
              label="Hạn mức nợ"
              narrow={isNarrow}
              className="th-director-nav-sublink"
            />
          </div>
        </DirectorNavGroup>

        <DirectorNavGroup label="Điều hành sản xuất">
          <div className="th-director-nav-sub" role="group">
            <DirectorNavItemLink
              to={directorPaths.operations.performance}
              icon="precision_manufacturing"
              label="Hiệu suất xưởng"
              narrow={isNarrow}
              className="th-director-nav-sublink"
            />
            <DirectorNavItemLink
              to={directorPaths.operations.orders}
              icon="local_shipping"
              label="Tình trạng đơn hàng"
              narrow={isNarrow}
              className="th-director-nav-sublink"
            />
            <DirectorNavItemLink
              to={directorPaths.operations.tasks}
              icon="assignment"
              label="Lệnh đang chạy"
              narrow={isNarrow}
              className="th-director-nav-sublink"
            />
            <DirectorNavItemLink
              to={directorPaths.risk.wastage}
              icon="recycling"
              label="Hao phí / tay nghề"
              narrow={isNarrow}
              className="th-director-nav-sublink"
            />
          </div>
        </DirectorNavGroup>

        <DirectorNavGroup label="Rủi ro & SCM">
          <div className="th-director-nav-sub" role="group">
            <DirectorNavItemLink
              to={directorPaths.risk.receivables}
              icon="warning"
              label="Nợ phải thu cảnh báo"
              narrow={isNarrow}
              className="th-director-nav-sublink"
            />
          </div>
        </DirectorNavGroup>

        <DirectorNavGroup label="Đối tác gốc">
          <div className="th-director-nav-sub" role="group">
            <DirectorNavItemLink
              to={directorPaths.partners.agencies}
              icon="storefront"
              label="Khách sỉ"
              narrow={isNarrow}
              className="th-director-nav-sublink"
            />
            <DirectorNavItemLink
              to={directorPaths.partners.suppliers}
              icon="local_shipping"
              label="Nhà cung cấp"
              narrow={isNarrow}
              className="th-director-nav-sublink"
            />
          </div>
        </DirectorNavGroup>

        {SHOW_DIRECTOR_MTS_SIDEBAR_LINK ? (
          <DirectorNavGroup label="Điều hành">
            <div className="th-director-nav-sub" role="group">
              <DirectorNavItemLink
                to={directorPaths.mts}
                icon="rocket_launch"
                label="Lệnh Make-to-Stock"
                narrow={isNarrow}
                className="th-director-nav-sublink"
              />
            </div>
          </DirectorNavGroup>
        ) : null}
      </nav>

      <DirectorSidebarFooter narrow={isNarrow} />
    </aside>
  )
}
