# 🚀 Quick Setup Guide

## Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

## Installation Steps

### Option 1: Windows (Easiest)
1. Double-click `run.bat`
2. Wait for dependencies to install
3. Visit http://127.0.0.1:8000

### Option 2: Command Line
```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python run.py
```

### Option 3: Manual Setup
```bash
# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run with Django
python manage.py runserver
```

## Usage

1. **Analyze a Repository**
   - Go to http://127.0.0.1:8000
   - Enter a GitHub repository URL (e.g., https://github.com/django/django)
   - Click "Analyze Repository"
   - View results instantly!

2. **Compare Repositories**
   - Go to http://127.0.0.1:8000/compare/
   - Enter multiple repository URLs
   - Choose comparison type
   - View side-by-side analysis

3. **API Access**
   - Visit http://127.0.0.1:8000/api/docs/
   - Use the API for programmatic access

## Features

✅ **Real-time Analysis** - No database needed  
✅ **Popularity Prediction** - Stars, forks, engagement  
✅ **Activity Analysis** - Commits, responses, engagement  
✅ **Contribution Guide Checker** - Documentation quality  
✅ **Repository Comparison** - Side-by-side analysis  
✅ **API Access** - Programmatic usage  
✅ **Beautiful UI** - Modern, responsive design  

## Troubleshooting

### Python not found
- Install Python from https://python.org
- Make sure to check "Add Python to PATH" during installation

### Dependencies not installing
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Then install requirements
pip install -r requirements.txt
```

### Port already in use
```bash
# Use a different port
python manage.py runserver 8001
```

### GitHub API rate limits
- Create a GitHub token at https://github.com/settings/tokens
- Add it to your `.env` file: `GITHUB_TOKEN=your-token-here`

## Example Repositories to Test

- https://github.com/django/django
- https://github.com/pallets/flask
- https://github.com/psf/requests
- https://github.com/facebook/react
- https://github.com/vuejs/vue

---

**Need help?** Check the main README.md for detailed documentation. 