import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class GitHubAPIService:
    """Service class for interacting with GitHub API"""
    
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Project-Analyzer'
        }
        
        # Add token if available
        if settings.GITHUB_TOKEN:
            self.headers['Authorization'] = f'token {settings.GITHUB_TOKEN}'
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Optional[Dict]:
        """Make a request to GitHub API with caching"""
        cache_key = f"github_api:{endpoint}:{hash(str(params))}"
        cached_response = cache.get(cache_key)
        
        if cached_response:
            return cached_response
        
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Cache for 5 minutes
            cache.set(cache_key, data, 300)
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"GitHub API request failed: {e}")
            return None
    
    def get_repository(self, owner: str, repo: str) -> Optional[Dict]:
        """Get basic repository information"""
        return self._make_request(f"/repos/{owner}/{repo}")
    
    def get_repository_stats(self, owner: str, repo: str) -> Optional[Dict]:
        """Get comprehensive repository statistics"""
        repo_data = self.get_repository(owner, repo)
        if not repo_data:
            return None
        
        # Get additional data
        contributors = self.get_contributors(owner, repo)
        commits = self.get_recent_commits(owner, repo)
        issues = self.get_issues(owner, repo)
        pulls = self.get_pull_requests(owner, repo)
        
        return {
            'basic_info': repo_data,
            'contributors': contributors,
            'recent_commits': commits,
            'issues': issues,
            'pulls': pulls
        }
    
    def get_contributors(self, owner: str, repo: str) -> List[Dict]:
        """Get repository contributors"""
        return self._make_request(f"/repos/{owner}/{repo}/contributors") or []
    
    def get_recent_commits(self, owner: str, repo: str, days: int = 30) -> List[Dict]:
        """Get recent commits from the last N days"""
        since_date = (datetime.now() - timedelta(days=days)).isoformat()
        params = {'since': since_date}
        return self._make_request(f"/repos/{owner}/{repo}/commits", params) or []
    
    def get_issues(self, owner: str, repo: str, state: str = 'open') -> List[Dict]:
        """Get repository issues"""
        params = {'state': state, 'per_page': 100}
        return self._make_request(f"/repos/{owner}/{repo}/issues", params) or []
    
    def get_pull_requests(self, owner: str, repo: str, state: str = 'open') -> List[Dict]:
        """Get repository pull requests"""
        params = {'state': state, 'per_page': 100}
        return self._make_request(f"/repos/{owner}/{repo}/pulls", params) or []
    
    def get_file_content(self, owner: str, repo: str, path: str) -> Optional[str]:
        """Get file content from repository"""
        data = self._make_request(f"/repos/{owner}/{repo}/contents/{path}")
        if data and 'content' in data:
            import base64
            return base64.b64decode(data['content']).decode('utf-8')
        return None
    
    def check_file_exists(self, owner: str, repo: str, path: str) -> bool:
        """Check if a file exists in the repository"""
        data = self._make_request(f"/repos/{owner}/{repo}/contents/{path}")
        return data is not None
    
    def get_commit_activity(self, owner: str, repo: str) -> List[Dict]:
        """Get commit activity for the last year"""
        return self._make_request(f"/repos/{owner}/{repo}/stats/commit_activity") or []
    
    def get_code_frequency(self, owner: str, repo: str) -> List[Dict]:
        """Get code frequency statistics"""
        return self._make_request(f"/repos/{owner}/{repo}/stats/code_frequency") or []
    
    def get_participation(self, owner: str, repo: str) -> Dict:
        """Get participation statistics"""
        return self._make_request(f"/repos/{owner}/{repo}/stats/participation") or {}
    
    def get_languages(self, owner: str, repo: str) -> Dict:
        """Get repository languages"""
        return self._make_request(f"/repos/{owner}/{repo}/languages") or {}
    
    def get_topics(self, owner: str, repo: str) -> List[str]:
        """Get repository topics"""
        data = self._make_request(f"/repos/{owner}/{repo}/topics")
        return data.get('names', []) if data else []
    
    def get_releases(self, owner: str, repo: str) -> List[Dict]:
        """Get repository releases"""
        return self._make_request(f"/repos/{owner}/{repo}/releases") or []
    
    def get_stargazers(self, owner: str, repo: str) -> List[Dict]:
        """Get repository stargazers (limited to recent)"""
        params = {'per_page': 100}
        return self._make_request(f"/repos/{owner}/{repo}/stargazers", params) or []
    
    def get_forks(self, owner: str, repo: str) -> List[Dict]:
        """Get repository forks"""
        params = {'per_page': 100}
        return self._make_request(f"/repos/{owner}/{repo}/forks", params) or []
    
    def get_community_health(self, owner: str, repo: str) -> Dict:
        """Get community health metrics"""
        return self._make_request(f"/repos/{owner}/{repo}/community/profile") or {}
    
    def get_traffic_views(self, owner: str, repo: str) -> Dict:
        """Get repository traffic views (requires token)"""
        return self._make_request(f"/repos/{owner}/{repo}/traffic/views") or {}
    
    def get_traffic_clones(self, owner: str, repo: str) -> Dict:
        """Get repository traffic clones (requires token)"""
        return self._make_request(f"/repos/{owner}/{repo}/traffic/clones") or {}
    
    def get_traffic_popular_paths(self, owner: str, repo: str) -> List[Dict]:
        """Get popular paths (requires token)"""
        return self._make_request(f"/repos/{owner}/{repo}/traffic/popular/paths") or []
    
    def get_traffic_popular_referrers(self, owner: str, repo: str) -> List[Dict]:
        """Get popular referrers (requires token)"""
        return self._make_request(f"/repos/{owner}/{repo}/traffic/popular/referrers") or [] 