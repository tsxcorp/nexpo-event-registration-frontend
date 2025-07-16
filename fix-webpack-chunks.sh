#!/bin/bash

echo "🔧 Fixing Next.js webpack chunk loading issues..."

# Kill all Next.js processes
echo "1. Killing Next.js processes..."
pkill -f "next" 2>/dev/null || true

# Remove all caches
echo "2. Clearing all caches..."
rm -rf .next node_modules/.cache .swc 2>/dev/null || true

# Clean install dependencies
echo "3. Reinstalling dependencies..."
npm ci

# Build project
echo "4. Building project..."
npm run build

# Start development server
echo "5. Starting development server..."
echo "✅ Fixed! Run 'npm run dev' to start the server"

echo ""
echo "📋 Usage for future:"
echo "  chmod +x fix-webpack-chunks.sh"
echo "  ./fix-webpack-chunks.sh" 