import { Select } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchProductionOrderById,
  fetchProductionOrders,
  type ProductionOrderQueueItemDto,
} from '../productionOrdersApi'
import { productionOrderRef } from '../utils/productionOrderRef'

const SEARCH_DEBOUNCE_MS = 320
const ORDER_PICKER_SIZE = 50

export type ProductionBoardOrderHint = {
  orderId: string
  orderDisplayCode?: string | null
  agencyName?: string | null
}

function formatOrderOptionLabel(o: ProductionBoardOrderHint | ProductionOrderQueueItemDto): string {
  const code = productionOrderRef(o.orderId, o.orderDisplayCode)
  const agency = o.agencyName?.trim()
  return agency ? `${code} · ${agency}` : code
}

function hintToQueueItem(h: ProductionBoardOrderHint): ProductionOrderQueueItemDto {
  return {
    orderId: h.orderId,
    orderDisplayCode: h.orderDisplayCode ?? null,
    agencyName: h.agencyName?.trim() || '—',
    expectedDeliveryDate: null,
    createdAt: '',
    taskCount: 0,
    remainingBatchableTotal: 0,
    hasPendingBatch: false,
  }
}

type Props = {
  value: string
  onChangeValue: (next: string) => void
  allOptionLabel: string
  className?: string
  /** Đơn suy ra từ lệnh trên bảng — luôn hiện trong dropdown. */
  taskOrderHints?: ProductionBoardOrderHint[]
}

/** Dropdown lọc đơn — tìm DH / đại lý / UUID qua API (debounce). */
export function ProductionBoardOrderFilter({
  value,
  onChangeValue,
  allOptionLabel,
  className,
  taskOrderHints = [],
}: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [remoteOrders, setRemoteOrders] = useState<ProductionOrderQueueItemDto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pinnedSelected, setPinnedSelected] = useState<ProductionOrderQueueItemDto | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const loadOrders = useCallback(async (search: string) => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProductionOrders({
        status: 'Producing',
        search: search || undefined,
        page: 0,
        size: ORDER_PICKER_SIZE,
      })
      setRemoteOrders(data.content)
    } catch (e) {
      setRemoteOrders([])
      setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách đơn')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!pickerOpen) return
    void loadOrders(debouncedSearch)
  }, [pickerOpen, debouncedSearch, loadOrders])

  useEffect(() => {
    if (value === 'all') {
      setPinnedSelected(null)
      return
    }
    const inRemote = remoteOrders.some((o) => o.orderId === value)
    const inHints = taskOrderHints.some((h) => h.orderId === value)
    if (inRemote || inHints) {
      return
    }
    let cancelled = false
    void fetchProductionOrderById(value)
      .then((detail) => {
        if (cancelled) return
        setPinnedSelected({
          orderId: detail.orderId,
          orderDisplayCode: detail.orderDisplayCode ?? null,
          agencyName: detail.agencyName,
          expectedDeliveryDate: detail.expectedDeliveryDate,
          createdAt: detail.createdAt,
          taskCount: detail.taskCount,
          remainingBatchableTotal: detail.remainingBatchableTotal,
          hasPendingBatch: detail.hasPendingBatch,
        })
      })
      .catch(() => {
        if (!cancelled) setPinnedSelected(null)
      })
    return () => {
      cancelled = true
    }
  }, [value, remoteOrders, taskOrderHints])

  const mergedOrders = useMemo(() => {
    const map = new Map<string, ProductionOrderQueueItemDto>()
    for (const h of taskOrderHints) {
      if (!h.orderId) continue
      map.set(h.orderId, hintToQueueItem(h))
    }
    for (const o of remoteOrders) {
      map.set(o.orderId, o)
    }
    if (pinnedSelected) {
      map.set(pinnedSelected.orderId, pinnedSelected)
    }
    return [...map.values()].sort((a, b) =>
      formatOrderOptionLabel(a).localeCompare(formatOrderOptionLabel(b), 'vi'),
    )
  }, [taskOrderHints, remoteOrders, pinnedSelected])

  const options = useMemo(
    () => [
      { value: 'all', label: allOptionLabel },
      ...mergedOrders.map((o) => ({
        value: o.orderId,
        label: formatOrderOptionLabel(o),
      })),
    ],
    [allOptionLabel, mergedOrders],
  )

  return (
    <Select
      showSearch
      filterOption={false}
      value={value}
      options={options}
      loading={loading}
      className={className}
      placeholder="Tìm DH, đại lý…"
      searchValue={pickerOpen ? searchInput : undefined}
      onSearch={setSearchInput}
      onOpenChange={(open) => {
        setPickerOpen(open)
        if (!open) {
          setSearchInput('')
          setDebouncedSearch('')
        }
      }}
      onChange={(next) => onChangeValue(next ?? 'all')}
      notFoundContent={
        loadError ? loadError : loading ? 'Đang tải đơn…' : 'Không có đơn phù hợp'
      }
      optionFilterProp="label"
    />
  )
}
