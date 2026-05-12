export type BuzzitUser = {
  id: string
  email?: string
  name?: string
  picture?: string
}

const TOKEN_KEY = 'buzzit.token'
const USER_KEY = 'buzzit.user'

export function getSession() {
  const token = localStorage.getItem(TOKEN_KEY)
  const userRaw = localStorage.getItem(USER_KEY)
  const user = userRaw ? (JSON.parse(userRaw) as BuzzitUser) : null
  return { token, user }
}

export function setSession(token: string, user: BuzzitUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

