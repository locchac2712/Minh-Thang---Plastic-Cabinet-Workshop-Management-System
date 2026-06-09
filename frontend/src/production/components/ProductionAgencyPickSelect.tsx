import { Select } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchProductionAgenciesPage,
  mapAgencyRow,
  type ProductionAgencyPickRow,
} from '../productionCustomProductsApi'

const SEARCH_DEBOUNCE_MS = 320
const PAGE_SIZE = 50

function formatAgencyOptionLabel(a: ProductionAgencyPickRow): string {
  const name = a.name.trim()
  const tax = a.taxCode?.trim()
  const legal = a.legalCompanyName?.trim()
  const parts = [name]
  if (tax) parts.push(`MST ${tax}`)
  if (legal && legal !== name) parts.push(legal)
  return parts.join(' · ')
}

type Props = {
  value: string
  onChangeValue: (agencyId: string, agency?: ProductionAgencyPickRow) => void
  className?: string
  id?: string
  disabled?: boolean
  /** Chỉ đại lý đang active — mặc định true. */
  activeOnly?: boolean
}

/** Dropdown chọn đại lý — API + tìm debounce trong panel. */
export function ProductionAgencyPickSelect({
  value,
  onChangeValue,
  className,
  id,
  disabled = false,
  activeOnly = true,
}: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [remoteAgencies, setRemoteAgencies] = useState<ProductionAgencyPickRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pinnedSelected, setPinnedSelected] = useState<ProductionAgencyPickRow | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const loadAgencies = useCallback(
    async (search: string) => {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await fetchProductionAgenciesPage({
          search: search || undefined,
          page: 0,
          size: PAGE_SIZE,
          isActive: activeOnly ? true : undefined,
        })
        setRemoteAgencies(data.content.map(mapAgencyRow))
      } catch (e) {
        setRemoteAgencies([])
        setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách đại lý')
      } finally {
        setLoading(false)
      }
    },
    [activeOnly],
  )

  useEffect(() => {
    if (!pickerOpen) return
    void loadAgencies(debouncedSearch)
  }, [pickerOpen, debouncedSearch, loadAgencies])

  useEffect(() => {
    if (!value) {
      setPinnedSelected(null)
      return
    }
    const inRemote = remoteAgencies.some((a) => a.id === value)
    if (inRemote || pinnedSelected?.id === value) return
    let cancelled = false
    void fetchProductionAgenciesPage({ search: value, page: 0, size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        const hit = data.content.map(mapAgencyRow).find((a) => a.id === value)
        setPinnedSelected(hit ?? null)
      })
      .catch(() => {
        if (!cancelled) setPinnedSelected(null)
      })
    return () => {
      cancelled = true
    }
  }, [value, remoteAgencies, pinnedSelected?.id])

  const mergedAgencies = useMemo(() => {
    const map = new Map<string, ProductionAgencyPickRow>()
    for (const a of remoteAgencies) {
      map.set(a.id, a)
    }
    if (pinnedSelected) {
      map.set(pinnedSelected.id, pinnedSelected)
    }
    return [...map.values()].sort((a, b) =>
      formatAgencyOptionLabel(a).localeCompare(formatAgencyOptionLabel(b), 'vi'),
    )
  }, [remoteAgencies, pinnedSelected])

  const options = useMemo(
    () =>
      mergedAgencies.map((a) => ({
        value: a.id,
        label: formatAgencyOptionLabel(a),
      })),
    [mergedAgencies],
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
      placeholder="Tìm tên đại lý, MST…"
      searchValue={pickerOpen ? searchInput : undefined}
      onSearch={setSearchInput}
      onOpenChange={(open) => {
        setPickerOpen(open)
        if (!open) {
          setSearchInput('')
          setDebouncedSearch('')
        }
      }}
      onChange={(next) => {
        const id = next ?? ''
        const agency = mergedAgencies.find((a) => a.id === id)
        if (agency) setPinnedSelected(agency)
        onChangeValue(id, agency)
      }}
      notFoundContent={
        loadError ? loadError : loading ? 'Đang tải đại lý…' : 'Không có đại lý phù hợp'
      }
      optionFilterProp="label"
      allowClear
    />
  )
}
