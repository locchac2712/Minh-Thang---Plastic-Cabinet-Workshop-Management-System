import type { ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
}

export function DirectorNavGroup({ label, children }: Props) {
  return (
    <>
      <p className="th-director-nav-label">{label}</p>
      {children}
    </>
  )
}
