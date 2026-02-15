# LinkVault

LinkVault is a full-stack secure sharing app for text and files. A user creates a vault, gets a unique share link, and can optionally apply security controls like password protection, one-time view, max views, owner delete link, and user-email allowlists.

## Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- Axios
- React Router

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Multer (file uploads)
- nanoid (unique IDs)

### Storage
- Local file storage in `backend/uploads/`

## Project Structure

```text
linkvault/
|---backend/
|   |---middleware/
|   |   |---auth.js
|   |---models/
|   |   |---Content.js
|   |   |---User.js
|   |---routes/
|   |   |---auth.js
|   |   |---content.js
|   |   |---upload.js
|   |---server.js
|   |---package.json
|---frontend/
|   |---src/
|   |   |---pages/
|   |   |   |---AuthPage.jsx
|   |   |   |---HomePage.jsx
|   |   |   |---ViewPage.jsx
|   |   |   |---DeletePage.jsx
|   |   |   |---NotFound.jsx
|   |   |---utils/
|   |   |   |---auth.js
|   |   |---App.jsx
|   |   |---main.jsx
|   |---package.json
|---Takehome.pdf
|---requirements.txt
|---README.md
```

## Features Implemented

## Core Assignment Features
- Upload either plain text or one file per vault
- Unique, hard-to-guess share URL generation
- Link-only access model (no global public listing)
- Expiry-based content invalidation (default 10 minutes)
- Text view + copy
- File download
- Clean API status/error handling and validations

## Bonus Features Implemented
- Password-protected vaults
- One-time view vaults
- Max view count restriction
- Manual owner delete (tokenized delete link)
- Authentication + user accounts (register/login/logout)
- File size limit and file type validation
- User-based access control (optional email allowlist)
- Per-user active links list in UI

## Not Implemented (Bonus)
- Background/cron cleanup job for expired records
  - Current cleanup is access-time driven (expired records are removed when requested)

## Environment Variables

Create backend `.env` at `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/linkvault
FRONTEND_URL=http://localhost:5173
```

Frontend env is optional. If not set, frontend defaults API to `http://localhost:5000/api`.

Optional frontend env file `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Dependency Installation

This repository includes a `requirements.txt` manifest for quick reference of libraries, APIs, and environment requirements.

Important:
- This project is built with Node.js/React, so dependencies are installed with `npm`, not `pip`.
- Do not run `pip install -r requirements.txt` for this project runtime setup.

Install dependencies with:

```bash
cd backend
npm install
```

```bash
cd ../frontend
npm install
```

## Local Setup and Run

1. Clone repo and enter root:

```bash
git clone <your-repo-url>
cd linkvault
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4. Start backend (terminal 1):

```bash
cd ../backend
npm run dev
```

5. Start frontend (terminal 2):

```bash
cd ../frontend
npm run dev
```

6. Open app in browser:
- `http://localhost:5173`

## Production-style Build (Optional)

1. Build frontend:

```bash
cd frontend
npm run build
```

2. Start backend server (serves `frontend/dist`):

```bash
cd ../backend
npm start
```

3. Open:
- `http://localhost:5000`

## How to Use

## 1) Register / Login
- Open app
- Create account or login
- Session token is stored in browser local storage

## 2) Create a Vault
On home page:
- Choose `Text Vault` or `File Vault`
- Set expiry (quick minutes)
- Optional controls:
  - Password
  - Max views
  - One-time view
  - Allowed users (comma-separated emails)
- Submit to generate:
  - Share link
  - Owner delete link

## 3) Open Share Link
- Receiver must be authenticated in LinkVault
- If vault has password, receiver must also provide password
- Text vault: can read and copy
- File vault: can download

## 4) Delete Flow
- Creator can use `Delete Now` directly
- Or open owner delete link:
  - Preview content
  - Download file (if vault is file)
  - Delete vault

## 5) Active Links Menu
- On home page, open `---` menu
- View your active links
- Copy share/delete links
- Delete entries
- Logout

## Access Rules (Current Behavior)

A user can open/download a vault if:
- They are authenticated, and
- They have the share link, and
- If password-protected: password is correct, and
- If allowlist is configured: their email is in allowlist (owner always bypasses allowlist)

A user can delete a vault if:
- They are authenticated as owner account, and
- They have valid delete token

## API Overview

Base URL: `/api`

### Auth
- `POST /auth/register`
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

- `POST /auth/login`
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

- `GET /auth/me`
  - Header: `Authorization: Bearer <token>`

- `POST /auth/logout`
  - Header: `Authorization: Bearer <token>`

### Vault Create
- `POST /upload`
  - Header: `Authorization: Bearer <token>`
  - FormData fields:
    - `type`: `text` or `file`
    - `content` (for text)
    - `file` (for file)
    - `expiryMinutes`
    - Optional: `password`, `oneTimeView`, `maxViews`, `allowedUsers`

### Vault Access
- `GET /content/:uniqueId`
  - Header: `Authorization: Bearer <token>`
  - Optional password header: `x-vault-password`

- `GET /download/:uniqueId`
  - Header: `Authorization: Bearer <token>`
  - Optional password header: `x-vault-password`

### Owner Delete Operations
- `GET /delete-preview/:uniqueId/:deleteToken`
  - Header: `Authorization: Bearer <token>`

- `GET /delete-download/:uniqueId/:deleteToken`
  - Header: `Authorization: Bearer <token>`

- `DELETE /content/:uniqueId`
  - Header: `Authorization: Bearer <token>`
  - Header: `x-delete-token`

### Owner List
- `GET /content/mine`
  - Header: `Authorization: Bearer <token>`

## File Upload Constraints

- Max file size: `50 MB`
- Allowed types (validated by extension and MIME):
  - `txt, csv, pdf`
  - `png, jpg, jpeg, webp, gif`
  - `zip`
  - `doc, docx`
  - `xls, xlsx`
  - `ppt, pptx`

## Data Model Summary

### User
- `email` (unique)
- `passwordHash`
- `authTokenHash`
- `authTokenExpiresAt`

### Content
- `uniqueId`
- `type` (`text` or `file`)
- `content` or file metadata (`fileUrl`, `fileName`, `fileSize`, `mimeType`)
- `createdAt`, `expiresAt`
- `viewCount`, `maxViews`, `oneTimeView`
- `password` (hashed)
- `deleteToken`
- `ownerId`
- `allowedUserEmails[]`

## Design Decisions

- MongoDB for flexible document schema and quick indexing
- `nanoid` IDs for short, hard-to-guess share URLs
- Local disk storage for simplicity in local setup
- Request-time expiry cleanup to keep implementation simple
- Token-based auth with hashed session token in DB
- Owner delete protected by both account identity and delete token

## Assumptions

- Users share links out-of-band
- Receiver can create/login to an account before opening links
- Single backend instance with local file storage for development

## Limitations

- No background scheduler for automatic expiry cleanup
- Local uploads are not durable for ephemeral/free cloud instances
- No rate limiting or abuse throttling currently
- No email verification/reset flow
- In-memory UI state for some interactions (no optimistic sync layer)

## Notes

- Active backend entrypoint is `backend/server.js`
- Legacy `backend/backend-*.js` files are present but not used by npm scripts

## Contributor

- NAME:- Sayan Das
- ROLL NUMBER:- 25CS60R01