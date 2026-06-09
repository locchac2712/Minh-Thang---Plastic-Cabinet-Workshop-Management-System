import { NavLink, useLocation } from 'react-router-dom'

type Props = {
  to: string
  icon: string
  label: string
  end?: boolean
  narrow?: boolean
  className?: string
  isActiveOverride?: boolean
  /** Tuỳ chỉnh active theo pathname (vd. tránh prefix match `/custom-products` + `/custom-products/new`). */
  matchActive?: (pathname: string) => boolean
}

export function ProductionNavItemLink({
  to,
  icon,
  label,
  end,
  narrow = false,
  className = 'th-production-nav-link',
  isActiveOverride,
  matchActive,
}: Props) {
  const location = useLocation()

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const active = isActiveOverride ?? (matchActive ? matchActive(location.pathname) : isActive)
        return active ? `${className} ${className}--active` : className
      }}
      title={narrow ? label : undefined}
    >
      <span className="material-symbols-outlined" aria-hidden>
        {icon}
      </span>
      <span className="th-production-nav-link-label">{label}</span>
    </NavLink>
  )
}
