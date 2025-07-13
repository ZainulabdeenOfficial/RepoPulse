from django import forms


class RepositoryAnalysisForm(forms.Form):
    """Form for repository analysis input"""
    
    repository_url = forms.URLField(
        label='GitHub Repository URL',
        help_text='Enter the full GitHub repository URL (e.g., https://github.com/username/repo-name)',
        widget=forms.URLInput(attrs={
            'class': 'form-control',
            'placeholder': 'https://github.com/username/repository-name'
        })
    )
    
    def clean_repository_url(self):
        """Validate and extract owner/repo from GitHub URL"""
        url = self.cleaned_data['repository_url']
        
        # Basic GitHub URL validation
        if 'github.com' not in url:
            raise forms.ValidationError('Please enter a valid GitHub repository URL')
        
        # Extract owner and repo name
        try:
            # Handle different GitHub URL formats
            if url.endswith('/'):
                url = url[:-1]
            
            parts = url.split('github.com/')[-1].split('/')
            if len(parts) < 2:
                raise forms.ValidationError('Invalid GitHub repository URL format')
            
            owner = parts[0]
            repo = parts[1]
            
            # Basic validation
            if not owner or not repo:
                raise forms.ValidationError('Could not extract owner and repository name from URL')
            
            # Store owner and repo in cleaned data
            self.cleaned_data['owner'] = owner
            self.cleaned_data['repo'] = repo
            
            return url
            
        except Exception:
            raise forms.ValidationError('Invalid GitHub repository URL format')


class AdvancedAnalysisForm(forms.Form):
    """Form for advanced analysis options"""
    
    include_traffic_data = forms.BooleanField(
        required=False,
        initial=False,
        label='Include Traffic Data',
        help_text='Include repository traffic analysis (requires GitHub token)'
    )
    
    include_community_health = forms.BooleanField(
        required=False,
        initial=True,
        label='Include Community Health',
        help_text='Analyze community health metrics'
    )
    
    analysis_depth = forms.ChoiceField(
        choices=[
            ('basic', 'Basic Analysis'),
            ('detailed', 'Detailed Analysis'),
            ('comprehensive', 'Comprehensive Analysis')
        ],
        initial='detailed',
        label='Analysis Depth',
        help_text='Choose the level of detail for the analysis'
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            if hasattr(field, 'widget'):
                field.widget.attrs.update({'class': 'form-control'})
            if isinstance(field.widget, forms.CheckboxInput):
                field.widget.attrs.update({'class': 'form-check-input'})


class ComparisonForm(forms.Form):
    """Form for comparing multiple repositories"""
    
    repository_urls = forms.CharField(
        label='Repository URLs',
        help_text='Enter multiple GitHub repository URLs, one per line',
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 5,
            'placeholder': 'https://github.com/username1/repo1\nhttps://github.com/username2/repo2\nhttps://github.com/username3/repo3'
        })
    )
    
    comparison_type = forms.ChoiceField(
        choices=[
            ('popularity', 'Popularity Comparison'),
            ('activity', 'Activity Level Comparison'),
            ('contributions', 'Contribution Guide Comparison'),
            ('overall', 'Overall Score Comparison')
        ],
        initial='overall',
        label='Comparison Type',
        help_text='Choose what aspect to compare'
    )
    
    def clean_repository_urls(self):
        """Validate and extract repository information from URLs"""
        urls_text = self.cleaned_data['repository_urls']
        urls = [url.strip() for url in urls_text.split('\n') if url.strip()]
        
        if len(urls) < 2:
            raise forms.ValidationError('Please provide at least 2 repository URLs for comparison')
        
        if len(urls) > 10:
            raise forms.ValidationError('Maximum 10 repositories can be compared at once')
        
        repositories = []
        for url in urls:
            if 'github.com' not in url:
                raise forms.ValidationError(f'Invalid GitHub URL: {url}')
            
            try:
                if url.endswith('/'):
                    url = url[:-1]
                
                parts = url.split('github.com/')[-1].split('/')
                if len(parts) < 2:
                    raise forms.ValidationError(f'Invalid GitHub repository URL format: {url}')
                
                owner = parts[0]
                repo = parts[1]
                
                if not owner or not repo:
                    raise forms.ValidationError(f'Could not extract owner and repository name from: {url}')
                
                repositories.append({
                    'url': url,
                    'owner': owner,
                    'repo': repo
                })
                
            except Exception:
                raise forms.ValidationError(f'Invalid GitHub repository URL format: {url}')
        
        self.cleaned_data['repositories'] = repositories
        return urls_text 