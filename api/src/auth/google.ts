import { OAuth2Client } from 'google-auth-library'
import { env } from '../env'

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID)

export type GoogleUser = {
  googleSub: string
  email?: string
  emailVerified?: boolean
  name?: string
  picture?: string
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUser> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload?.sub) throw new Error('Invalid Google token payload')

  return {
    googleSub: payload.sub,
    email: payload.email ?? undefined,
    emailVerified: payload.email_verified ?? undefined,
    name: payload.name ?? undefined,
    picture: payload.picture ?? undefined,
  }
}

