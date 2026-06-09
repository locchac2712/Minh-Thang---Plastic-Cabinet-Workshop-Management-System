import type { PublicTaskTrackDto } from '../shared/productionProgress/publicTrackTypes'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export async function fetchPublicTaskTrack(token: string): Promise<PublicTaskTrackDto> {
  const trimmed = token.trim()
  if (!trimmed) {
    throw new Error('Thiếu mã theo dõi')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/public/track/${encodeURIComponent(trimmed)}`,
    { headers: { accept: '*/*' } },
  )
  const body = (await res.json().catch(() => null)) as ApiEnvelope<PublicTaskTrackDto> | null
  if (!res.ok || !body?.success || !body.data) {
    const msg = body?.message || 'Liên kết không hợp lệ hoặc đã hết hạn'
    throw new Error(msg)
  }
  return body.data
}
