// 🚀 Custom Improvements Example
// This file shows how to add your own improvements to RepoPulse

// Example 1: Adding a new analysis metric
class CustomAnalyzer extends RepoPulseAnalyzer {
    // Add a new score calculation
    calculateCustomScore(analysis) {
        let score = 0;
        
        // Example: Score based on repository age
        const ageInDays = (Date.now() - new Date(analysis.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > 365) score += 20; // Bonus for mature repositories
        else if (ageInDays > 180) score += 15;
        else if (ageInDays > 90) score += 10;
        else score += 5;
        
        // Example: Score based on documentation completeness
        if (analysis.description && analysis.description.length > 100) score += 15;
        if (analysis.topics && analysis.topics.length > 3) score += 10;
        
        return Math.min(100, score);
    }
    
    // Override the performAnalysis method to include your custom score
    async performAnalysis(owner, repo) {
        const analysis = await super.performAnalysis(owner, repo);
        
        // Add your custom score
        analysis.custom_score = this.calculateCustomScore(analysis);
        
        return analysis;
    }
}

// Example 2: Adding custom improvement suggestions
function generateCustomSuggestions(analysis) {
    const suggestions = {
        immediate: [],
        shortTerm: [],
        longTerm: []
    };
    
    // Example: Language-specific suggestions
    if (analysis.language === 'Python') {
        suggestions.immediate.push({
            title: 'Add Python Type Hints',
            description: 'Type hints improve code readability and IDE support',
            steps: [
                'Install mypy: pip install mypy',
                'Add type hints to function parameters',
                'Create a mypy configuration file',
                'Add type checking to CI/CD pipeline'
            ],
            effort: '2-3 hours',
            impact: 'Medium'
        });
    }
    
    // Example: Repository size optimization
    if (analysis.forks > 100) {
        suggestions.shortTerm.push({
            title: 'Optimize for Large Community',
            description: 'High fork count indicates strong community interest',
            steps: [
                'Create a community guidelines document',
                'Set up automated issue labeling',
                'Create contribution templates',
                'Establish communication channels (Discord/Slack)'
            ],
            effort: '1 day',
            impact: 'High'
        });
    }
    
    return suggestions;
}

// Example 3: Adding new API endpoints
async function fetchCustomData(owner, repo) {
    // Example: Fetch repository releases
    const releasesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=5`);
    if (!releasesResponse.ok) return [];
    
    const releases = await releasesResponse.json();
    return releases.map(release => ({
        name: release.name,
        tag_name: release.tag_name,
        published_at: release.published_at,
        downloads: release.assets.reduce((sum, asset) => sum + asset.download_count, 0)
    }));
}

// Example 4: Adding new chart types
function createCustomChart(analysis) {
    const ctx = document.getElementById('customChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Popularity', 'Activity', 'Documentation', 'Community', 'Custom Score'],
            datasets: [{
                label: 'Repository Metrics',
                data: [
                    analysis.popularity_score,
                    analysis.activity_score,
                    analysis.contribution_score,
                    analysis.custom_score || 0,
                    analysis.custom_score || 0
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Example 5: Adding custom UI components
function addCustomUI() {
    const customSection = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="analysis-card">
                    <div class="analysis-header" style="background: linear-gradient(135deg, #e83e8c, #d63384);">
                        <h3 class="mb-0">
                            <i class="fas fa-magic me-2"></i>Custom Analysis
                        </h3>
                    </div>
                    <div class="analysis-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h5>Custom Score: <span class="text-primary">${analysis.custom_score || 0}</span></h5>
                                <p class="text-muted">Your custom metric analysis</p>
                            </div>
                            <div class="col-md-6">
                                <canvas id="customChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert the custom section into the results
    const resultsContainer = document.querySelector('#results .container');
    resultsContainer.insertAdjacentHTML('beforeend', customSection);
}

// Example 6: Adding custom error handling
function handleCustomErrors(error) {
    if (error.message.includes('custom')) {
        console.log('Custom error occurred:', error);
        // Handle custom errors gracefully
        return {
            type: 'custom',
            message: 'Custom analysis failed, but other metrics are available',
            severity: 'warning'
        };
    }
    return null;
}

// Example 7: Adding custom validation
function validateCustomInput(input) {
    const customRules = {
        minDescriptionLength: 50,
        requireTopics: true,
        maxFileSize: 1000000 // 1MB
    };
    
    const errors = [];
    
    if (input.description && input.description.length < customRules.minDescriptionLength) {
        errors.push('Description should be at least 50 characters long');
    }
    
    if (customRules.requireTopics && (!input.topics || input.topics.length === 0)) {
        errors.push('Repository should have at least one topic');
    }
    
    return errors;
}

// Example 8: Adding custom export functionality
function exportCustomReport(analysis) {
    const report = {
        repository: analysis.full_name,
        analysis_date: new Date().toISOString(),
        scores: {
            overall: analysis.overall_score,
            popularity: analysis.popularity_score,
            activity: analysis.activity_score,
            contribution: analysis.contribution_score,
            custom: analysis.custom_score || 0
        },
        recommendations: analysis.recommendations,
        custom_suggestions: generateCustomSuggestions(analysis)
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.full_name.replace('/', '-')}-analysis.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// Example 9: Adding custom comparison logic
function compareRepositories(repo1, repo2) {
    const comparison = {
        repository1: repo1.full_name,
        repository2: repo2.full_name,
        differences: {}
    };
    
    // Compare scores
    const scoreDiff = repo1.overall_score - repo2.overall_score;
    comparison.differences.overall_score = {
        difference: scoreDiff,
        winner: scoreDiff > 0 ? repo1.full_name : repo2.full_name
    };
    
    // Compare activity
    const activityDiff = repo1.activity_score - repo2.activity_score;
    comparison.differences.activity = {
        difference: activityDiff,
        winner: activityDiff > 0 ? repo1.full_name : repo2.full_name
    };
    
    return comparison;
}

// Example 10: Adding custom notifications
function showCustomNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.insertBefore(notification, document.body.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Usage Example:
// To use these custom improvements, you would:

// 1. Extend the main analyzer
const customAnalyzer = new CustomAnalyzer();

// 2. Override the display method to include custom UI
const originalDisplayResults = customAnalyzer.displayResults;
customAnalyzer.displayResults = function(analysis) {
    originalDisplayResults.call(this, analysis);
    addCustomUI();
    createCustomChart(analysis);
};

// 3. Add custom error handling
window.addEventListener('error', (event) => {
    const customError = handleCustomErrors(event.error);
    if (customError) {
        showCustomNotification(customError.message, customError.severity);
    }
});

// 4. Add export button
document.addEventListener('DOMContentLoaded', () => {
    const exportButton = document.createElement('button');
    exportButton.className = 'btn btn-outline-secondary';
    exportButton.innerHTML = '<i class="fas fa-download me-2"></i>Export Report';
    exportButton.onclick = () => exportCustomReport(window.lastAnalysis);
    
    // Add to the UI where appropriate
    document.querySelector('.btn-group')?.appendChild(exportButton);
});

console.log('Custom improvements loaded! 🚀');
console.log('Check the examples above to see how to add your own features.'); 