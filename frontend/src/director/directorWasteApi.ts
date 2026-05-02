/**
 * Director — hao phí WASTE (inventory_logs, task PIC).
 * @see director.md (gốc spec), documents/api/director.md
 */
import { getAccessToken, getTokenType } from '../auth/storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'
const B = `${API_BASE_URL}/api/director/waste`

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

function unwrapData<T>(body: unknown, what: string): T {
  const w = body as ApiEnvelope<T>
  if (w && typeof w === 'object' && w.success && w.data !== undefined) {
    return w.data as T
  }
  throw new Error(
    w && typeof w === 'object' && 'message' in w
      ? String((w as ApiEnvelope<unknown>).message)
      : `Phản hồi ${what} không hợp lệ`,
  )
}

export type DirectorWasteSummary = {
  estimatedDamageVnd: number
  wasteEventCount: number
  discardedBoardEquivalent: number
  teamsNeedingActionCount: number
}

export type WasteSeverity = 'CRITICAL' | 'HIGH' | 'WATCH' | 'OK'

export type DirectorWasteTeamRow = {
  rank: number
  teamUserId: string
  teamLabel: string | null
  areaLabel: string | null
  picName: string | null
  eventCount: number
  boardEquivalent: number
  estimatedDamageVnd: number
  trendPercent: number | null
  severity: WasteSeverity
}

export type DirectorWasteMaterialRow = {
  materialId: string
  materialCode: string
  materialName: string
  quantityAbs: number
  damageVnd: number
}

export type DirectorWasteTeamDetails = {
  teamUserId: string
  picName: string | null
  teamLabel: string | null
  areaLabel: string | null
  latestEventAt: string | null
  topMaterialCode: string | null
  topMaterialName: string | null
  equivalentAreaSqm: number | null
  materialRows: DirectorWasteMaterialRow[]
  remark: string | null
}

export type WasteDateRange = {
  fromDate: string
  toDate: string
}

export type FetchWasteTeamsParams = WasteDateRange & {
  severity?: WasteSeverity
  search?: string
}

export async function fetchWasteSummary(range: WasteDateRange): Promise<DirectorWasteSummary> {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  const q = new URLSearchParams()
  q.set('from_date', range.fromDate)
  q.set('to_date', range.toDate)
  const res = await fetch(`${B}/summary?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const body = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in (body as object)
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không tải được tổng hợp hao phí')
  }
  return unwrapData<DirectorWasteSummary>(body, 'tổng hợp hao phí')
}

export async function fetchWasteTeams(params: FetchWasteTeamsParams): Promise<DirectorWasteTeamRow[]> {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  const q = new URLSearchParams()
  q.set('from_date', params.fromDate)
  q.set('to_date', params.toDate)
  if (params.severity) q.set('severity', params.severity)
  if (params.search?.trim()) q.set('search', params.search.trim())
  const res = await fetch(`${B}/teams?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const body = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in (body as object)
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không tải được bảng tổ theo hao phí')
  }
  return unwrapData<DirectorWasteTeamRow[]>(body, 'bảng tổ hao phí')
}

export async function fetchWasteTeamDetails(
  teamUserId: string,
  range: WasteDateRange,
): Promise<DirectorWasteTeamDetails> {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  const q = new URLSearchParams()
  q.set('from_date', range.fromDate)
  q.set('to_date', range.toDate)
  const res = await fetch(
    `${B}/teams/${encodeURIComponent(teamUserId)}/details?${q.toString()}`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const body = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in (body as object)
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không tải được chi tiết hao phí tổ')
  }
  return unwrapData<DirectorWasteTeamDetails>(body, 'chi tiết tổ hao phí')
}

export type PutWasteRemarkBody = { remark: string | null }

export async function putWasteTeamRemark(
  teamUserId: string,
  range: WasteDateRange,
  body: PutWasteRemarkBody,
): Promise<void> {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  const q = new URLSearchParams()
  q.set('from_date', range.fromDate)
  q.set('to_date', range.toDate)
  const res = await fetch(
    `${B}/teams/${encodeURIComponent(teamUserId)}/remark?${q.toString()}`,
    {
      method: 'PUT',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
      body: JSON.stringify({ remark: body.remark === '' ? null : body.remark }),
    },
  )
  const out = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const msg =
      out && typeof out === 'object' && 'message' in (out as object)
        ? String((out as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không lưu được nhận xét')
  }
  const env = out as ApiEnvelope<null>
  if (env && typeof env === 'object' && 'success' in env && !env.success) {
    throw new Error(env.message || 'Không lưu được nhận xét')
  }
}
