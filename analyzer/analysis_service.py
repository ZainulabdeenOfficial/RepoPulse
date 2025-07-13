import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import logging

from .github_api import GitHubAPIService

logger = logging.getLogger(__name__)


class RepositoryAnalyzer:
    """Main analysis service for GitHub repositories"""
    
    def __init__(self):
        self.github_api = GitHubAPIService()
        self.popularity_model = None
        self.scaler = StandardScaler()
        
    def analyze_repository(self, owner: str, repo: str) -> Dict:
        """Perform comprehensive repository analysis"""
        try:
            # Get repository data
            repo_stats = self.github_api.get_repository_stats(owner, repo)
            if not repo_stats:
                return {'error': 'Repository not found or inaccessible'}
            
            basic_info = repo_stats['basic_info']
            
            # Perform individual analyses
            popularity_analysis = self._analyze_popularity(basic_info, repo_stats)
            maintainer_analysis = self._analyze_maintainer_activity(owner, repo, repo_stats)
            contribution_analysis = self._analyze_contribution_guide(owner, repo)
            
            # Calculate overall score
            overall_score = self._calculate_overall_score(
                popularity_analysis['score'],
                maintainer_analysis['score'],
                contribution_analysis['score']
            )
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                popularity_analysis, maintainer_analysis, contribution_analysis
            )
            
            return {
                'owner': owner,
                'repo_name': repo,
                'full_name': basic_info['full_name'],
                'description': basic_info.get('description', ''),
                'stars': basic_info['stargazers_count'],
                'forks': basic_info['forks_count'],
                'watchers': basic_info['watchers_count'],
                'open_issues': basic_info['open_issues_count'],
                'open_pulls': len(repo_stats.get('pulls', [])),
                'popularity_score': popularity_analysis['score'],
                'maintainer_activity_score': maintainer_analysis['score'],
                'contribution_guide_score': contribution_analysis['score'],
                'overall_score': overall_score,
                'popularity_prediction': popularity_analysis['prediction'],
                'maintainer_activity_analysis': maintainer_analysis['analysis'],
                'contribution_guide_analysis': contribution_analysis['analysis'],
                'recommendations': recommendations,
                'last_commit_date': basic_info['updated_at'],
                'github_url': basic_info['html_url'],
                'language': basic_info.get('language', 'Unknown'),
                'topics': self.github_api.get_topics(owner, repo),
                'languages': self.github_api.get_languages(owner, repo),
                'releases_count': len(self.github_api.get_releases(owner, repo)),
                'contributors_count': len(repo_stats.get('contributors', [])),
                'recent_commits_count': len(repo_stats.get('recent_commits', []))
            }
            
        except Exception as e:
            logger.error(f"Error analyzing repository {owner}/{repo}: {e}")
            return {'error': f'Analysis failed: {str(e)}'}
    
    def _analyze_popularity(self, basic_info: Dict, repo_stats: Dict) -> Dict:
        """Analyze repository popularity and predict future growth"""
        stars = basic_info['stargazers_count']
        forks = basic_info['forks_count']
        watchers = basic_info['watchers_count']
        open_issues = basic_info['open_issues_count']
        
        # Calculate popularity score (0-100)
        popularity_score = self._calculate_popularity_score(stars, forks, watchers, open_issues)
        
        # Predict future popularity
        prediction = self._predict_popularity_growth(basic_info, repo_stats)
        
        return {
            'score': popularity_score,
            'prediction': prediction,
            'metrics': {
                'stars': stars,
                'forks': forks,
                'watchers': watchers,
                'open_issues': open_issues
            }
        }
    
    def _calculate_popularity_score(self, stars: int, forks: int, watchers: int, issues: int) -> float:
        """Calculate popularity score based on repository metrics"""
        # Normalize metrics (log scale to handle large variations)
        log_stars = np.log1p(stars)
        log_forks = np.log1p(forks)
        log_watchers = np.log1p(watchers)
        
        # Weighted scoring (stars are most important)
        score = (log_stars * 0.5 + log_forks * 0.3 + log_watchers * 0.2)
        
        # Normalize to 0-100 scale
        max_score = np.log1p(100000) * 0.5 + np.log1p(10000) * 0.3 + np.log1p(5000) * 0.2
        normalized_score = min(100, (score / max_score) * 100)
        
        return round(normalized_score, 2)
    
    def _predict_popularity_growth(self, basic_info: Dict, repo_stats: Dict) -> str:
        """Predict future popularity growth"""
        stars = basic_info['stargazers_count']
        forks = basic_info['forks_count']
        recent_commits = len(repo_stats.get('recent_commits', []))
        contributors = len(repo_stats.get('contributors', []))
        
        # Simple prediction logic based on current metrics
        if stars > 1000 and forks > 100:
            if recent_commits > 20:
                return "High growth potential - Strong community engagement and active development"
            else:
                return "Stable popularity - Well-established but may need more active development"
        elif stars > 100:
            if recent_commits > 10:
                return "Growing popularity - Good momentum with recent activity"
            else:
                return "Moderate growth potential - Needs more active development"
        else:
            if recent_commits > 5:
                return "Emerging popularity - Early stage with active development"
            else:
                return "Low growth potential - Needs more community engagement and development"
    
    def _analyze_maintainer_activity(self, owner: str, repo: str, repo_stats: Dict) -> Dict:
        """Analyze maintainer activity level"""
        recent_commits = repo_stats.get('recent_commits', [])
        issues = repo_stats.get('issues', [])
        pulls = repo_stats.get('pulls', [])
        
        # Calculate activity metrics
        commits_last_30_days = len([c for c in recent_commits 
                                   if self._is_within_days(c['commit']['author']['date'], 30)])
        commits_last_7_days = len([c for c in recent_commits 
                                  if self._is_within_days(c['commit']['author']['date'], 7)])
        
        # Response time to issues (sample)
        issue_response_times = self._calculate_response_times(issues)
        avg_response_time = np.mean(issue_response_times) if issue_response_times else float('inf')
        
        # Activity score calculation
        activity_score = self._calculate_activity_score(
            commits_last_30_days, commits_last_7_days, avg_response_time, len(issues), len(pulls)
        )
        
        # Generate analysis
        analysis = self._generate_activity_analysis(
            commits_last_30_days, commits_last_7_days, avg_response_time, len(issues), len(pulls)
        )
        
        return {
            'score': activity_score,
            'analysis': analysis,
            'metrics': {
                'commits_30_days': commits_last_30_days,
                'commits_7_days': commits_last_7_days,
                'avg_response_time_hours': avg_response_time if avg_response_time != float('inf') else None,
                'open_issues': len(issues),
                'open_pulls': len(pulls)
            }
        }
    
    def _is_within_days(self, date_str: str, days: int) -> bool:
        """Check if a date is within the last N days"""
        try:
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return date > datetime.now(date.tzinfo) - timedelta(days=days)
        except:
            return False
    
    def _calculate_response_times(self, issues: List[Dict]) -> List[float]:
        """Calculate response times to issues in hours"""
        response_times = []
        for issue in issues[:10]:  # Sample first 10 issues
            if issue.get('comments', 0) > 0:
                # Use first comment as response
                comments = self.github_api._make_request(issue['comments_url'])
                if comments:
                    first_comment = comments[0]
                    created = datetime.fromisoformat(issue['created_at'].replace('Z', '+00:00'))
                    responded = datetime.fromisoformat(first_comment['created_at'].replace('Z', '+00:00'))
                    response_time = (responded - created).total_seconds() / 3600  # hours
                    response_times.append(response_time)
        return response_times
    
    def _calculate_activity_score(self, commits_30: int, commits_7: int, 
                                 avg_response: float, issues: int, pulls: int) -> float:
        """Calculate maintainer activity score (0-100)"""
        # Base score from recent commits
        commit_score = min(50, commits_30 * 2 + commits_7 * 5)
        
        # Response time score (faster is better)
        if avg_response == float('inf'):
            response_score = 0
        elif avg_response < 24:  # Less than 1 day
            response_score = 30
        elif avg_response < 168:  # Less than 1 week
            response_score = 20
        elif avg_response < 720:  # Less than 1 month
            response_score = 10
        else:
            response_score = 0
        
        # Engagement score
        engagement_score = min(20, (issues + pulls) * 0.5)
        
        total_score = commit_score + response_score + engagement_score
        return round(min(100, total_score), 2)
    
    def _generate_activity_analysis(self, commits_30: int, commits_7: int, 
                                   avg_response: float, issues: int, pulls: int) -> str:
        """Generate human-readable activity analysis"""
        if commits_30 > 20:
            activity_level = "Very High"
        elif commits_30 > 10:
            activity_level = "High"
        elif commits_30 > 5:
            activity_level = "Moderate"
        elif commits_30 > 0:
            activity_level = "Low"
        else:
            activity_level = "Inactive"
        
        response_quality = "Excellent" if avg_response < 24 else \
                          "Good" if avg_response < 168 else \
                          "Fair" if avg_response < 720 else "Poor"
        
        return f"Maintainer activity level: {activity_level}. " \
               f"Response quality: {response_quality}. " \
               f"Recent commits: {commits_30} (30 days), {commits_7} (7 days). " \
               f"Open issues: {issues}, Open PRs: {pulls}."
    
    def _analyze_contribution_guide(self, owner: str, repo: str) -> Dict:
        """Analyze contribution guide quality"""
        # Check for common contribution guide files
        guide_files = [
            'CONTRIBUTING.md', 'CONTRIBUTING.rst', 'CONTRIBUTING.txt',
            'docs/CONTRIBUTING.md', 'docs/contributing.md',
            '.github/CONTRIBUTING.md', '.github/contributing.md'
        ]
        
        readme_files = ['README.md', 'README.rst', 'README.txt']
        
        # Check for contribution guide
        has_contributing_guide = any(
            self.github_api.check_file_exists(owner, repo, file) 
            for file in guide_files
        )
        
        # Check for README
        has_readme = any(
            self.github_api.check_file_exists(owner, repo, file) 
            for file in readme_files
        )
        
        # Check for issue templates
        has_issue_templates = self.github_api.check_file_exists(owner, repo, '.github/ISSUE_TEMPLATE')
        
        # Check for PR templates
        has_pr_templates = self.github_api.check_file_exists(owner, repo, '.github/pull_request_template.md')
        
        # Check for code of conduct
        has_code_of_conduct = any(
            self.github_api.check_file_exists(owner, repo, file)
            for file in ['CODE_OF_CONDUCT.md', 'CODE_OF_CONDUCT.rst', '.github/CODE_OF_CONDUCT.md']
        )
        
        # Check for license
        has_license = any(
            self.github_api.check_file_exists(owner, repo, file)
            for file in ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md']
        )
        
        # Calculate score
        score = 0
        score += 30 if has_contributing_guide else 0
        score += 20 if has_readme else 0
        score += 15 if has_issue_templates else 0
        score += 15 if has_pr_templates else 0
        score += 10 if has_code_of_conduct else 0
        score += 10 if has_license else 0
        
        # Generate analysis
        analysis = self._generate_contribution_analysis(
            has_contributing_guide, has_readme, has_issue_templates,
            has_pr_templates, has_code_of_conduct, has_license
        )
        
        return {
            'score': score,
            'analysis': analysis,
            'metrics': {
                'has_contributing_guide': has_contributing_guide,
                'has_readme': has_readme,
                'has_issue_templates': has_issue_templates,
                'has_pr_templates': has_pr_templates,
                'has_code_of_conduct': has_code_of_conduct,
                'has_license': has_license
            }
        }
    
    def _generate_contribution_analysis(self, has_contributing: bool, has_readme: bool,
                                       has_issue_templates: bool, has_pr_templates: bool,
                                       has_code_of_conduct: bool, has_license: bool) -> str:
        """Generate human-readable contribution guide analysis"""
        items = []
        if has_contributing:
            items.append("Contributing guide")
        if has_readme:
            items.append("README file")
        if has_issue_templates:
            items.append("Issue templates")
        if has_pr_templates:
            items.append("PR templates")
        if has_code_of_conduct:
            items.append("Code of conduct")
        if has_license:
            items.append("License")
        
        if not items:
            return "No contribution documentation found. This makes it difficult for new contributors."
        
        missing = []
        if not has_contributing:
            missing.append("contributing guide")
        if not has_readme:
            missing.append("README file")
        if not has_license:
            missing.append("license")
        
        analysis = f"Found: {', '.join(items)}."
        if missing:
            analysis += f" Missing: {', '.join(missing)}."
        
        return analysis
    
    def _calculate_overall_score(self, popularity: float, activity: float, contribution: float) -> float:
        """Calculate overall repository score"""
        # Weighted average
        weights = {'popularity': 0.4, 'activity': 0.4, 'contribution': 0.2}
        overall = (popularity * weights['popularity'] + 
                  activity * weights['activity'] + 
                  contribution * weights['contribution'])
        return round(overall, 2)
    
    def _generate_recommendations(self, popularity: Dict, activity: Dict, contribution: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Popularity recommendations
        if popularity['score'] < 30:
            recommendations.append("Improve repository visibility by adding a comprehensive README")
            recommendations.append("Consider adding topics/tags to make the repository discoverable")
            recommendations.append("Engage with the community through issues and discussions")
        
        # Activity recommendations
        if activity['score'] < 40:
            recommendations.append("Increase commit frequency to show active development")
            recommendations.append("Respond to issues and pull requests more quickly")
            recommendations.append("Consider setting up automated CI/CD pipelines")
        
        # Contribution guide recommendations
        if contribution['score'] < 50:
            recommendations.append("Add a CONTRIBUTING.md file to guide new contributors")
            recommendations.append("Create issue and pull request templates")
            recommendations.append("Add a code of conduct to foster a welcoming community")
        
        if not recommendations:
            recommendations.append("Great job! Your repository is well-maintained and contributor-friendly")
        
        return recommendations 