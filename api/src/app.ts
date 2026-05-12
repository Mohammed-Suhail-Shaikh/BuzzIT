import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import { corsOrigin } from './env'
import { verifyGoogleIdToken } from './auth/google'
import { issueSessionJwt } from './auth/session'

export const app = express()

app.use(
  cors({
    origin: corsOrigin,
    credentials: false,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const GoogleAuthSchema = z.object({
  credential: z.string().min(1),
})

app.post('/auth/google', async (req, res) => {
  const parsed = GoogleAuthSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  try {
    const user = await verifyGoogleIdToken(parsed.data.credential)

    const userId = `google:${user.googleSub}`

    const token = issueSessionJwt({
      userId,
      email: user.email,
      name: user.name,
      picture: user.picture,
    })

    return res.json({
      token,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    })
  } catch {
    return res.status(401).json({ error: 'Google token verification failed' })
  }
})

export default app
