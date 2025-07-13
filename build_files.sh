#!/bin/bash
# Build script for Vercel deployment

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running Django migrations..."
python manage.py migrate --noinput

echo "Building static files..."
python manage.py collectstatic --noinput

echo "Build completed!" 