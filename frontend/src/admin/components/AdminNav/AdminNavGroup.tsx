import type { ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
}

export function AdminNavGroup({ label, children }: Props) {
  return (
    <>
      <p className="th-admin-nav-label">{label}</p>
      {children}
    </>
  )
}
