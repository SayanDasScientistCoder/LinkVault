#!/bin/bash
# Backend Setup Script - Run this in your backend folder

echo "🚀 Setting up LinkVault Backend..."

# Step 1: Initialize npm
echo "📦 Initializing npm..."
npm init -y

# Step 2: Install dependencies
echo "📥 Installing dependencies..."
npm install express mongoose dotenv cors multer nanoid

# Step 3: Install dev dependencies
echo "📥 Installing dev dependencies..."
npm install --save-dev nodemon

# Step 4: Create folders
echo "📁 Creating folders..."
mkdir -p models routes uploads

# Step 5: Create .env file
echo "⚙️  Creating .env file..."
cat > .env << 'EOF'
PORT=5000
MONGODB_URI=mongodb://localhost:27017/linkvault
FRONTEND_URL=http://localhost:5173
EOF

# Step 6: Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
.env
uploads/
.DS_Store
*.log
EOF

# Step 7: Update package.json scripts
echo "📝 Updating package.json..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.main = 'server.js';
pkg.scripts = {
  start: 'node server.js',
  dev: 'nodemon server.js'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "✅ Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create server.js file"
echo "2. Create models/Content.js file"
echo "3. Create routes/upload.js file"
echo "4. Create routes/content.js file"
echo "5. Run: npm run dev"
