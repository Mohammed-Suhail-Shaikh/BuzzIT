# BuzzIT — Product brief

## 1. Project overview

BuzzIT is a **website and mobile app** for posting and discovering **parties and personal events**, in the same problem space as **Eventbrite**, but focused on **social, local, and private gatherings**. Hosts publish events, manage RSVPs and **multiple guest lists**, and **check in** guests **manually or by scanning a QR “virtual ticket”**; attendees discover events (including **nearby** and from **people they follow**), use **default RSVP** to land on the **regular guest list**, optionally enter a **special list registration code** on the event page to join a **custom** list (each custom list has its **own** host-issued code), receive a **QR code after registering as going**, and earn **party points** when a host confirms attendance (including via scan).

**v1:** RSVP-only (no payments). The product should be shaped so **paid ticketing** can be added later without redesigning the core event and attendance model.

## 2. Target audience

- **Hosts:** People running house parties, birthdays, small gatherings, nights out, or community meetups who want listings, RSVPs, optional **private / invite-only** events, a **regular guest list** fed by RSVP plus **custom lists** each with its **own registration code** they share with the right guests, and **door check-in** via **QR scan** or manual toggle.
- **Attendees:** People who want **map and list** discovery, a **home** experience that mixes **nearby** events with **friends/follows**, a **profile** of what they attended and what is upcoming, and **party points** as recognition for showing up.

## 3. Primary benefits / features

- **Home:** Lists **nearby** events and parties; includes a section for events from **friends or accounts the user follows**.
- **Map:** Shows event locations with **custom markers**; interaction leads from marker to summary to event detail.
- **Two-sided experience:** Clear separation between **posting/managing** events (host) and **browsing, RSVPing, and attending** (guest)—tabs, modes, or role-aware navigation.
- **Guest lists:** **Regular list** — anyone who completes **default RSVP** as “going” is on the standard guest list. **Custom lists** — the host creates **named lists**; each list gets a **uniquely generated code**. On the **event landing page**, attendees can use an option such as **“Special registration code”**; entering a list’s code **joins them to that custom list only** (separate from default RSVP). Distinct from **private event** invite codes, which gate the event itself.
- **Virtual ticket (QR):** After **registering/RSVPing as going**, the attendee gets a **QR code**; the **host scans** it to **check them in automatically** (same outcome as manual check-in, including **party points** rules).
- **Privacy:** Events can be **public** or **private**. **Invite-only:** users can RSVP only after entering a **uniquely generated code** (store and validate codes securely on the server; support rotation).
- **Rewards:** **Party points** increase with **recognized attendance**—hosts **check off** attendees **manually or via QR scan**; **at most one points award per user per event** for that check-in.
- **Profile:** User information plus **events attended** and **events they plan to attend** (driven by RSVP and event dates).
- **Sign-in:** **Login with Google (Gmail)** as the primary auth path; email/password can remain optional for a later phase if desired.

## 4. High-level tech / architecture

- **Web:** **MERN-style** stack—**React** SPA (e.g. Vite), **Node** API (**Express** or **NestJS**), **MongoDB** (**Mongoose**), REST/JSON API, **JWT or session** after login. **Google Sign-In:** client obtains a **Google ID token**; backend verifies it (e.g. `google-auth-library`), upserts **User** (e.g. by Google `sub`), then issues an **app token**.
- **Mobile:** **React Native** (Expo is a practical default); **Google** via `@react-native-google-signin/google-signin` or **Expo AuthSession**; same auth and event APIs as the web app. **QR:** generate/display for attendees; **camera-based scan** for hosts (e.g. **expo-camera** / **vision-camera** + decoding library, or OS flow).
- **Google Cloud:** OAuth consent screen and **OAuth client IDs** for **Web**, **iOS**, and **Android** (including Android signing keys where required).
- **Shared API contract:** e.g. **OpenAPI** or shared **TypeScript types**; optional **monorepo** (`apps/web`, `apps/mobile`, `packages/…`) to keep clients aligned.
- **Data concepts:** Users and **follows**; **events** with geo (e.g. **2dsphere** index) and visibility; **RSVPs** feeding the **regular** guest list; **custom guest lists** each with a **hashed registration code** and **memberships** created when a user submits the matching code on the event page; **check-in credentials / QR payload** (prefer **opaque server-stored tokens** with host-only **scan** API); **attendance/check-in** and an append-only **points ledger** (optional cached totals on the user).
- **Maps:** Web via **Mapbox** or **Google Maps** JS; mobile via **react-native-maps**; server supports **radius or bounding-box** queries for map and home feeds.
- **Later:** **Paid tickets** (e.g. Stripe) as an extension—e.g. optional **ticket tiers / orders**—without changing the core RSVP story for free events.
