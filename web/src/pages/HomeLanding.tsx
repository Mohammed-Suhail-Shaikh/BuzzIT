import './home-landing.css'
import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, getSession, setSession, type BuzzitUser } from '../lib/session'

const servicePillars = [
  {
    icon: '📍',
    title: 'Nearby & on the map',
    body: 'Browse parties and personal events around you, with map markers so plans feel tangible—not lost in endless group chats.',
  },
  {
    icon: '👋',
    title: 'From people you follow',
    body: 'See what friends and hosts you care about are throwing, alongside broader discovery so nothing good slips by.',
  },
  {
    icon: '🎟️',
    title: 'RSVP, guest lists & QR',
    body: 'RSVP as “going” to join the regular guest list. Host-created lists use their own codes on the event page. After you register, a QR “virtual ticket” lets hosts scan you in at the door.',
  },
  {
    icon: '✨',
    title: 'Party points',
    body: 'When a host checks you in—manually or by scan—you earn party points. One clear reward loop for showing up.',
  },
  {
    icon: '🔒',
    title: 'Public, private & invite-only',
    body: 'Hosts choose visibility. Private events can stay tight, with invite codes where it makes sense—separate from special list codes when hosts segment their crowd.',
  },
  {
    icon: '🔐',
    title: 'Sign in with Google',
    body: 'A fast, familiar way to get an account so you can RSVP, save events, and build your profile of past and upcoming nights.',
  },
] as const

export function HomeLanding() {
  const navigate = useNavigate()
  const [{ token: existingToken, user: existingUser }] = useState(() => getSession())
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [googleInitError, setGoogleInitError] = useState<string | null>(null)
  const [googleCredential, setGoogleCredential] = useState<string | null>(null)
  const [sessionUser, setSessionUser] = useState<BuzzitUser | null>(existingUser)
  const [_sessionToken, setSessionToken] = useState<string | null>(existingToken)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  const signInTitleId = useId()
  const googleButtonId = useId()

  useEffect(() => {
    if (!isSignInOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSignInOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSignInOpen])

  useEffect(() => {
    if (!isSignInOpen) return

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
    if (!clientId) {
      setGoogleInitError('Missing VITE_GOOGLE_CLIENT_ID. Add it to web/.env and restart the dev server.')
      return
    }

    const google = window.google
    if (!google?.accounts?.id) {
      setGoogleInitError('Google sign-in library not loaded yet. Refresh the page and try again.')
      return
    }

    setGoogleInitError(null)
    setGoogleCredential(null)
    setSignInError(null)

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp) => {
        setGoogleCredential(resp.credential)
      },
      cancel_on_tap_outside: false,
    })

    const container = document.getElementById(googleButtonId)
    if (!container) return

    container.innerHTML = ''
    google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 320,
      logo_alignment: 'left',
    })
  }, [googleButtonId, isSignInOpen])

  useEffect(() => {
    if (!googleCredential) return

    const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001'

    setIsSigningIn(true)
    setSignInError(null)

    fetch(`${apiBase}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: googleCredential }),
    })
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as {
          error?: string
          token?: string
          user?: BuzzitUser
        }
        if (!r.ok) {
          throw new Error(data.error ?? `Sign-in failed (${r.status})`)
        }
        if (!data.token || !data.user) {
          throw new Error('Invalid response from server')
        }
        return { token: data.token, user: data.user }
      })
      .then(({ token, user }) => {
        setSession(token, user)
        setSessionUser(user)
        setSessionToken(token)
        setIsSignInOpen(false)
        navigate('/app')
      })
      .catch((err: unknown) => {
        const message =
          err instanceof TypeError
            ? `Cannot reach the API at ${apiBase}. Start the BuzzIT API and check VITE_API_BASE_URL in web/.env.`
            : err instanceof Error
              ? err.message
              : 'Could not sign in right now. Please try again.'
        setSignInError(message)
      })
      .finally(() => setIsSigningIn(false))
  }, [googleCredential, navigate])

  return (
    <div className="landing">
      <div className="landing__bg" aria-hidden />

      <header className="landing__header">
        <a className="landing__logo" href="#top" aria-label="BuzzIT home">
          <span className="landing__logo-placeholder">[Logo placeholder]</span>
        </a>
        <nav className="landing__nav" aria-label="Primary">
          <a href="#idea">The idea</a>
          <a href="#service">How we serve you</a>
          {sessionUser ? (
            <button
              type="button"
              className="landing__nav-btn"
              onClick={() => {
                clearSession()
                setSessionUser(null)
                setSessionToken(null)
                window.google?.accounts?.id?.disableAutoSelect()
              }}
            >
              Sign out
            </button>
          ) : (
            <button type="button" className="landing__nav-btn" onClick={() => setIsSignInOpen(true)}>
              Sign in
            </button>
          )}
        </nav>
      </header>

      <main id="top" className="landing__main">
        <section className="landing__hero" aria-labelledby="hero-heading">
          <div className="landing__hero-inner">
            <p className="landing__eyebrow">A New Way of Hosting Parties & Personal Events</p>
            <h1 id="hero-heading">Where night outs get organized.</h1>
            <p className="landing__hero-lead">
              BuzzIT is for people who throw parties and for people who want to find them—nearby, social, and a little more
              rewarding when you actually walk through the door.
            </p>
            <div className="landing__hero-actions">
              <a className="landing__btn landing__btn--primary" href="#idea">
                Why BuzzIT exists
              </a>
              <a className="landing__btn landing__btn--ghost" href="#service">
                How the service works
              </a>
            </div>
          </div>
        </section>

        <div className="landing__content">
          <section id="idea" className="landing__section" aria-labelledby="idea-heading">
            <p className="landing__section-label">The idea</p>
            <h2 id="idea-heading">Less friction between “there’s a party” and “I’m on the list.”</h2>
            <div className="landing__prose">
              <p>
                Plans today scatter across stories, DMs, and screenshots. BuzzIT gathers the same energy as big ticketing
                platforms—but aimed at the smaller, social, sometimes-private gatherings where the host still wants a real
                headcount, a door flow, and a fair way to thank people who showed up.
              </p>
              <p>
                We believe hosts deserve simple tools—RSVPs, guest lists, optional segmented lists with their own codes,
                and QR check-in—while guests deserve discovery that respects place and people: what is near them and what
                is happening in the circles they follow.
              </p>
            </div>
            <div className="landing__panel landing__prose">
              <p>
                <strong style={{ color: 'var(--text-primary)' }}>In one line:</strong> BuzzIT is the home for posting and
                joining parties and personal events—with maps, social context, structured guest lists, and party points when
                hosts confirm attendance.
              </p>
            </div>
          </section>

          <section id="service" className="landing__section" aria-labelledby="service-heading">
            <p className="landing__section-label">How we plan to serve you</p>
            <h2 id="service-heading">What you can expect from the BuzzIT experience</h2>
            <p className="landing__prose">
              The product is built in two directions at once: a confident experience for guests who want to discover and
              attend, and a calm dashboard for hosts who need RSVPs, lists, and check-in without running a mini call center.
              Here is how those pieces fit together on the roadmap we are executing toward.
            </p>
            <div className="landing__grid">
              {servicePillars.map((item) => (
                <article key={item.title} className="landing__card">
                  <div className="landing__card-icon" aria-hidden>
                    {item.icon}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="landing__footer">
        <p>
          <strong>BuzzIT</strong> — MVP web shell. App and API wiring come next; this page sets the story and the visual
          language from <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>docs/buzzit_palette.html</code>
          .
        </p>
      </footer>

      {isSignInOpen ? (
        <div
          className="landing__modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={signInTitleId}
          onMouseDown={() => setIsSignInOpen(false)}
        >
          <div className="landing__modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="landing__modal-header">
              <h2 id={signInTitleId} className="landing__modal-title">
                Welcome to BuzzIT
              </h2>
              <button
                type="button"
                className="landing__modal-close"
                onClick={() => setIsSignInOpen(false)}
                aria-label="Close sign in dialog"
              >
                ✕
              </button>
            </div>
            <p className="landing__modal-welcome">Sign in with Google to continue—same account on web and app later on.</p>
            <div className="landing__google-wrap">
              <div id={googleButtonId} className="landing__google-btn" />
            </div>
            {googleInitError ? <p className="landing__modal-hint landing__modal-hint--error">{googleInitError}</p> : null}
            {isSigningIn ? <p className="landing__modal-hint">Signing you in…</p> : null}
            {signInError ? <p className="landing__modal-hint landing__modal-hint--error">{signInError}</p> : null}
            <div className="landing__modal-actions">
              <button type="button" className="landing__btn landing__btn--ghost" onClick={() => setIsSignInOpen(false)}>
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
