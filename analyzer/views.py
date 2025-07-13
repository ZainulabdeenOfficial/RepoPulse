from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging

from .forms import RepositoryAnalysisForm, ComparisonForm
from .analysis_service import RepositoryAnalyzer

logger = logging.getLogger(__name__)


def index(request):
    """Home page with analysis form"""
    if request.method == 'POST':
        form = RepositoryAnalysisForm(request.POST)
        if form.is_valid():
            owner = form.cleaned_data['owner']
            repo = form.cleaned_data['repo']
            return redirect('analyze_repository', owner=owner, repo=repo)
    else:
        form = RepositoryAnalysisForm()
    
    context = {
        'form': form,
        'total_analyses': 0  # No database tracking
    }
    return render(request, 'analyzer/index.html', context)


def analyze_repository(request, owner, repo):
    """Analyze a specific repository in real-time"""
    try:
        # Perform real-time analysis
        analyzer = RepositoryAnalyzer()
        analysis_data = analyzer.analyze_repository(owner, repo)
        
        if 'error' in analysis_data:
            messages.error(request, analysis_data['error'])
            return redirect('index')
        
        context = {
            'analysis': analysis_data,
            'owner': owner,
            'repo': repo
        }
        return render(request, 'analyzer/analysis_result.html', context)
        
    except Exception as e:
        logger.error(f"Error analyzing repository {owner}/{repo}: {e}")
        messages.error(request, f'Analysis failed: {str(e)}')
        return redirect('index')


def compare_repositories(request):
    """Compare multiple repositories in real-time"""
    if request.method == 'POST':
        form = ComparisonForm(request.POST)
        if form.is_valid():
            repositories = form.cleaned_data['repositories']
            comparison_type = form.cleaned_data['comparison_type']
            
            analyzer = RepositoryAnalyzer()
            comparison_data = []
            
            for repo_info in repositories:
                analysis = analyzer.analyze_repository(repo_info['owner'], repo_info['repo'])
                if 'error' not in analysis:
                    comparison_data.append(analysis)
            
            if len(comparison_data) < 2:
                messages.error(request, 'Could not analyze enough repositories for comparison')
                return redirect('compare_repositories')
            
            context = {
                'comparison_data': comparison_data,
                'comparison_type': comparison_type,
                'repositories': repositories
            }
            return render(request, 'analyzer/comparison_result.html', context)
    else:
        form = ComparisonForm()
    
    context = {'form': form}
    return render(request, 'analyzer/compare.html', context)


@csrf_exempt
@require_http_methods(["POST"])
def api_analyze_repository(request):
    """API endpoint for repository analysis"""
    try:
        data = json.loads(request.body)
        owner = data.get('owner')
        repo = data.get('repo')
        
        if not owner or not repo:
            return JsonResponse({'error': 'Owner and repo parameters are required'}, status=400)
        
        analyzer = RepositoryAnalyzer()
        analysis_data = analyzer.analyze_repository(owner, repo)
        
        return JsonResponse(analysis_data)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"API analysis error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


def about(request):
    """About page"""
    return render(request, 'analyzer/about.html')


def api_docs(request):
    """API documentation page"""
    return render(request, 'analyzer/api_docs.html') 