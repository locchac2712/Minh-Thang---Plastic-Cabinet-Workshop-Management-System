import { NavLink } from 'react-router-dom'

type Props = {
  to: string
  icon: string
  label: string
  end?: boolean
  narrow?: boolean
  className?: string
  /** Khi route con vẫn cần highlight parent */
  isActiveOverride?: boolean
}

export function AdminNavItemLink({
  to,
  icon,
  label,
  end,
  narrow = false,
  className = 'th-admin-nav-link',
  isActiveOverride,
}: Props) {
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
      <span className="th-admin-nav-link-label">{label}</span>
    </NavLink>
  )
}
