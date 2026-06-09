type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
  errors?: Record<string, string> | null
  timestamp?: string
}

type LoginPayload = {
  username: string
  password: string
}

export type LoginData = {
  accessToken: string
  tokenType: string
  role: string
  fullName: string
}

export type MeData = {
  id: string
  username: string
  email: string
  fullName: string
  role: string
  isActive: boolean
  createdAt: string
}

export class AuthApiError extends Error {
  statusCode: number
  /** Lỗi validation theo field (HTTP 400) — ví dụ `email`, `newPassword`. */
  fieldErrors?: Record<string, string>

  constructor(message: string, statusCode: number, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'AuthApiError'
    this.statusCode = statusCode
    this.fieldErrors = fieldErrors
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export async function loginWithApi(payload: LoginPayload): Promise<LoginData> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  let envelope: ApiEnvelope<LoginData> | null = null
  try {
    envelope = (await res.json()) as ApiEnvelope<LoginData>
  } catch {
    // giữ null để fallback message bên dưới
  }

  if (!res.ok || !envelope?.success || !envelope.data) {
    const message =
      envelope?.message?.trim() ||
      (res.status === 401 ? 'Xác thực thất bại: Bad credentials' : 'Đăng nhập thất bại')
    const statusCode = envelope?.statusCode ?? res.status
    throw new AuthApiError(message, statusCode)
  }

  return envelope.data
}

/**
 * Quên mật khẩu — không gửi Authorization. Thành công: `message` luôn giống nhau (chống lộ danh bạ).
 */
export async function forgotPasswordWithApi(payload: { email: string }): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: payload.email.trim() }),
  })

  let envelope: ApiEnvelope<null> | null = null
  try {
    envelope = (await res.json()) as ApiEnvelope<null>
  } catch {
    /* empty */
  }

  if (!res.ok || !envelope?.success) {
    const message =
      envelope?.message?.trim() ||
      (res.status === 503
        ? 'Không gửi được email. Vui lòng thử lại sau hoặc liên hệ quản trị.'
        : 'Không gửi được yêu cầu đặt lại mật khẩu.')
    const statusCode = envelope?.statusCode ?? res.status
    const fieldErrors = envelope?.errors ?? undefined
    throw new AuthApiError(message, statusCode, fieldErrors)
  }

  return envelope.message?.trim() || 'Đã gửi hướng dẫn.'
}

/**
 * Đặt lại mật khẩu từ token trong email — không gửi Authorization.
 */
export async function resetPasswordWithApi(payload: { token: string; newPassword: string }): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: payload.token,
      newPassword: payload.newPassword,
    }),
  })

  let envelope: ApiEnvelope<null> | null = null
  try {
    envelope = (await res.json()) as ApiEnvelope<null>
  } catch {
    /* empty */
  }

  if (!res.ok || !envelope?.success) {
    const message =
      envelope?.message?.trim() ||
      'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'
    const statusCode = envelope?.statusCode ?? res.status
    const fieldErrors = envelope?.errors ?? undefined
    throw new AuthApiError(message, statusCode, fieldErrors)
  }

  return envelope.message?.trim() || 'Đặt lại mật khẩu thành công.'
}

export async function fetchMeProfile(params: {
  accessToken: string
  tokenType?: string
}): Promise<MeData> {
  const tokenType = params.tokenType?.trim() || 'Bearer'
  const res = await fetch(`${API_BASE_URL}/api/me`, {
    method: 'GET',
    headers: {
      Accept: '*/*',
      Authorization: `${tokenType} ${params.accessToken}`,
    },
  })

  let envelope: ApiEnvelope<MeData> | null = null
  try {
    envelope = (await res.json()) as ApiEnvelope<MeData>
  } catch {
    // keep null for fallback
  }

  if (!res.ok || !envelope?.success || !envelope.data) {
    const message = envelope?.message?.trim() || (res.status === 401 ? 'Unauthorized' : 'Không lấy được hồ sơ')
    const statusCode = envelope?.statusCode ?? res.status
    throw new AuthApiError(message, statusCode)
  }

  return envelope.data
}

function authHeaders(accessToken: string, tokenType?: string): HeadersInit {
  const type = tokenType?.trim() || 'Bearer'
  return {
    Accept: '*/*',
    'Content-Type': 'application/json',
    Authorization: `${type} ${accessToken}`,
  }
}

export async function updateMeProfile(params: {
  accessToken: string
  tokenType?: string
  fullName: string
}): Promise<MeData> {
  const res = await fetch(`${API_BASE_URL}/api/me`, {
    method: 'PATCH',
    headers: authHeaders(params.accessToken, params.tokenType),
    body: JSON.stringify({ fullName: params.fullName.trim() }),
  })

  let envelope: ApiEnvelope<MeData> | null = null
  try {
    envelope = (await res.json()) as ApiEnvelope<MeData>
  } catch {
    /* empty */
  }

  if (!res.ok || !envelope?.success || !envelope.data) {
    const message = envelope?.message?.trim() || 'Cập nhật hồ sơ thất bại'
    const statusCode = envelope?.statusCode ?? res.status
    throw new AuthApiError(message, statusCode, envelope?.errors ?? undefined)
  }

  return envelope.data
}

export async function changeMyPassword(params: {
  accessToken: string
  tokenType?: string
  currentPassword: string
  newPassword: string
}): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/me/password`, {
    method: 'PATCH',
    headers: authHeaders(params.accessToken, params.tokenType),
    body: JSON.stringify({
      currentPassword: params.currentPassword,
      newPassword: params.newPassword,
    }),
  })

  let envelope: ApiEnvelope<null> | null = null
  try {
    envelope = (await res.json()) as ApiEnvelope<null>
  } catch {
    /* empty */
  }

  if (!res.ok || !envelope?.success) {
    const message = envelope?.message?.trim() || 'Đổi mật khẩu thất bại'
    const statusCode = envelope?.statusCode ?? res.status
    throw new AuthApiError(message, statusCode, envelope?.errors ?? undefined)
  }

  return envelope.message?.trim() || 'Đổi mật khẩu thành công.'
}
