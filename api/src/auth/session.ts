import jwt from 'jsonwebtoken'
import { env } from '../env'

export type AppSession = {
  userId: string
  email?: string
  name?: string
  picture?: string
}

export function issueSessionJwt(session: AppSession) {
  return jwt.sign(
    {
      sub: session.userId,
      email: session.email,
      name: session.name,
      picture: session.picture,
    },
    env.JWT_SECRET,
    { expiresIn: '7d', issuer: 'buzzit-api', audience: 'buzzit-web' },
  )
}

