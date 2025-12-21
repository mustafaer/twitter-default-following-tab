#!/bin/bash

# Twitter Default Following Tab - Build Script
# Packages the extension for Chrome Web Store distribution

echo "🔨 Building Twitter Default Following Tab Extension..."
echo ""

# Clean old build directory
if [ -d "build" ]; then
  echo "🧹 Cleaning old build..."
  rm -rf build
fi

# Create build directory
mkdir -p build

echo "📦 Copying files..."

# Copy required files
cp manifest.json build/
cp content.js build/
cp -r icons build/ 2>/dev/null || echo "⚠️  Warning: icons folder not found (optional)"
cp LICENSE build/ 2>/dev/null || echo "⚠️  Warning: LICENSE not found (optional)"
cp README.md build/ 2>/dev/null || echo "⚠️  Warning: README not found (optional)"

echo "✅ Files copied to build/"

# Create zip package
echo ""
echo "📦 Creating zip package..."
cd build
zip -r ../twitter-default-following-tab.zip . -x "*.DS_Store"
cd ..

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Output:"
echo "   - build/ (development folder)"
echo "   - twitter-default-following-tab.zip (Chrome Web Store package)"
echo ""
echo "🚀 Next steps:"
echo "   1. Test the extension by loading the 'build' folder in Chrome"
echo "   2. Upload the .zip file to Chrome Web Store Developer Dashboard"
echo ""

