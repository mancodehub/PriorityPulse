# PriorityPulse

React (Vite + Tailwind) frontend with a small Express backend that handles
passwordless, email-OTP login.

## Project structure

```
prioritypulse/
├─ client/src/          # React app
│  ├─ pages/Login.jsx   # email -> OTP two-step flow
│  ├─ pages/Dashboard.jsx
│  ├─ components/OtpInput.jsx
│  └─ api/client.js     # axios instance
├─ server/               # Express API
│  ├─ routes/auth.js     # /send-otp, /verify-otp, /me
│  ├─ utils/mailer.js    # nodemailer
│  └─ utils/otpStore.js  # in-memory OTP store (swap for Redis in prod)
├─ index.html
└─ vite.config.js
```

## Setup (Windows 11 — PowerShell or Windows Terminal)

1. Install [Node.js 18+ LTS](https://nodejs.org) — the installer handles PATH
   setup for you. Confirm with:
   ```powershell
   node -v
   npm -v
   ```
2. Install dependencies (this also installs the server's dependencies via a
   `postinstall` hook):
   ```powershell
   npm install
   ```
3. Configure the server environment:
   ```powershell
   copy server\.env.example server\.env
   ```
   Then open `server\.env` and fill in `JWT_SECRET` and the `SMTP_*` values.
   For Gmail, use an [App Password](https://myaccount.google.com/apppasswords)
   — not your normal Google password (Gmail blocks plain-password SMTP logins).

4. Run both the frontend and backend together:
   ```powershell
   npm run dev:all
   ```
   Or in two separate terminals:
   ```powershell
   npm run dev          # Vite dev server on http://localhost:5173
   npm run dev:server   # Express API on http://localhost:5000
   ```

Open http://localhost:5173/login.

## Windows-specific notes

- **npm scripts avoid `cd folder &&`.** That syntax fails in some PowerShell
  configurations; the scripts use `npm --prefix server` instead, which works
  identically in PowerShell, cmd.exe, and bash.
- **Line endings are normalized** via `.gitattributes` (`eol=lf`), so the repo
  doesn't accumulate CRLF/LF diff noise when cloned on Windows.
- **File-watching fallback:** if hot reload doesn't pick up changes (common
  when the project lives inside a OneDrive-synced folder or a WSL2 mount),
  run `set VITE_USE_POLLING=true && npm run dev` (cmd) or
  `$env:VITE_USE_POLLING="true"; npm run dev` (PowerShell) to switch Vite to
  polling-based file watching.
- **Long paths:** if `npm install` errors on deeply nested `node_modules`
  paths, enable long path support once as Administrator:
  ```powershell
  git config --system core.longpaths true
  ```
- Antivirus/Windows Defender can slow down `node_modules` installs
  significantly; adding your project folder to the Defender exclusion list
  speeds up `npm install` and Vite's dev server noticeably.

## How the OTP login works

1. User submits their email on `/login`.
2. `POST /api/auth/send-otp` generates a random 6-digit code, hashes and
   stores it server-side (5-minute expiry, 30s resend cooldown), and emails
   it via Nodemailer.
3. User enters the code; `POST /api/auth/verify-otp` compares hashes, allows
   up to 5 attempts before locking, and on success issues a JWT.
4. The JWT is stored in `localStorage` and sent as `Authorization: Bearer …`
   on subsequent requests (see `client/src/api/client.js`).

### Notes for production use

- Swap the in-memory `otpStore` for Redis (or similar) if you run more than
  one server instance.
- Store the JWT in an httpOnly cookie instead of `localStorage` if you want
  protection against XSS-based token theft.
- Add rate limiting (e.g. `express-rate-limit`) in front of `/send-otp` to
  protect against abuse beyond the per-email cooldown already in place.
