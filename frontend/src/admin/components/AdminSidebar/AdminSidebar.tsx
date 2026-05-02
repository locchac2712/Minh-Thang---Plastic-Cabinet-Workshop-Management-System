import { Link } from 'react-router-dom'
import { appLogoUrl } from '../../../branding/appLogo'
import { adminPaths } from '../../config/adminPaths'
import { AdminCatalogAccordion } from '../AdminNav/AdminNavAccordion'
import { AdminNavGroup } from '../AdminNav/AdminNavGroup'
import { AdminNavItemLink } from '../AdminNav/AdminNavItemLink'
import { AdminSidebarFooter } from './AdminSidebarFooter'
import './AdminSidebar.css'

type Props = {
  narrow: boolean
  onToggle: () => void
}

export function AdminSidebar({ narrow: isNarrow, onToggle: toggle }: Props) {

  return (
    <aside
      className={`th-admin-sidebar${isNarrow ? ' th-admin-sidebar--collapsed' : ''}`}
      aria-label="Sidebar quản trị"
    >
      <div className="th-admin-sidebar-toolbar">
        <button
          type="button"
          className="th-admin-sidebar-tool-btn"
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
        to={adminPaths.root}
        className="th-admin-brand"
        aria-label="Minh Thắng — Tổng quan quản trị"
        title={isNarrow ? 'Minh Thắng · Quản trị' : undefined}
      >
        <div className="th-admin-brand-mark" aria-hidden>
          <img src={appLogoUrl} alt="" className="th-app-brand-logo" width={40} height={40} />
        </div>
        <div className="th-admin-brand-text">
          <span className="th-admin-brand-name">Minh Thắng</span>
          <span className="th-admin-brand-role">Quản trị hệ thống</span>
        </div>
      </Link>

      <nav className="th-admin-nav" aria-label="Menu quản trị">
        <AdminNavGroup label="Tổng quan">
          <AdminNavItemLink
            to={adminPaths.dashboard}
            end
            icon="dashboard"
            label="Bảng điều khiển"
            narrow={isNarrow}
          />
        </AdminNavGroup>

        <AdminNavGroup label="Nhân sự & quyền">
          <div className="th-admin-nav-sub" role="group">
            <AdminNavItemLink
              to={adminPaths.users}
              icon="group"
              label="Danh sách nhân sự"
              narrow={isNarrow}
              className="th-admin-nav-sublink"
            />
          </div>
        </AdminNavGroup>

        <AdminNavGroup label="Danh mục thành phẩm">
          <AdminCatalogAccordion narrow={isNarrow} />
        </AdminNavGroup>

        <AdminNavGroup label="Định mức sản xuất">
          <div className="th-admin-nav-sub" role="group">
            <AdminNavItemLink
              to={adminPaths.manufacturing.materials}
              icon="precision_manufacturing"
              label="Vật tư"
              narrow={isNarrow}
              className="th-admin-nav-sublink"
            />
            <AdminNavItemLink
              to={adminPaths.manufacturing.bom}
              icon="account_tree"
              label="Cấu hình BOM"
              narrow={isNarrow}
              className="th-admin-nav-sublink"
            />
          </div>
        </AdminNavGroup>
      </nav>

      <AdminSidebarFooter narrow={isNarrow} />
    </aside>
  )
}
