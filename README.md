# LinkVault - Secure File & Text Sharing

A full-stack web application for sharing text and files securely via unique, time-limited links.

## Project Structure

```
linkvault/
├── frontend/              # React + Vite + Tailwind
├── backend/              # Node.js + Express
├── docs/                 # Documentation and diagrams
└── README.md
```

## Tech Stack

### Frontend
- React (with Vite)
- Tailwind CSS
- Axios for HTTP requests

### Backend
- Node.js
- Express.js
- Multer (file uploads)
- UUID (unique ID generation)

### Database Options
- **Recommended for beginners**: MongoDB (with Mongoose)
- **Alternative**: PostgreSQL, MySQL, or SQLite

### Storage
- Firebase Storage (for files) or local storage for development

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB installed locally OR MongoDB Atlas account (free tier)

### Installation Steps

#### 1. Create Project Structure
```bash
mkdir linkvault
cd linkvault
```

#### 2. Setup Backend
```bash
mkdir backend
cd backend
npm init -y
npm install express mongoose dotenv cors multer uuid nanoid
npm install --save-dev nodemon
```

#### 3. Setup Frontend
```bash
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install axios react-router-dom
```

#### 4. Configure Tailwind CSS
Update `frontend/tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add to `frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Development Workflow

### Running Backend
```bash
cd backend
npm run dev
```

### Running Frontend
```bash
cd frontend
npm run dev
```

## API Design (High-Level)

### Endpoints

#### 1. Upload Content
- **POST** `/api/upload`
- Body: `{ type: 'text' | 'file', content: string, file: File, expiryTime?: Date }`
- Response: `{ success: true, shareUrl: string, expiresAt: Date }`

#### 2. Retrieve Content
- **GET** `/api/content/:uniqueId`
- Response: `{ type: string, content: string, downloadUrl?: string }`

#### 3. Delete Content (Optional)
- **DELETE** `/api/content/:uniqueId`
- Response: `{ success: true }`

## Database Schema

### MongoDB Schema (Mongoose)

```javascript
{
  uniqueId: String (unique, indexed),
  type: String ('text' or 'file'),
  content: String (for text) OR fileUrl: String (for files),
  fileName: String (optional, for files),
  fileSize: Number (optional),
  createdAt: Date,
  expiresAt: Date,
  viewCount: Number (optional - for bonus features),
  password: String (optional - for bonus features)
}
```

## Key Design Decisions

### 1. Unique ID Generation
- Use `nanoid` or `uuid` for generating hard-to-guess URLs
- Example: `https://linkvault.com/abc123xyz` where `abc123xyz` is the unique ID

### 2. File Storage Strategy
- **Development**: Store files locally in `backend/uploads/`
- **Production**: Use Firebase Storage or AWS S3
- Store only the file URL/path in database

### 3. Expiry Handling
- Store `expiresAt` timestamp in database
- Use middleware to check expiry before serving content
- **Bonus**: Implement a cron job to delete expired content from DB and storage

### 4. Security Considerations
- Validate file types and sizes
- Sanitize text input
- Use CORS properly
- Rate limiting on upload endpoint

## Implementation Phases

1. Setup project structure
2. Create upload endpoint (text only)
3. Generate unique URLs
4. Create retrieval endpoint
5. Build basic frontend UI
6. Implement expiry logic

## Contributors

Sayan Das - IIT Kharagpur

## License

This is an academic project for educational purposes.
