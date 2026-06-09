import { Link } from 'react-router-dom'
import { appLogoUrl } from '../../../branding/appLogo'
import { productionPaths } from '../../config/productionPaths'
import { ProductionNavGroup } from '../ProductionNav/ProductionNavGroup'
import { ProductionNavItemLink } from '../ProductionNav/ProductionNavItemLink'
import { ProductionSidebarFooter } from './ProductionSidebarFooter'
import './ProductionSidebar.css'

/** Tạm ẩn lệnh MTS trên sidebar — đặt `true` khi cần hiện lại. */
const SHOW_PRODUCTION_MTS_SIDEBAR_LINK = false

type Props = {
  narrow: boolean
  onToggle: () => void
}

/** Trang danh sách / chi tiết SP custom — không gồm `/new`. */
function isCustomProductsListNavActive(pathname: string): boolean {
  const root = productionPaths.customProducts.root
  const create = productionPaths.customProducts.create
  if (pathname === create) return false
  if (pathname === root || pathname === productionPaths.customProducts.list) return true
  return pathname.startsWith(`${root}/`)
}

export function ProductionSidebar({ narrow: isNarrow, onToggle: toggle }: Props) {
  return (
    <aside
      className={`th-production-sidebar${isNarrow ? ' th-production-sidebar--collapsed' : ''}`}
      aria-label="Sidebar xưởng sản xuất"
    >
      <div className="th-production-sidebar-toolbar">
        <button
          type="button"
          className="th-production-sidebar-tool-btn"
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
        to={productionPaths.root}
        className="th-production-brand"
        aria-label="TUNHUA — Xưởng sản xuất"
        title={isNarrow ? 'Xưởng SX' : undefined}
      >
        <div className="th-production-brand-mark" aria-hidden>
          <img src={appLogoUrl} alt="" className="th-app-brand-logo" width={40} height={40} />
        </div>
        <div className="th-production-brand-text">
          <span className="th-production-brand-name">Xưởng sản xuất</span>
          <span className="th-production-brand-role">Tiến độ · Kho</span>
        </div>
      </Link>

      <nav className="th-production-nav" aria-label="Menu xưởng">
        <ProductionNavGroup label="Làm việc">
          <ProductionNavItemLink
            to={productionPaths.dashboard}
            end
            icon="bar_chart"
            label="Tổng quan (dashboard)"
            narrow={isNarrow}
          />
          <ProductionNavItemLink
            to={productionPaths.board}
            end
            icon="view_kanban"
            label="Bảng ráp tủ"
            narrow={isNarrow}
          />
          <ProductionNavItemLink
            to={productionPaths.tasks.byOrder}
            icon="assignment"
            label="Lệnh theo đơn bán"
            narrow={isNarrow}
          />
          {SHOW_PRODUCTION_MTS_SIDEBAR_LINK ? (
            <ProductionNavItemLink
              to={productionPaths.tasks.internal}
              icon="warehouse"
              label="Lệnh tồn kho (MTS)"
              narrow={isNarrow}
            />
          ) : null}
          <ProductionNavItemLink
            to={productionPaths.activity}
            icon="edit_note"
            label="Nhật ký tiến độ"
            narrow={isNarrow}
          />
        </ProductionNavGroup>

        <ProductionNavGroup label="Sản phẩm custom">
          <div className="th-production-nav-sub" role="group">
            <ProductionNavItemLink
              to={productionPaths.customProducts.create}
              end
              icon="add_circle"
              label="Tạo sản phẩm custom"
              narrow={isNarrow}
              className="th-production-nav-sublink"
            />
            <ProductionNavItemLink
              to={productionPaths.customProducts.list}
              end
              icon="design_services"
              label="Đã tạo"
              narrow={isNarrow}
              className="th-production-nav-sublink"
              matchActive={isCustomProductsListNavActive}
            />
          </div>
        </ProductionNavGroup>

        <ProductionNavGroup label="Kho nhựa">
          <div className="th-production-nav-sub" role="group">
            <ProductionNavItemLink
              to={productionPaths.inventory.wastage}
              icon="delete_forever"
              label="Hư hỏng / Wastage"
              narrow={isNarrow}
              className="th-production-nav-sublink"
            />
            <ProductionNavItemLink
              to={productionPaths.inventory.stock}
              icon="inventory_2"
              label="Tồn kho"
              narrow={isNarrow}
              className="th-production-nav-sublink"
            />
            <ProductionNavItemLink
              to={productionPaths.inventory.logs}
              icon="history"
              label="Nhật ký NVL"
              narrow={isNarrow}
              className="th-production-nav-sublink"
            />
          </div>
        </ProductionNavGroup>
      </nav>

      <ProductionSidebarFooter narrow={isNarrow} />
    </aside>
  )
}
