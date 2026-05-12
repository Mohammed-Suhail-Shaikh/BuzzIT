import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import { env, webCorsOrigins } from './env'
import { verifyGoogleIdToken } from './auth/google'
import { issueSessionJwt } from './auth/session'

const app = express()

app.use(
  cors({
    origin: webCorsOrigins.length === 1 ? webCorsOrigins[0] : webCorsOrigins,
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

    // For now, userId = stable Google subject.
    // Later: store in Mongo and map to internal user ids.
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
  } catch (e) {
    return res.status(401).json({ error: 'Google token verification failed' })
  }
})

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`BuzzIT API listening on http://localhost:${env.PORT}`)
})

