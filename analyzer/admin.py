from django.contrib import admin
from .models import RepositoryAnalysis, AnalysisHistory


@admin.register(RepositoryAnalysis)
class RepositoryAnalysisAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'language', 'stars', 'forks', 'overall_score', 'created_at')
    list_filter = ('language', 'created_at', 'updated_at')
    search_fields = ('full_name', 'description', 'owner', 'repo_name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-overall_score', '-created_at')
    
    fieldsets = (
        ('Repository Information', {
            'fields': ('owner', 'repo_name', 'full_name', 'description', 'language', 'github_url')
        }),
        ('Metrics', {
            'fields': ('stars', 'forks', 'watchers', 'open_issues', 'open_pulls')
        }),
        ('Analysis Scores', {
            'fields': ('popularity_score', 'maintainer_activity_score', 'contribution_guide_score', 'overall_score')
        }),
        ('Analysis Details', {
            'fields': ('popularity_prediction', 'maintainer_activity_analysis', 'contribution_guide_analysis', 'recommendations')
        }),
        ('Metadata', {
            'fields': ('last_commit_date', 'created_at', 'updated_at')
        })
    )
    
    def github_url(self, obj):
        return obj.github_url
    github_url.short_description = 'GitHub URL'


@admin.register(AnalysisHistory)
class AnalysisHistoryAdmin(admin.ModelAdmin):
    list_display = ('repository', 'stars', 'forks', 'overall_score', 'analyzed_at')
    list_filter = ('analyzed_at',)
    search_fields = ('repository__full_name',)
    readonly_fields = ('analyzed_at',)
    ordering = ('-analyzed_at',)
    
    fieldsets = (
        ('Repository', {
            'fields': ('repository',)
        }),
        ('Metrics', {
            'fields': ('stars', 'forks', 'open_issues')
        }),
        ('Scores', {
            'fields': ('popularity_score', 'maintainer_activity_score', 'contribution_guide_score', 'overall_score')
        }),
        ('Metadata', {
            'fields': ('analyzed_at',)
        })
    ) 