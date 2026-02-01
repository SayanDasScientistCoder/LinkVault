require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const uploadRoutes = require('./routes/upload');
const contentRoutes = require('./routes/content');

const app = express();

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// API Routes
// --------------------
app.use('/api', uploadRoutes);
app.use('/api', contentRoutes);

// --------------------
// Serve Frontend (React SPA)
// --------------------
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');

// Serve static assets
app.use(express.static(frontendPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// --------------------
// Server
// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
