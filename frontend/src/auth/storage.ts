export const AUTH_KEY = 'tunhuaerp_auth'
export const AUTH_ACTOR_KEY = 'tunhuaerp_actor'
export const AUTH_TOKEN_KEY = 'tunhuaerp_access_token'
export const AUTH_TOKEN_TYPE_KEY = 'tunhuaerp_token_type'
export const AUTH_ROLE_KEY = 'tunhuaerp_role'
export const AUTH_FULL_NAME_KEY = 'tunhuaerp_full_name'

export type AppActor = 'admin' | 'seller' | 'director' | 'production' | 'accountant'

const ACTOR_HOME: Record<AppActor, string> = {
  admin: '/admin',
  seller: '/seller',
  director: '/director',
  production: '/production',
  accountant: '/accountant',
}

/**
 * Backend có thể trả "ADMIN" hoặc "ROLE_ADMIN".
 * Chuẩn hóa về actor route trong frontend.
 */
export function resolveActorFromRole(role: string | null | undefined): AppActor {
  const normalized = (role ?? '').trim().toUpperCase()
  if (normalized === 'SELLER' || normalized === 'ROLE_SELLER') return 'seller'
  if (normalized === 'DIRECTOR' || normalized === 'ROLE_DIRECTOR') return 'director'
  if (normalized === 'PRODUCTION' || normalized === 'ROLE_PRODUCTION') return 'production'
  if (normalized === 'ACCOUNTANT' || normalized === 'ROLE_ACCOUNTANT') return 'accountant'
  if (normalized === 'ADMIN' || normalized === 'ROLE_ADMIN') return 'admin'
  return 'admin'
}

export function homePathForActor(actor: AppActor): string {
  return ACTOR_HOME[actor]
}

export function accountPathForActor(actor: AppActor): string {
  return `${ACTOR_HOME[actor]}/account`
}

export function getStoredActor(): AppActor | null {
  const raw = localStorage.getItem(AUTH_ACTOR_KEY) ?? sessionStorage.getItem(AUTH_ACTOR_KEY)
  if (
    raw === 'admin' ||
    raw === 'seller' ||
    raw === 'director' ||
    raw === 'production' ||
    raw === 'accountant'
  ) {
    return raw
  }
  return null
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === '1' || sessionStorage.getItem(AUTH_KEY) === '1'
}

export function persistAuthSession(params: {
  accessToken: string
  tokenType: string
  role: string
  fullName: string
  remember: boolean
}): void {
  const actor = resolveActorFromRole(params.role)
  const target = params.remember ? localStorage : sessionStorage
  const other = params.remember ? sessionStorage : localStorage

  // Không giữ session cũ khác kiểu remember để tránh lệch role/token.
  for (const key of [
    AUTH_KEY,
    AUTH_ACTOR_KEY,
    AUTH_TOKEN_KEY,
    AUTH_TOKEN_TYPE_KEY,
    AUTH_ROLE_KEY,
    AUTH_FULL_NAME_KEY,
  ]) {
    other.removeItem(key)
  }

  target.setItem(AUTH_KEY, '1')
  target.setItem(AUTH_ACTOR_KEY, actor)
  target.setItem(AUTH_TOKEN_KEY, params.accessToken)
  target.setItem(AUTH_TOKEN_TYPE_KEY, params.tokenType)
  target.setItem(AUTH_ROLE_KEY, params.role)
  target.setItem(AUTH_FULL_NAME_KEY, params.fullName)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY)
}

export function getTokenType(): string {
  return localStorage.getItem(AUTH_TOKEN_TYPE_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_TYPE_KEY) ?? 'Bearer'
}

function getPrimaryAuthStorage(): Storage {
  if (localStorage.getItem(AUTH_KEY) === '1') return localStorage
  if (sessionStorage.getItem(AUTH_KEY) === '1') return sessionStorage
  return localStorage
}

export function syncAuthIdentityFromMe(params: { role: string; fullName: string }): void {
  const actor = resolveActorFromRole(params.role)
  const target = getPrimaryAuthStorage()

  target.setItem(AUTH_ACTOR_KEY, actor)
  target.setItem(AUTH_ROLE_KEY, params.role)
  target.setItem(AUTH_FULL_NAME_KEY, params.fullName)
}

export function clearAuthStorage(): void {
  for (const s of [localStorage, sessionStorage]) {
    for (const key of [
      AUTH_KEY,
      AUTH_ACTOR_KEY,
      AUTH_TOKEN_KEY,
      AUTH_TOKEN_TYPE_KEY,
      AUTH_ROLE_KEY,
      AUTH_FULL_NAME_KEY,
    ]) {
      s.removeItem(key)
    }
  }
}
