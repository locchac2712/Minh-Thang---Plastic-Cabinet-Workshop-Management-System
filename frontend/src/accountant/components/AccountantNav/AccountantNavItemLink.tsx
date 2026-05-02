import { NavLink } from 'react-router-dom'

type Props = {
  to: string
  icon: string
  label: string
  end?: boolean
  narrow?: boolean
  className?: string
  isActiveOverride?: boolean
}

export function AccountantNavItemLink({
  to,
  icon,
  label,
  end,
  narrow = false,
  className = 'th-accountant-nav-link',
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
      <span className="th-accountant-nav-link-label">{label}</span>
    </NavLink>
  )
}
