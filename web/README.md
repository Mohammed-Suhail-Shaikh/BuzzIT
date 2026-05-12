# BuzzIT — web (marketing shell)

Vite + React + TypeScript. The **home landing** explains the BuzzIT idea and how the service will work for hosts and guests. Visual tokens match [`../docs/buzzit_palette.html`](../docs/buzzit_palette.html).

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

Open the dev URL shown in the terminal (usually `http://localhost:5173`).

## Logo

The header currently shows a **text placeholder** (`[Logo placeholder]` in `HomeLanding.tsx`). When you want the image back, add `web/public/buzzit-logo.png` and swap the placeholder for an `<img src="/buzzit-logo.png" … />` in the header.

## Google sign-in (dev)

Create `web/.env` (see `web/.env.example`) with:

- `VITE_GOOGLE_CLIENT_ID`

Then restart `npm run dev`.

## Entry points

- [`src/pages/HomeLanding.tsx`](src/pages/HomeLanding.tsx) — landing copy and layout
- [`src/pages/home-landing.css`](src/pages/home-landing.css) — page layout and components
- [`src/index.css`](src/index.css) — global CSS variables (palette)
