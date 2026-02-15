require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const uploadRoutes = require('./routes/upload');
const contentRoutes = require('./routes/content');
const authRoutes = require('./routes/auth');

const app = express();

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// API Routes
// --------------------
app.use('/api', uploadRoutes);
app.use('/api', contentRoutes);
app.use('/api', authRoutes);

// --------------------
// Serve Frontend (React SPA)
// --------------------
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');

// Serve static assets
app.use(express.static(frontendPath));

// Express v5–safe SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// --------------------
// MongoDB + Server startup
// --------------------
mongoose.set('bufferCommands', false);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log('Local MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
