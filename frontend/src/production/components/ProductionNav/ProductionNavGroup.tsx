import type { ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
}

export function ProductionNavGroup({ label, children }: Props) {
  return (
    <>
      <p className="th-production-nav-label">{label}</p>
      {children}
    </>
  )
}
