from django.db import models
from django.utils import timezone


class RepositoryAnalysis(models.Model):
    """Model to store repository analysis results"""
    owner = models.CharField(max_length=100)
    repo_name = models.CharField(max_length=100)
    full_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    # Repository metrics
    stars = models.IntegerField(default=0)
    forks = models.IntegerField(default=0)
    watchers = models.IntegerField(default=0)
    open_issues = models.IntegerField(default=0)
    open_pulls = models.IntegerField(default=0)
    
    # Analysis results
    popularity_score = models.FloatField(default=0.0)
    maintainer_activity_score = models.FloatField(default=0.0)
    contribution_guide_score = models.FloatField(default=0.0)
    overall_score = models.FloatField(default=0.0)
    
    # Detailed analysis
    popularity_prediction = models.TextField(blank=True, null=True)
    maintainer_activity_analysis = models.TextField(blank=True, null=True)
    contribution_guide_analysis = models.TextField(blank=True, null=True)
    recommendations = models.TextField(blank=True, null=True)
    
    # Metadata
    last_commit_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['owner', 'repo_name']
        verbose_name_plural = 'Repository Analyses'
    
    def __str__(self):
        return f"{self.owner}/{self.repo_name}"
    
    @property
    def github_url(self):
        return f"https://github.com/{self.owner}/{self.repo_name}"


class AnalysisHistory(models.Model):
    """Model to track analysis history for trending"""
    repository = models.ForeignKey(RepositoryAnalysis, on_delete=models.CASCADE)
    stars = models.IntegerField()
    forks = models.IntegerField()
    open_issues = models.IntegerField()
    popularity_score = models.FloatField()
    maintainer_activity_score = models.FloatField()
    contribution_guide_score = models.FloatField()
    overall_score = models.FloatField()
    analyzed_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name_plural = 'Analysis Histories'
        ordering = ['-analyzed_at']
    
    def __str__(self):
        return f"{self.repository.full_name} - {self.analyzed_at.strftime('%Y-%m-%d')}" 