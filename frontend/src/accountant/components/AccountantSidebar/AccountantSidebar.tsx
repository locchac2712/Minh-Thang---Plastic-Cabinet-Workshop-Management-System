import { Link } from 'react-router-dom'
import { appLogoUrl } from '../../../branding/appLogo'
import {
  ACCOUNTANT_PAYABLES_BILLS_ENABLED,
  ACCOUNTANT_RECEIVABLES_VAT_PAGES_ENABLED,
  accountantPaths,
} from '../../config/accountantPaths'
import { AccountantNavGroup } from '../AccountantNav/AccountantNavGroup'
import { AccountantNavItemLink } from '../AccountantNav/AccountantNavItemLink'
import { AccountantSidebarFooter } from './AccountantSidebarFooter'
import './AccountantSidebar.css'

type Props = {
  narrow: boolean
  onToggle: () => void
}

export function AccountantSidebar({ narrow: isNarrow, onToggle: toggle }: Props) {
  return (
    <aside
      className={`th-accountant-sidebar${isNarrow ? ' th-accountant-sidebar--collapsed' : ''}`}
      aria-label="Sidebar kế toán"
    >
      <div className="th-accountant-sidebar-toolbar">
        <button
          type="button"
          className="th-accountant-sidebar-tool-btn"
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
        to={accountantPaths.root}
        className="th-accountant-brand"
        aria-label="TUNHUA — Kế toán"
        title={isNarrow ? 'Kế toán' : undefined}
      >
        <div className="th-accountant-brand-mark" aria-hidden>
          <img src={appLogoUrl} alt="" className="th-app-brand-logo" width={40} height={40} />
        </div>
        <div className="th-accountant-brand-text">
          <span className="th-accountant-brand-name">Kế toán</span>
          <span className="th-accountant-brand-role">Thu · Chi · Kho</span>
        </div>
      </Link>

      <nav className="th-accountant-nav" aria-label="Menu kế toán">
        <AccountantNavGroup label="Tổng quan">
          <AccountantNavItemLink
            to={accountantPaths.dashboard}
            end
            icon="account_balance_wallet"
            label="Tài chính kho bãi"
            narrow={isNarrow}
          />
        </AccountantNavGroup>

        <AccountantNavGroup label="Phải thu (AR)">
          <div className="th-accountant-nav-sub" role="group">
            <AccountantNavItemLink
              to={accountantPaths.receivables.deposits}
              icon="price_check"
              label="Xác nhận nạp tiền"
              narrow={isNarrow}
              className="th-accountant-nav-sublink"
            />
            {ACCOUNTANT_RECEIVABLES_VAT_PAGES_ENABLED ? (
              <>
                <AccountantNavItemLink
                  to={accountantPaths.receivables.invoices}
                  icon="receipt_long"
                  label="Hóa đơn VAT"
                  narrow={isNarrow}
                  className="th-accountant-nav-sublink"
                />
                <AccountantNavItemLink
                  to={accountantPaths.receivables.invoiceHistory}
                  icon="history"
                  label="Lịch sử xuất hóa đơn"
                  narrow={isNarrow}
                  className="th-accountant-nav-sublink"
                />
              </>
            ) : null}
          </div>
        </AccountantNavGroup>

        <AccountantNavGroup label="Mua hàng & phải trả">
          <div className="th-accountant-nav-sub" role="group">
            <AccountantNavItemLink
              to={accountantPaths.purchasing.alerts}
              end
              icon="notification_important"
              label="Cảnh báo tồn thấp"
              narrow={isNarrow}
              className="th-accountant-nav-sublink"
            />
            <AccountantNavItemLink
              to={accountantPaths.purchasing.orders}
              end
              icon="shopping_cart"
              label="Đơn mua (PO)"
              narrow={isNarrow}
              className="th-accountant-nav-sublink"
            />
            {ACCOUNTANT_PAYABLES_BILLS_ENABLED ? (
              <AccountantNavItemLink
                to={accountantPaths.payables.bills}
                icon="request_quote"
                label="Sổ nợ trả NCC"
                narrow={isNarrow}
                className="th-accountant-nav-sublink"
              />
            ) : null}
          </div>
        </AccountantNavGroup>

        <AccountantNavGroup label="Master kế toán">
          <div className="th-accountant-nav-sub" role="group">
            <AccountantNavItemLink
              to={accountantPaths.masters.suppliers}
              icon="warehouse"
              label="Chủ ván / NCC"
              narrow={isNarrow}
              className="th-accountant-nav-sublink"
            />
            <AccountantNavItemLink
              to={accountantPaths.masters.materials}
              icon="inventory_2"
              label="Tất cả vật tư"
              narrow={isNarrow}
              className="th-accountant-nav-sublink"
            />
          </div>
        </AccountantNavGroup>
      </nav>

      <AccountantSidebarFooter narrow={isNarrow} />
    </aside>
  )
}
