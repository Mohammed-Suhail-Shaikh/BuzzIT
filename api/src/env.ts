import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3001),
  WEB_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  JWT_SECRET: z.string().min(16),
})

export const env = EnvSchema.parse({
  PORT: process.env.PORT,
  WEB_ORIGIN: process.env.WEB_ORIGIN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  JWT_SECRET: process.env.JWT_SECRET,
})

/** Comma-separated in `WEB_ORIGIN` — supports both Vite ports in dev. */
export const webCorsOrigins = env.WEB_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean)

/**
 * Use `WEB_ORIGIN=*` on Vercel so any `*.vercel.app` (or other) site can call the API
 * without listing every preview URL. Tighten to comma-separated origins for production hardening.
 */
export const corsOrigin: boolean | string | string[] =
  webCorsOrigins.length === 1 && webCorsOrigins[0] === '*'
    ? true
    : webCorsOrigins.length === 1
      ? webCorsOrigins[0]
      : webCorsOrigins

