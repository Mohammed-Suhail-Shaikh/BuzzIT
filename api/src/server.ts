import 'dotenv/config'
import app from './app'
import { env } from './env'

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`BuzzIT API listening on http://localhost:${env.PORT}`)
})
