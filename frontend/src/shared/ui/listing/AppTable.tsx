import { Table, type TableProps } from 'antd'
import './listing.css'

export function AppTable<T extends object>(props: TableProps<T>) {
  return (
    <div className="th-listing-table-shell">
      <Table<T>
        {...props}
        pagination={false}
        size={props.size ?? 'middle'}
      />
    </div>
  )
}
