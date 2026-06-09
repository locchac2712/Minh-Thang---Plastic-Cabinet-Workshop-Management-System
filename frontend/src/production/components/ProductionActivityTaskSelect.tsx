import { Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import {
  productionTaskStatusLabel,
  type ProductionTaskDto,
} from '../productionTasksApi'
import { productionOrderRefLabel } from '../utils/productionOrderRef'
import { productionTaskRef } from '../utils/productionTaskRef'

const SEARCH_DEBOUNCE_MS = 320

function formatActivityTaskOptionLabel(t: ProductionTaskDto): string {
  const name = (
    t.productName?.trim() ||
    t.customRequirements?.trim()?.slice(0, 48) ||
    'Lệnh SX'
  ).slice(0, 52)
  const status = productionTaskStatusLabel(t.status)
  const taskRef = productionTaskRef(t)
  const qty = `SL ${t.quantity}`
  const dh = productionOrderRefLabel(t.orderDisplayCode)
  if (dh) {
    return `${taskRef} · ${name} · ${qty} · ${status} · đơn ${dh}`
  }
  return `${taskRef} · ${name} · ${qty} · ${status}`
}

function taskMatchesSearch(t: ProductionTaskDto, q: string): boolean {
  const oid = t.orderId ?? ''
  return (
    t.id.toLowerCase().includes(q) ||
    (t.displayCode ?? '').toLowerCase().includes(q) ||
    (t.orderDisplayCode ?? '').toLowerCase().includes(q) ||
    oid.toLowerCase().includes(q) ||
    String(t.quantity).includes(q) ||
    (t.productName ?? '').toLowerCase().includes(q) ||
    (t.customRequirements ?? '').toLowerCase().includes(q)
  )
}

type Props = {
  value: string
  onChangeValue: (taskId: string) => void
  tasks: ProductionTaskDto[]
  loading?: boolean
  disabled?: boolean
  className?: string
  id?: string
}

/** Dropdown chọn lệnh — tìm trong panel (debounce), giống các combobox khác trong dự án. */
export function ProductionActivityTaskSelect({
  value,
  onChangeValue,
  tasks,
  loading = false,
  disabled = false,
  className,
  id,
}: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const filteredTasks = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    let list = !q ? tasks : tasks.filter((t) => taskMatchesSearch(t, q))
    if (value) {
      const selected = tasks.find((t) => t.id === value)
      if (selected && !list.some((t) => t.id === value)) {
        list = [selected, ...list]
      }
    }
    return list
  }, [tasks, debouncedSearch, value])

  const options = useMemo(
    () =>
      filteredTasks.map((t) => ({
        value: t.id,
        label: formatActivityTaskOptionLabel(t),
      })),
    [filteredTasks],
  )

  const selectValue = value || undefined

  return (
    <Select
      id={id}
      showSearch
      filterOption={false}
      value={selectValue}
      options={options}
      loading={loading}
      disabled={disabled}
      className={className}
      placeholder="Tìm mã lệnh, đơn, sản phẩm…"
      searchValue={pickerOpen ? searchInput : undefined}
      onSearch={setSearchInput}
      onOpenChange={(open) => {
        setPickerOpen(open)
        if (!open) {
          setSearchInput('')
          setDebouncedSearch('')
        }
      }}
      onChange={(next) => onChangeValue(next ?? '')}
      notFoundContent={
        loading
          ? 'Đang tải lệnh…'
          : tasks.length === 0
            ? 'Không có lệnh nào đang giao cho bạn'
            : 'Không có lệnh phù hợp'
      }
      optionFilterProp="label"
      allowClear
    />
  )
}
