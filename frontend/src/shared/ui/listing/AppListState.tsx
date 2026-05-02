import type { PropsWithChildren } from 'react'
import { Alert, Empty, Spin } from 'antd'
import './listing.css'

type AppListStateProps = PropsWithChildren<{
  loading?: boolean
  error?: string | null
  isEmpty?: boolean
  emptyDescription?: string
  loadingLabel?: string
}>

export function AppListState({
  loading = false,
  error = null,
  isEmpty = false,
  emptyDescription = 'Không có dữ liệu',
  loadingLabel = 'Đang tải dữ liệu...',
  children,
}: AppListStateProps) {
  if (loading) {
    return (
      <div className="th-listing-state">
        <Spin tip={loadingLabel} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="th-listing-state">
        <Alert type="error" showIcon message={error} />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="th-listing-state">
        <Empty description={emptyDescription} />
      </div>
    )
  }

  return <>{children}</>
}
