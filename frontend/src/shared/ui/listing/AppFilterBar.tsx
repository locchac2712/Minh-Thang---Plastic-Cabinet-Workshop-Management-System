import type { PropsWithChildren } from 'react'
import './listing.css'

type AppFilterBarProps = PropsWithChildren<{
  className?: string
}>

type AppFilterFieldProps = PropsWithChildren<{
  className?: string
  label?: string
  search?: boolean
}>

type AppFilterActionsProps = PropsWithChildren<{
  className?: string
}>

function mergeClass(base: string, addon?: string): string {
  return addon ? `${base} ${addon}` : base
}

export function AppFilterBar({ className, children }: AppFilterBarProps) {
  return <div className={mergeClass('th-listing-filter-bar', className)}>{children}</div>
}

export function AppFilterField({ className, label, search = false, children }: AppFilterFieldProps) {
  const rootClass = mergeClass(
    `th-listing-filter-field${search ? ' th-listing-filter-field--search' : ''}`,
    className,
  )
  return (
    <label className={rootClass}>
      {label ? <span className="th-listing-filter-label">{label}</span> : null}
      {children}
    </label>
  )
}

export function AppFilterActions({ className, children }: AppFilterActionsProps) {
  return <div className={mergeClass('th-listing-filter-actions', className)}>{children}</div>
}
