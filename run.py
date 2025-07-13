#!/usr/bin/env python
"""
Simple script to run the GitHub Project Analyzer without database setup.
"""

import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'github_analyzer.settings')

if __name__ == '__main__':
    try:
        from django.core.management import execute_from_command_line
        from django.conf import settings
        
        # Check if .env file exists
        env_file = project_root / '.env'
        if not env_file.exists():
            print("⚠️  No .env file found. Creating one with default settings...")
            with open(env_file, 'w') as f:
                f.write("""# Django Settings
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# GitHub API Configuration (Optional)
# GITHUB_TOKEN=your-github-token-here
""")
            print("✅ Created .env file with default settings")
        
        print("🚀 Starting GitHub Project Analyzer...")
        print("📍 Visit: http://127.0.0.1:8000")
        print("🛑 Press Ctrl+C to stop")
        print("-" * 50)
        
        # Run the development server
        execute_from_command_line(['manage.py', 'runserver', '127.0.0.1:8000'])
        
    except ImportError as e:
        print(f"❌ Error: {e}")
        print("💡 Make sure you have installed the requirements:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
        sys.exit(0) 