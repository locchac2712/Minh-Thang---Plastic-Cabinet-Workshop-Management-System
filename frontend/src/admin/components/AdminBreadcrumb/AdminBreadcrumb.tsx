import { Link } from 'react-router-dom'
import './AdminBreadcrumb.css'

export type BreadcrumbItem = {
  label: string
  /** Bỏ qua khi là trang hiện tại (chỉ hiển thị text) */
  to?: string
}

type Props = {
  items: BreadcrumbItem[]
  className?: string
}

export function AdminBreadcrumb({ items, className }: Props) {
  return (
    <nav className={`th-admin-breadcrumb${className ? ` ${className}` : ''}`} aria-label="Breadcrumb">
      <ol className="th-admin-breadcrumb__list">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="th-admin-breadcrumb__item">
              {item.to && !last ? (
                <Link to={item.to} className="th-admin-breadcrumb__link">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? 'th-admin-breadcrumb__current' : 'th-admin-breadcrumb__text'} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last ? (
                <span className="th-admin-breadcrumb__sep" aria-hidden>
                  <span className="material-symbols-outlined">chevron_right</span>
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
