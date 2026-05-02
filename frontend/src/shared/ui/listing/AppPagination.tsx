import { Pagination } from 'antd'
import './listing.css'

type AppPaginationProps = {
  pageIndex: number
  pageSize: number
  total: number
  pageSizeOptions?: number[]
  simple?: boolean
  showSizeChanger?: boolean
  className?: string
  onPageIndexChange: (nextPageIndex: number) => void
  onPageSizeChange?: (nextPageSize: number) => void
}

function mergeClass(base: string, addon?: string): string {
  return addon ? `${base} ${addon}` : base
}

export function AppPagination({
  pageIndex,
  pageSize,
  total,
  pageSizeOptions,
  simple = false,
  showSizeChanger = true,
  className,
  onPageIndexChange,
  onPageSizeChange,
}: AppPaginationProps) {
  const current = total > 0 ? pageIndex + 1 : 1

  return (
    <div className={mergeClass('th-listing-pagination', className)}>
      <p className="th-listing-pagination__meta">
        {total > 0 ? (
          <>
            Hiển thị <strong>{pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, total)}</strong> / {total}
          </>
        ) : (
          <>Không có dữ liệu</>
        )}
      </p>
      <Pagination
        current={current}
        total={total}
        pageSize={pageSize}
        simple={simple}
        showSizeChanger={showSizeChanger}
        pageSizeOptions={pageSizeOptions?.map(String)}
        onChange={(nextPage, nextPageSize) => {
          if (nextPageSize !== pageSize) {
            onPageSizeChange?.(nextPageSize)
          }
          onPageIndexChange(Math.max(0, nextPage - 1))
        }}
      />
    </div>
  )
}
