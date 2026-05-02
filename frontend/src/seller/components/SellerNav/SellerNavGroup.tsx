import type { ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
}

export function SellerNavGroup({ label, children }: Props) {
  return (
    <>
      <p className="th-seller-nav-label">{label}</p>
      {children}
    </>
  )
}
