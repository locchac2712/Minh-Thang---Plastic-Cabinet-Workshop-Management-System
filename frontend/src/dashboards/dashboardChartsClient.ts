import { getAccessToken, getTokenType } from '../auth/storage'
import type { ApiEnvelope } from './chartTypes'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export class DashboardChartApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'DashboardChartApiError'
    this.statusCode = statusCode
  }
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

/**
 * GET JSON, unwrap `ApiResponse.data`. Có `Authorization: Bearer` khi cần.
 * `unauthenticated` nếu false thì bỏ header (dùng cho tài liệu — thực tế mọi chart cần token).
 */
export async function fetchChartJsonGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const qs = params ? buildQueryString(params) : ''
  const res = await fetch(`${API_BASE_URL}${path}${qs}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })

  let envelope: ApiEnvelope<T> | null = null
  try {
    envelope = (await res.json()) as ApiEnvelope<T>
  } catch {
    throw new DashboardChartApiError('Phản hồi API không hợp lệ (JSON).', res.status)
  }

  if (!envelope) {
    throw new DashboardChartApiError('Phản hồi rỗng từ máy chủ.', res.status)
  }

  if (res.status === 401 || res.status === 403) {
    throw new DashboardChartApiError(envelope.message || 'Hết hạn hoặc không đủ quyền.', res.status)
  }

  if (!envelope.success || res.status < 200 || res.status >= 300) {
    throw new DashboardChartApiError(
      envelope.message || `Lỗi tải biểu đồ (HTTP ${res.status}).`,
      typeof envelope.statusCode === 'number' ? envelope.statusCode : res.status,
    )
  }

  return envelope.data as T
}
