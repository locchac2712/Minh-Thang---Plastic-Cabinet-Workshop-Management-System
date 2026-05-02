/* eslint-disable react-hooks/set-state-in-effect -- tải dữ liệu bất đồng bộ theo key; reset state khi tắt. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Opts<T> = { enabled: boolean; isEmpty: (d: T) => boolean }

/**
 * Tải dữ liệu biểu đồ: trọng tâm `queryKey` + `enabled` để bắt tải lại.
 * `fetcher` luôn cập nhật qua ref (tránh eslint ref trong render) để mỗi màn tạo hàm inline an toàn.
 */
export function useQueryChart<T>(queryKey: string, fetcher: () => Promise<T>, { enabled, isEmpty }: Opts<T>) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(!!enabled)
  const [error, setError] = useState<string | null>(null)
  const fetcherRef = useRef(fetcher)
  useLayoutEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    if (!enabled) {
      setData(null)
      setIsLoading(false)
      setError(null)
      return
    }
    let c = true
    setIsLoading(true)
    setError(null)
    void fetcherRef
      .current()
      .then((d) => {
        if (!c) return
        setData(d)
        setError(null)
        setIsLoading(false)
      })
      .catch((e) => {
        if (!c) return
        setData(null)
        setError(e instanceof Error ? e.message : 'Không tải được dữ liệu biểu đồ.')
        setIsLoading(false)
      })
    return () => {
      c = false
    }
  }, [queryKey, enabled])

  const empty = data !== null && isEmpty(data)
  return { data, isLoading, error, isEmpty: empty }
}
