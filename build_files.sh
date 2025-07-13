#!/bin/bash
# Build script for Vercel deployment

echo "Building static files..."
python manage.py collectstatic --noinput
 
echo "Build completed!" 