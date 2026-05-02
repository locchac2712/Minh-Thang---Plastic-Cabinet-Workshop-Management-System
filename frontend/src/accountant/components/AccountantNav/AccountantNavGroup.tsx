import type { ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
}

export function AccountantNavGroup({ label, children }: Props) {
  return (
    <>
      <p className="th-accountant-nav-label">{label}</p>
      {children}
    </>
  )
}
