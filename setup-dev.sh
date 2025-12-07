#!/bin/bash

# Quick Start Guide for Keplara Website Starter
# This script sets up both the admin-client and management-api

set -e

echo "🚀 Setting up Keplara Website Starter..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Setup Management API
echo "📦 Setting up Management API..."
cd management-api
if [ ! -d node_modules ]; then
    npm install
fi
echo "✅ Management API dependencies installed"
echo ""

# Back to root
cd ..

# Setup Admin Client
echo "📦 Setting up Admin Client..."
cd admin-client
if [ ! -d node_modules ]; then
    npm install
fi
echo "✅ Admin Client dependencies installed"
echo ""

# Back to root
cd ..

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Make sure MongoDB is running on localhost:27020"
echo "2. Make sure Redis is running on localhost:6366"
echo ""
echo "3. Start the Management API:"
echo "   cd management-api && npm run dev"
echo ""
echo "4. In a new terminal, start the Admin Client:"
echo "   cd admin-client && npm run serve:ssr:client"
echo ""
echo "5. Open your browser to http://localhost:8087"
echo ""
echo "📚 For more details, see ARCHITECTURE.md"
