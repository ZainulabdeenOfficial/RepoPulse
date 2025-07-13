// RepoPulse - Real-time GitHub Analysis
class RepoPulse {
    constructor() {
        this.githubApiBase = 'https://api.github.com';
        this.rateLimitRemaining = 60;
        this.rateLimitReset = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkRateLimit();
    }

    setupEventListeners() {
        const form = document.getElementById('analysisForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.analyzeRepository();
        });
        // Comparison form event listener
        const comparisonForm = document.getElementById('comparisonForm');
        if (comparisonForm) {
            comparisonForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.compareRepositories();
            });
        }
    }

    async checkRateLimit() {
        try {
            const response = await fetch(`${this.githubApiBase}/rate_limit`);
            const data = await response.json();
            this.rateLimitRemaining = data.resources.core.remaining;
            this.rateLimitReset = data.resources.core.reset;
            
            // Update rate limit display
            const rateLimitInfo = document.getElementById('rateLimitInfo');
            if (rateLimitInfo) {
                const resetTime = new Date(this.rateLimitReset * 1000).toLocaleTimeString();
                rateLimitInfo.innerHTML = `
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        API calls remaining: ${this.rateLimitRemaining} | Resets at: ${resetTime}
                    </small>
                `;
            }
        } catch (error) {
            console.log('Rate limit check failed:', error);
        }
    }

    async analyzeRepository() {
        const url = document.getElementById('repositoryUrl').value;
        const button = document.getElementById('analyzeBtn');
        
        if (!this.validateUrl(url)) {
            this.showError('Please enter a valid GitHub repository URL');
            return;
        }

        // Check rate limit before starting analysis
        await this.checkRateLimit();
        
        if (this.rateLimitRemaining < 10) {
            const resetTime = new Date(this.rateLimitReset * 1000).toLocaleTimeString();
            this.showError(`GitHub API rate limit low (${this.rateLimitRemaining} remaining). Please wait until ${resetTime} or try again later.`);
            return;
        }

        this.showLoading(true);
        button.disabled = true;

        try {
            const { owner, repo } = this.parseGitHubUrl(url);
            const analysis = await this.performAnalysis(owner, repo);
            this.displayResults(analysis);
        } catch (error) {
            if (error.message.includes('rate limit')) {
                const resetTime = new Date(this.rateLimitReset * 1000).toLocaleTimeString();
                this.showError(`GitHub API rate limit exceeded. Please try again after ${resetTime}.`);
            } else {
                this.showError(`Analysis failed: ${error.message}`);
            }
        } finally {
            this.showLoading(false);
            button.disabled = false;
        }
    }

    async compareRepositories() {
        const repo1Url = document.getElementById('repo1Url').value;
        const repo2Url = document.getElementById('repo2Url').value;
        const comparisonType = document.getElementById('comparisonType').value;
        const compareBtn = document.getElementById('compareBtn');
        const resultsSection = document.getElementById('comparisonResults');
        resultsSection.style.display = 'none';
        resultsSection.innerHTML = '';

        if (!this.validateUrl(repo1Url) || !this.validateUrl(repo2Url)) {
            resultsSection.style.display = 'block';
            resultsSection.innerHTML = `<div class='alert alert-danger'>Please enter valid GitHub repository URLs for both fields.</div>`;
            return;
        }

        compareBtn.disabled = true;
        compareBtn.querySelector('.loading').style.display = 'inline-block';

        try {
            // Fetch and analyze both repositories in parallel
            const [{ owner: owner1, repo: repo1 }, { owner: owner2, repo: repo2 }] = [
                this.parseGitHubUrl(repo1Url),
                this.parseGitHubUrl(repo2Url)
            ];
            resultsSection.style.display = 'block';
            resultsSection.innerHTML = `<div class='text-center my-4'><div class='spinner-border text-primary'></div><p>Analyzing repositories...</p></div>`;
            const [analysis1, analysis2] = await Promise.all([
                this.performAnalysis(owner1, repo1),
                this.performAnalysis(owner2, repo2)
            ]);
            resultsSection.innerHTML = this.generateComparisonHTML(analysis1, analysis2, comparisonType);
        } catch (error) {
            resultsSection.style.display = 'block';
            // Improved error handling for rate limit
            if (error.message && error.message.toLowerCase().includes('rate limit')) {
                let resetTime = '';
                if (this.rateLimitReset) {
                    resetTime = new Date(this.rateLimitReset * 1000).toLocaleTimeString();
                }
                resultsSection.innerHTML = `<div class='alert alert-warning'>
                    <strong>GitHub API rate limit exceeded.</strong><br>
                    Please wait until ${resetTime || 'the next hour'} or try again later.<br>
                    <span class='text-muted'>Tip: Try again in a few minutes, or use a GitHub token for higher limits.</span>
                </div>`;
            } else {
                resultsSection.innerHTML = `<div class='alert alert-danger'>Comparison failed: ${error.message}</div>`;
            }
        } finally {
            compareBtn.disabled = false;
            compareBtn.querySelector('.loading').style.display = 'none';
        }
    }

    generateComparisonHTML(a, b, type) {
        // Helper to get the right metric
        const getMetric = (analysis, key) => {
            switch (key) {
                case 'overall': return analysis.overall_score;
                case 'popularity': return analysis.popularity_score;
                case 'activity': return analysis.activity_score;
                case 'community': return analysis.contribution_score;
                case 'maturity': return analysis.maturity_score;
                default: return analysis.overall_score;
            }
        };
        const metrics = [
            { label: 'Overall Score', key: 'overall' },
            { label: 'Popularity', key: 'popularity' },
            { label: 'Activity', key: 'activity' },
            { label: 'Community', key: 'community' },
            { label: 'Maturity', key: 'maturity' },
            { label: 'Stars', key: 'stars' },
            { label: 'Forks', key: 'forks' },
            { label: 'Watchers', key: 'watchers' },
            { label: 'Open Issues', key: 'open_issues' },
            { label: 'Contributors', key: 'contributors' },
            { label: 'Language', key: 'language' },
            { label: 'Last Updated', key: 'updated_at' }
        ];
        return `
            <div class="card">
                <div class="card-header text-center">
                    <h4 class="mb-0"><i class="fas fa-balance-scale me-2"></i>Repository Comparison</h4>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-5 text-center">
                            <a href="${a.github_url}" target="_blank"><h5>${a.full_name}</h5></a>
                            <p class="text-muted small">${a.description || ''}</p>
                        </div>
                        <div class="col-md-2 text-center d-flex align-items-center justify-content-center">
                            <span class="fw-bold">VS</span>
                        </div>
                        <div class="col-md-5 text-center">
                            <a href="${b.github_url}" target="_blank"><h5>${b.full_name}</h5></a>
                            <p class="text-muted small">${b.description || ''}</p>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-bordered align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th>Metric</th>
                                    <th>${a.full_name}</th>
                                    <th>${b.full_name}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${metrics.map(m => `
                                    <tr>
                                        <td>${m.label}</td>
                                        <td>${this.formatMetric(a, m.key)}</td>
                                        <td>${this.formatMetric(b, m.key)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    formatMetric(analysis, key) {
        switch (key) {
            case 'overall': return analysis.overall_score;
            case 'popularity': return analysis.popularity_score;
            case 'activity': return analysis.activity_score;
            case 'community': return analysis.contribution_score;
            case 'maturity': return analysis.maturity_score;
            case 'stars': return analysis.stars.toLocaleString();
            case 'forks': return analysis.forks.toLocaleString();
            case 'watchers': return analysis.watchers.toLocaleString();
            case 'open_issues': return analysis.open_issues.toLocaleString();
            case 'contributors': return analysis.contributors.length;
            case 'language': return analysis.language || 'Unknown';
            case 'updated_at': return new Date(analysis.updated_at).toLocaleDateString();
            default: return '-';
        }
    }

    validateUrl(url) {
        const githubRegex = /^https?:\/\/github\.com\/[^\/]+\/[^\/]+$/;
        return githubRegex.test(url);
    }

    parseGitHubUrl(url) {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('Invalid GitHub URL format');
        }
        return {
            owner: match[1],
            repo: match[2].replace('.git', '')
        };
    }

    async performAnalysis(owner, repo) {
        // First, get basic info to validate repository exists
        const basicInfo = await this.fetchBasicInfo(owner, repo);
        
        // Then fetch other data in parallel to reduce total time
        const [commits, issues, pulls, contributors, languages, topics, releases, stargazers] = await Promise.all([
            this.fetchRecentCommits(owner, repo),
            this.fetchIssues(owner, repo),
            this.fetchPullRequests(owner, repo),
            this.fetchContributors(owner, repo),
            this.fetchLanguages(owner, repo),
            this.fetchTopics(owner, repo),
            this.fetchReleases(owner, repo),
            this.fetchStargazers(owner, repo)
        ]);

        const analysis = {
            owner,
            repo,
            full_name: basicInfo.full_name,
            description: basicInfo.description,
            stars: basicInfo.stargazers_count,
            forks: basicInfo.forks_count,
            watchers: basicInfo.subscribers_count,
            open_issues: basicInfo.open_issues_count,
            language: basicInfo.language,
            created_at: basicInfo.created_at,
            updated_at: basicInfo.updated_at,
            github_url: basicInfo.html_url,
            commits: commits,
            issues: issues,
            pulls: pulls,
            contributors: contributors,
            languages: languages,
            topics: topics,
            releases: releases,
            stargazers: stargazers
        };

        // Calculate scores
        analysis.popularity_score = this.calculatePopularityScore(analysis);
        analysis.activity_score = this.calculateActivityScore(analysis);
        analysis.contribution_score = await this.calculateContributionScore(owner, repo);
        analysis.overall_score = this.calculateOverallScore(analysis);
        
        // NEW: Calculate unique scores
        analysis.health_score = this.calculateHealthScore(analysis);
        analysis.maturity_score = this.calculateMaturityScore(analysis);
        analysis.trend_score = this.calculateTrendScore(analysis);
        analysis.competitor_score = await this.calculateCompetitorScore(analysis);

        // Generate insights
        analysis.popularity_prediction = this.generatePopularityPrediction(analysis);
        analysis.activity_analysis = this.generateActivityAnalysis(analysis);
        analysis.contribution_analysis = await this.generateContributionAnalysis(owner, repo);
        analysis.recommendations = this.generateRecommendations(analysis);
        
        // NEW: Generate unique insights
        analysis.ai_insights = this.generateAIInsights(analysis);
        analysis.health_analysis = this.generateHealthAnalysis(analysis);
        analysis.maturity_assessment = this.generateMaturityAssessment(analysis);
        analysis.trend_analysis = this.generateTrendAnalysis(analysis);
        analysis.competitor_analysis = await this.generateCompetitorAnalysis(analysis);
        analysis.risk_assessment = this.generateRiskAssessment(analysis);
        analysis.growth_opportunities = this.generateGrowthOpportunities(analysis);

        return analysis;
    }

    async fetchBasicInfo(owner, repo) {
        const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}`);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded');
            }
            throw new Error(`Repository not found: ${owner}/${repo}`);
        }
        return await response.json();
    }

    async fetchRecentCommits(owner, repo) {
        const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/commits?per_page=30`);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded');
            }
            return [];
        }
        return await response.json();
    }

    async fetchIssues(owner, repo) {
        const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/issues?state=open&per_page=100`);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded');
            }
            return [];
        }
        return await response.json();
    }

    async fetchPullRequests(owner, repo) {
        const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/pulls?state=open&per_page=100`);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded');
            }
            return [];
        }
        return await response.json();
    }

    async fetchContributors(owner, repo) {
        const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/contributors?per_page=100`);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded');
            }
            return [];
        }
        return await response.json();
    }

    async fetchLanguages(owner, repo) {
        const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/languages`);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded');
            }
            return {};
        }
        return await response.json();
    }

    async fetchTopics(owner, repo) {
        const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/topics`, {
            headers: {
                'Accept': 'application/vnd.github.mercy-preview+json'
            }
        });
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded');
            }
            return [];
        }
        const data = await response.json();
        return data.names || [];
    }

    async fetchReleases(owner, repo) {
        const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/releases?per_page=10`);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded');
            }
            return [];
        }
        return await response.json();
    }

    async fetchStargazers(owner, repo) {
        const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/stargazers?per_page=100`);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded');
            }
            return [];
        }
        return await response.json();
    }

    calculatePopularityScore(analysis) {
        const logStars = Math.log1p(analysis.stars);
        const logForks = Math.log1p(analysis.forks);
        const logWatchers = Math.log1p(analysis.watchers);
        
        const score = (logStars * 0.5 + logForks * 0.3 + logWatchers * 0.2);
        const maxScore = Math.log1p(100000) * 0.5 + Math.log1p(10000) * 0.3 + Math.log1p(5000) * 0.2;
        
        return Math.min(100, Math.round((score / maxScore) * 100));
    }

    calculateActivityScore(analysis) {
        const recentCommits = analysis.commits.filter(commit => {
            const commitDate = new Date(commit.commit.author.date);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return commitDate > thirtyDaysAgo;
        }).length;

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentCommits7Days = analysis.commits.filter(commit => {
            const commitDate = new Date(commit.commit.author.date);
            return commitDate > sevenDaysAgo;
        }).length;

        let score = 0;
        
        // Commit activity (50 points max)
        score += Math.min(50, recentCommits * 2 + recentCommits7Days * 5);
        
        // Issue/PR engagement (30 points max)
        score += Math.min(30, (analysis.issues.length + analysis.pulls.length) * 0.5);
        
        // Contributor diversity (20 points max)
        score += Math.min(20, analysis.contributors.length * 0.5);

        return Math.round(score);
    }

    async calculateContributionScore(owner, repo) {
        // Only check the most common files to reduce API calls
        const essentialFiles = [
            'README.md',
            'CONTRIBUTING.md',
            'LICENSE'
        ];

        let score = 0;
        const foundFiles = [];

        // Check files in parallel to reduce API calls
        const fileChecks = essentialFiles.map(async (file) => {
            try {
                const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/contents/${file}`);
                if (response.ok) {
                    score += 20; // Higher score per file since we check fewer
                    foundFiles.push(file);
                }
            } catch (error) {
                // Silently handle missing files - this is expected behavior
            }
        });

        await Promise.all(fileChecks);

        // Add bonus points for additional files if we have API calls to spare
        if (this.rateLimitRemaining > 5) {
            const additionalFiles = [
                '.github/ISSUE_TEMPLATE',
                '.github/pull_request_template.md',
                'CODE_OF_CONDUCT.md'
            ];

            for (const file of additionalFiles) {
                try {
                    const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/contents/${file}`);
                    if (response.ok) {
                        score += 10;
                        foundFiles.push(file);
                    }
                } catch (error) {
                    // Silently handle missing files
                }
            }
        }

        return Math.min(100, score);
    }

    calculateOverallScore(analysis) {
        const weights = {
            popularity: 0.4,
            activity: 0.4,
            contribution: 0.2
        };

        return Math.round(
            analysis.popularity_score * weights.popularity +
            analysis.activity_score * weights.activity +
            analysis.contribution_score * weights.contribution
        );
    }

    // NEW: Unique scoring algorithms
    calculateHealthScore(analysis) {
        let score = 0;
        
        // Issue resolution rate
        const totalIssues = analysis.open_issues + (analysis.issues.length - analysis.open_issues);
        if (totalIssues > 0) {
            const resolutionRate = (totalIssues - analysis.open_issues) / totalIssues;
            score += resolutionRate * 25;
        }
        
        // Recent activity (last 30 days)
        const daysSinceUpdate = Math.floor((Date.now() - new Date(analysis.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate <= 7) score += 25;
        else if (daysSinceUpdate <= 30) score += 15;
        else if (daysSinceUpdate <= 90) score += 10;
        
        // Release frequency
        if (analysis.releases.length > 0) {
            const latestRelease = new Date(analysis.releases[0].published_at);
            const daysSinceRelease = Math.floor((Date.now() - latestRelease.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceRelease <= 30) score += 20;
            else if (daysSinceRelease <= 90) score += 15;
            else if (daysSinceRelease <= 180) score += 10;
        }
        
        // Contributor diversity
        const uniqueContributors = new Set(analysis.contributors.map(c => c.login)).size;
        if (uniqueContributors >= 10) score += 15;
        else if (uniqueContributors >= 5) score += 10;
        else if (uniqueContributors >= 2) score += 5;
        
        // Documentation completeness
        if (analysis.contribution_score > 0.7) score += 15;
        else if (analysis.contribution_score > 0.5) score += 10;
        
        return Math.min(100, Math.round(score));
    }

    calculateMaturityScore(analysis) {
        let score = 0;
        
        // Repository age
        const ageInDays = Math.floor((Date.now() - new Date(analysis.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (ageInDays > 1095) score += 25; // 3+ years
        else if (ageInDays > 730) score += 20; // 2+ years
        else if (ageInDays > 365) score += 15; // 1+ year
        else if (ageInDays > 180) score += 10; // 6+ months
        else if (ageInDays > 90) score += 5; // 3+ months
        
        // Community size
        if (analysis.stars >= 1000) score += 20;
        else if (analysis.stars >= 500) score += 15;
        else if (analysis.stars >= 100) score += 10;
        else if (analysis.stars >= 50) score += 5;
        
        // Fork activity
        if (analysis.forks >= 100) score += 15;
        else if (analysis.forks >= 50) score += 10;
        else if (analysis.forks >= 10) score += 5;
        
        // Release stability
        if (analysis.releases.length >= 5) score += 15;
        else if (analysis.releases.length >= 3) score += 10;
        else if (analysis.releases.length >= 1) score += 5;
        
        // Documentation maturity
        if (analysis.contribution_score > 0.8) score += 15;
        else if (analysis.contribution_score > 0.6) score += 10;
        else if (analysis.contribution_score > 0.4) score += 5;
        
        // Language diversity
        const languageCount = Object.keys(analysis.languages).length;
        if (languageCount >= 3) score += 10;
        else if (languageCount >= 2) score += 5;
        
        return Math.min(100, Math.round(score));
    }

    calculateTrendScore(analysis) {
        let score = 0;
        
        // Recent star growth
        const recentStargazers = analysis.stargazers.slice(0, 10);
        if (recentStargazers.length > 0) {
            const recentStarCount = recentStargazers.length;
            if (recentStarCount >= 8) score += 25;
            else if (recentStarCount >= 5) score += 15;
            else if (recentStarCount >= 2) score += 10;
        }
        
        // Recent commit activity
        const recentCommits = analysis.commits.slice(0, 10);
        const commitDates = recentCommits.map(c => new Date(c.commit.author.date));
        const now = new Date();
        const recentActivity = commitDates.filter(date => (now - date) <= 7 * 24 * 60 * 60 * 1000).length;
        
        if (recentActivity >= 5) score += 25;
        else if (recentActivity >= 3) score += 15;
        else if (recentActivity >= 1) score += 10;
        
        // Issue engagement
        const recentIssues = analysis.issues.slice(0, 20);
        const issuesWithComments = recentIssues.filter(issue => issue.comments > 0).length;
        if (issuesWithComments >= 10) score += 20;
        else if (issuesWithComments >= 5) score += 15;
        else if (issuesWithComments >= 2) score += 10;
        
        // Pull request activity
        const recentPRs = analysis.pulls.slice(0, 20);
        const activePRs = recentPRs.filter(pr => pr.state === 'open').length;
        if (activePRs >= 5) score += 15;
        else if (activePRs >= 2) score += 10;
        else if (activePRs >= 1) score += 5;
        
        // Release frequency
        if (analysis.releases.length > 0) {
            const latestRelease = new Date(analysis.releases[0].published_at);
            const daysSinceRelease = Math.floor((Date.now() - latestRelease.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceRelease <= 30) score += 15;
            else if (daysSinceRelease <= 90) score += 10;
        }
        
        return Math.min(100, Math.round(score));
    }

    async calculateCompetitorScore(analysis) {
        let score = 0;
        
        // Calculate based on similar repositories in the same language
        if (analysis.language) {
            try {
                const searchResponse = await fetch(`${this.githubApiBase}/search/repositories?q=language:${analysis.language}&sort=stars&order=desc&per_page=100`);
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    const similarRepos = searchData.items;
                    
                    // Find position in similar repos
                    const position = similarRepos.findIndex(repo => repo.full_name === analysis.full_name);
                    if (position !== -1) {
                        if (position <= 10) score += 30;
                        else if (position <= 50) score += 20;
                        else if (position <= 100) score += 15;
                        else if (position <= 500) score += 10;
                        else score += 5;
                    }
                    
                    // Compare with top repos
                    const topRepos = similarRepos.slice(0, 10);
                    const avgStars = topRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0) / topRepos.length;
                    const avgForks = topRepos.reduce((sum, repo) => sum + repo.forks_count, 0) / topRepos.length;
                    
                    if (analysis.stars >= avgStars * 0.5) score += 20;
                    if (analysis.forks >= avgForks * 0.5) score += 15;
                }
            } catch (error) {
                console.log('Competitor analysis failed:', error);
            }
        }
        
        // Topic-based comparison
        if (analysis.topics.length > 0) {
            const topicScore = Math.min(20, analysis.topics.length * 2);
            score += topicScore;
        }
        
        // Documentation comparison
        if (analysis.contribution_score > 0.8) score += 15;
        else if (analysis.contribution_score > 0.6) score += 10;
        
        return Math.min(100, Math.round(score));
    }

    generatePopularityPrediction(analysis) {
        const stars = analysis.stars;
        const forks = analysis.forks;
        const recentCommits = analysis.commits.length;

        if (stars > 1000 && forks > 100) {
            if (recentCommits > 20) {
                return "High growth potential - Strong community engagement and active development";
            } else {
                return "Stable popularity - Well-established but may need more active development";
            }
        } else if (stars > 100) {
            if (recentCommits > 10) {
                return "Growing popularity - Good momentum with recent activity";
            } else {
                return "Moderate growth potential - Needs more active development";
            }
        } else {
            if (recentCommits > 5) {
                return "Emerging popularity - Early stage with active development";
            } else {
                return "Low growth potential - Needs more community engagement and development";
            }
        }
    }

    generateActivityAnalysis(analysis) {
        const recentCommits = analysis.commits.filter(commit => {
            const commitDate = new Date(commit.commit.author.date);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return commitDate > thirtyDaysAgo;
        }).length;

        let activityLevel = "Inactive";
        if (recentCommits > 20) activityLevel = "Very High";
        else if (recentCommits > 10) activityLevel = "High";
        else if (recentCommits > 5) activityLevel = "Moderate";
        else if (recentCommits > 0) activityLevel = "Low";

        return `Maintainer activity level: ${activityLevel}. Recent commits: ${recentCommits} (30 days). Open issues: ${analysis.issues.length}, Open PRs: ${analysis.pulls.length}. Contributors: ${analysis.contributors.length}.`;
    }

    async generateContributionAnalysis(owner, repo) {
        // Use the same files we checked in calculateContributionScore to avoid duplicate API calls
        const essentialFiles = ['README.md', 'CONTRIBUTING.md', 'LICENSE'];
        const found = [];
        const missing = [];

        for (const file of essentialFiles) {
            try {
                const response = await fetch(`${this.githubApiBase}/repos/${owner}/${repo}/contents/${file}`);
                if (response.ok) {
                    found.push(file);
                } else {
                    missing.push(file);
                }
            } catch (error) {
                // Silently handle missing files
                missing.push(file);
            }
        }

        let analysis = `Found: ${found.join(', ') || 'none'}.`;
        if (missing.length > 0) {
            analysis += ` Missing: ${missing.join(', ')}.`;
        }

        return analysis;
    }

    generateRecommendations(analysis) {
        const recommendations = [];
        
        // Popularity recommendations
        if (analysis.stars < 100) {
            recommendations.push({
                category: 'Popularity',
                priority: 'High',
                title: 'Increase Repository Visibility',
                description: 'Your repository has low star count. Focus on marketing and community engagement.',
                actions: [
                    'Add a compelling README with screenshots and demos',
                    'Share on social media and developer communities',
                    'Write blog posts about your project',
                    'Submit to GitHub trending and showcase platforms'
                ]
            });
        }
        
        if (analysis.forks < 10) {
            recommendations.push({
                category: 'Community',
                priority: 'Medium',
                title: 'Encourage Contributions',
                description: 'Low fork count indicates limited community engagement.',
                actions: [
                    'Add contribution guidelines (CONTRIBUTING.md)',
                    'Create good first issues for new contributors',
                    'Respond quickly to pull requests and issues',
                    'Add a code of conduct'
                ]
            });
        }
        
        // Activity recommendations
        const daysSinceLastUpdate = Math.floor((Date.now() - new Date(analysis.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastUpdate > 30) {
            recommendations.push({
                category: 'Activity',
                priority: 'High',
                title: 'Maintain Regular Updates',
                description: `Repository hasn't been updated in ${daysSinceLastUpdate} days.`,
                actions: [
                    'Schedule regular maintenance updates',
                    'Set up automated dependency updates',
                    'Create a roadmap for future features',
                    'Engage with open issues and pull requests'
                ]
            });
        }
        
        if (analysis.open_issues > 50) {
            recommendations.push({
                category: 'Maintenance',
                priority: 'High',
                title: 'Address Open Issues',
                description: 'High number of open issues may discourage contributors.',
                actions: [
                    'Review and close outdated issues',
                    'Create issue templates for better organization',
                    'Set up issue labels and milestones',
                    'Prioritize critical bugs and feature requests'
                ]
            });
        }
        
        // Documentation recommendations
        if (analysis.contribution_score < 0.6) {
            recommendations.push({
                category: 'Documentation',
                priority: 'Medium',
                title: 'Improve Documentation',
                description: 'Documentation quality needs improvement.',
                actions: [
                    'Add comprehensive README with installation instructions',
                    'Create API documentation if applicable',
                    'Add inline code comments',
                    'Create tutorials and examples'
                ]
            });
        }
        
        // Language diversity
        if (Object.keys(analysis.languages).length === 1) {
            recommendations.push({
                category: 'Technology',
                priority: 'Low',
                title: 'Consider Multi-language Support',
                description: 'Single language repositories may have limited reach.',
                actions: [
                    'Consider adding support for popular languages',
                    'Create language-specific documentation',
                    'Add internationalization if applicable',
                    'Consider creating SDKs for different platforms'
                ]
            });
        }
        
        return recommendations;
    }

    generateImprovementSuggestions(analysis) {
        const suggestions = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            technical: [],
            community: []
        };
        
        // Immediate improvements (can be done today)
        if (!analysis.description || analysis.description.length < 50) {
            suggestions.immediate.push({
                title: 'Add Repository Description',
                description: 'A clear description helps users understand your project',
                steps: [
                    'Go to your repository settings',
                    'Add a concise, compelling description',
                    'Include key features and benefits',
                    'Add relevant emojis for visual appeal'
                ],
                effort: '5 minutes',
                impact: 'High'
            });
        }
        
        if (analysis.stars < 50) {
            suggestions.immediate.push({
                title: 'Create a Stellar README',
                description: 'README is the first thing visitors see',
                steps: [
                    'Add project logo/banner',
                    'Include quick start guide',
                    'Add screenshots or GIFs',
                    'List key features and benefits',
                    'Add badges (build status, version, etc.)',
                    'Include installation instructions'
                ],
                effort: '30 minutes',
                impact: 'Very High'
            });
        }
        
        // Short-term improvements (1-2 weeks)
        if (analysis.open_issues > 20) {
            suggestions.shortTerm.push({
                title: 'Organize Issues and PRs',
                description: 'Better organization improves contributor experience',
                steps: [
                    'Create issue templates',
                    'Set up issue labels (bug, enhancement, documentation)',
                    'Create milestones for version planning',
                    'Close outdated or duplicate issues',
                    'Add issue guidelines to README'
                ],
                effort: '2-3 hours',
                impact: 'High'
            });
        }
        
        if (analysis.contribution_score < 0.7) {
            suggestions.shortTerm.push({
                title: 'Improve Contribution Guidelines',
                description: 'Clear guidelines encourage community contributions',
                steps: [
                    'Create CONTRIBUTING.md file',
                    'Add code style guidelines',
                    'Include testing requirements',
                    'Add pull request template',
                    'Create development setup guide'
                ],
                effort: '1-2 hours',
                impact: 'High'
            });
        }
        
        // Long-term improvements (1-3 months)
        suggestions.longTerm.push({
            title: 'Build Community Engagement',
            description: 'Active community drives project success',
            steps: [
                'Create a Discord/Slack community',
                'Start a blog or newsletter',
                'Create video tutorials',
                'Participate in conferences/meetups',
                'Collaborate with other projects',
                'Create a roadmap and share it publicly'
            ],
            effort: 'Ongoing',
            impact: 'Very High'
        });
        
        // Technical improvements
        if (analysis.language && analysis.language.toLowerCase() === 'javascript') {
            suggestions.technical.push({
                title: 'Add TypeScript Support',
                description: 'TypeScript improves code quality and developer experience',
                steps: [
                    'Add TypeScript configuration',
                    'Convert key files to .ts',
                    'Add type definitions',
                    'Update build process',
                    'Add ESLint and Prettier'
                ],
                effort: '1-2 days',
                impact: 'Medium'
            });
        }
        
        suggestions.technical.push({
            title: 'Implement CI/CD Pipeline',
            description: 'Automated testing and deployment improves reliability',
            steps: [
                'Set up GitHub Actions',
                'Add automated testing',
                'Configure code coverage reporting',
                'Add automated dependency updates',
                'Set up deployment automation'
            ],
            effort: '1 day',
            impact: 'High'
        });
        
        // Community improvements
        suggestions.community.push({
            title: 'Create Good First Issues',
            description: 'Help new contributors get started',
            steps: [
                'Label existing simple issues as "good first issue"',
                    'Create documentation improvement tasks',
                    'Add beginner-friendly feature requests',
                    'Create "help wanted" issues',
                    'Add mentoring guidelines'
            ],
            effort: '2-3 hours',
            impact: 'High'
        });
        
        return suggestions;
    }

    // NEW: Unique insight generation methods
    generateAIInsights(analysis) {
        const insights = [];
        
        // Star-to-fork ratio analysis
        const starToForkRatio = analysis.stars / Math.max(analysis.forks, 1);
        if (starToForkRatio > 10) {
            insights.push({
                type: 'warning',
                title: 'High Star-to-Fork Ratio',
                message: 'Many users are interested but few are contributing. Consider making the project more contributor-friendly.',
                impact: 'Medium'
            });
        } else if (starToForkRatio < 2) {
            insights.push({
                type: 'success',
                title: 'Healthy Community Engagement',
                message: 'Good balance between interest and contribution. The community is actively involved.',
                impact: 'High'
            });
        }
        
        // Activity pattern analysis
        const recentCommits = analysis.commits.slice(0, 10);
        const commitDates = recentCommits.map(c => new Date(c.commit.author.date));
        const timeGaps = [];
        for (let i = 1; i < commitDates.length; i++) {
            timeGaps.push(commitDates[i-1] - commitDates[i]);
        }
        
        if (timeGaps.length > 0) {
            const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
            const avgDays = avgGap / (1000 * 60 * 60 * 24);
            
            if (avgDays > 30) {
                insights.push({
                    type: 'warning',
                    title: 'Irregular Development Pattern',
                    message: 'Development activity is sporadic. Consider establishing a regular release schedule.',
                    impact: 'Medium'
                });
            } else if (avgDays < 7) {
                insights.push({
                    type: 'success',
                    title: 'Consistent Development',
                    message: 'Regular development activity indicates a well-maintained project.',
                    impact: 'High'
                });
            }
        }
        
        // Community health analysis
        const uniqueContributors = new Set(analysis.contributors.map(c => c.login)).size;
        const contributorRatio = uniqueContributors / Math.max(analysis.stars, 1);
        
        if (contributorRatio > 0.1) {
            insights.push({
                type: 'success',
                title: 'Strong Community Participation',
                message: 'High contributor-to-star ratio indicates an engaged community.',
                impact: 'High'
            });
        } else if (contributorRatio < 0.01) {
            insights.push({
                type: 'warning',
                title: 'Limited Community Contribution',
                message: 'Low contributor ratio suggests the project may be too complex or lacks contribution guidelines.',
                impact: 'Medium'
            });
        }
        
        return insights;
    }

    generateHealthAnalysis(analysis) {
        const healthFactors = [];
        
        // Issue health
        const issueResolutionRate = analysis.open_issues > 0 ? 
            (analysis.issues.length - analysis.open_issues) / analysis.issues.length : 1;
        
        if (issueResolutionRate > 0.8) {
            healthFactors.push('Excellent issue resolution rate');
        } else if (issueResolutionRate > 0.6) {
            healthFactors.push('Good issue management');
        } else {
            healthFactors.push('Issues may be accumulating');
        }
        
        // Activity health
        const daysSinceUpdate = Math.floor((Date.now() - new Date(analysis.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate <= 7) {
            healthFactors.push('Very recent activity');
        } else if (daysSinceUpdate <= 30) {
            healthFactors.push('Recent activity');
        } else if (daysSinceUpdate <= 90) {
            healthFactors.push('Moderate activity');
        } else {
            healthFactors.push('Limited recent activity');
        }
        
        // Release health
        if (analysis.releases.length > 0) {
            const latestRelease = new Date(analysis.releases[0].published_at);
            const daysSinceRelease = Math.floor((Date.now() - latestRelease.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceRelease <= 30) {
                healthFactors.push('Recent releases');
            } else if (daysSinceRelease <= 90) {
                healthFactors.push('Moderate release frequency');
            } else {
                healthFactors.push('Infrequent releases');
            }
        } else {
            healthFactors.push('No formal releases');
        }
        
        return healthFactors;
    }

    generateMaturityAssessment(analysis) {
        const ageInDays = Math.floor((Date.now() - new Date(analysis.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const ageInYears = ageInDays / 365;
        
        let maturityLevel = 'Infant';
        let maturityDescription = '';
        
        if (ageInYears >= 3) {
            maturityLevel = 'Mature';
            maturityDescription = 'Well-established project with proven track record';
        } else if (ageInYears >= 2) {
            maturityLevel = 'Adolescent';
            maturityDescription = 'Growing project with established community';
        } else if (ageInYears >= 1) {
            maturityLevel = 'Young Adult';
            maturityDescription = 'Developing project with active community';
        } else if (ageInDays >= 180) {
            maturityLevel = 'Teenager';
            maturityDescription = 'Established project with growing community';
        } else if (ageInDays >= 90) {
            maturityLevel = 'Child';
            maturityDescription = 'Young project with emerging community';
        } else {
            maturityLevel = 'Infant';
            maturityDescription = 'New project in early development';
        }
        
        return {
            level: maturityLevel,
            description: maturityDescription,
            ageInDays: ageInDays,
            ageInYears: ageInYears.toFixed(1)
        };
    }

    generateTrendAnalysis(analysis) {
        const trends = [];
        
        // Star growth trend
        const recentStargazers = analysis.stargazers.slice(0, 10);
        if (recentStargazers.length >= 5) {
            trends.push('Recent star growth indicates increasing interest');
        } else if (recentStargazers.length >= 2) {
            trends.push('Moderate star growth');
        } else {
            trends.push('Limited recent star growth');
        }
        
        // Commit trend
        const recentCommits = analysis.commits.slice(0, 10);
        const commitDates = recentCommits.map(c => new Date(c.commit.author.date));
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentWeekCommits = commitDates.filter(date => date > weekAgo).length;
        
        if (recentWeekCommits >= 3) {
            trends.push('High recent development activity');
        } else if (recentWeekCommits >= 1) {
            trends.push('Moderate recent development activity');
        } else {
            trends.push('Limited recent development activity');
        }
        
        // Issue trend
        const recentIssues = analysis.issues.slice(0, 20);
        const issuesWithComments = recentIssues.filter(issue => issue.comments > 0).length;
        if (issuesWithComments >= 10) {
            trends.push('High community engagement in issues');
        } else if (issuesWithComments >= 5) {
            trends.push('Moderate community engagement');
        } else {
            trends.push('Limited community engagement');
        }
        
        return trends;
    }

    async generateCompetitorAnalysis(analysis) {
        const competitors = [];
        
        if (analysis.language) {
            try {
                const searchResponse = await fetch(`${this.githubApiBase}/search/repositories?q=language:${analysis.language}&sort=stars&order=desc&per_page=10`);
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    const topRepos = searchData.items;
                    
                    // Find position
                    const position = topRepos.findIndex(repo => repo.full_name === analysis.full_name);
                    if (position !== -1) {
                        competitors.push(`Ranked #${position + 1} among top ${analysis.language} repositories`);
                    } else {
                        competitors.push(`Not in top 10 ${analysis.language} repositories`);
                    }
                    
                    // Compare with top repo
                    if (topRepos.length > 0) {
                        const topRepo = topRepos[0];
                        const starRatio = analysis.stars / topRepo.stargazers_count;
                        const forkRatio = analysis.forks / topRepo.forks_count;
                        
                        if (starRatio > 0.5) {
                            competitors.push(`Competitive with top ${analysis.language} repository (${(starRatio * 100).toFixed(1)}% of stars)`);
                        } else {
                            competitors.push(`Significantly behind top ${analysis.language} repository (${(starRatio * 100).toFixed(1)}% of stars)`);
                        }
                    }
                }
            } catch (error) {
                console.log('Competitor analysis failed:', error);
            }
        }
        
        return competitors;
    }

    generateRiskAssessment(analysis) {
        const risks = [];
        
        // Single maintainer risk
        if (analysis.contributors.length <= 1) {
            risks.push({
                level: 'High',
                risk: 'Single Maintainer',
                description: 'Project depends heavily on one person',
                mitigation: 'Encourage community contributions'
            });
        }
        
        // Inactivity risk
        const daysSinceUpdate = Math.floor((Date.now() - new Date(analysis.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate > 180) {
            risks.push({
                level: 'High',
                risk: 'Inactivity',
                description: 'No updates in over 6 months',
                mitigation: 'Establish maintenance schedule'
            });
        } else if (daysSinceUpdate > 90) {
            risks.push({
                level: 'Medium',
                risk: 'Limited Activity',
                description: 'Infrequent updates',
                mitigation: 'Increase development activity'
            });
        }
        
        // Issue accumulation risk
        if (analysis.open_issues > 100) {
            risks.push({
                level: 'Medium',
                risk: 'Issue Backlog',
                description: 'High number of open issues',
                mitigation: 'Review and prioritize issues'
            });
        }
        
        // Documentation risk
        if (analysis.contribution_score < 0.4) {
            risks.push({
                level: 'Medium',
                risk: 'Poor Documentation',
                description: 'Limited contribution guidelines',
                mitigation: 'Improve documentation'
            });
        }
        
        return risks;
    }

    generateGrowthOpportunities(analysis) {
        const opportunities = [];
        
        // Community growth
        if (analysis.stars < 100) {
            opportunities.push({
                category: 'Community',
                opportunity: 'Increase Visibility',
                potential: 'High',
                action: 'Improve README and marketing'
            });
        }
        
        // Contributor growth
        if (analysis.contributors.length < 5) {
            opportunities.push({
                category: 'Contributors',
                opportunity: 'Expand Team',
                potential: 'Medium',
                action: 'Create good first issues'
            });
        }
        
        // Documentation growth
        if (analysis.contribution_score < 0.6) {
            opportunities.push({
                category: 'Documentation',
                opportunity: 'Improve Guides',
                potential: 'High',
                action: 'Add comprehensive documentation'
            });
        }
        
        // Release growth
        if (analysis.releases.length < 3) {
            opportunities.push({
                category: 'Releases',
                opportunity: 'Regular Releases',
                potential: 'Medium',
                action: 'Establish release schedule'
            });
        }
        
        return opportunities;
    }

    displayResults(analysis) {
        const resultsSection = document.getElementById('results');
        resultsSection.style.display = 'block';
        resultsSection.innerHTML = this.generateResultsHTML(analysis);
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Initialize charts
        this.initializeCharts(analysis);
    }

    generateResultsHTML(analysis) {
        const scoreClass = analysis.overall_score >= 80 ? 'excellent' : 
                          analysis.overall_score >= 60 ? 'good' : 
                          analysis.overall_score >= 40 ? 'fair' : 'poor';

        const scoreLabel = analysis.overall_score >= 80 ? 'Excellent' : 
                          analysis.overall_score >= 60 ? 'Good' : 
                          analysis.overall_score >= 40 ? 'Fair' : 'Needs Improvement';

        return `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fab fa-github fa-2x me-3 text-muted"></i>
                        <div>
                            <h1 class="h2 mb-1">${analysis.full_name}</h1>
                            ${analysis.description ? `<p class="text-muted mb-0">${analysis.description}</p>` : ''}
                        </div>
                    </div>
                    <div class="d-flex flex-wrap gap-3">
                        <a href="${analysis.github_url}" target="_blank" class="btn btn-outline-primary">
                            <i class="fab fa-github me-2"></i>View on GitHub
                        </a>
                        <button onclick="analyzer.analyzeRepository()" class="btn btn-outline-secondary">
                            <i class="fas fa-plus me-2"></i>Analyze Another
                        </button>
                    </div>
                </div>
            </div>

            <div class="row mb-5">
                <div class="col-12">
                    <div class="analysis-card">
                        <div class="analysis-header">
                            <h3 class="mb-0">
                                <i class="fas fa-chart-pie me-2"></i>Analysis Results
                            </h3>
                        </div>
                        <div class="analysis-body">
                            <div class="row align-items-center">
                                <div class="col-lg-4 text-center mb-4">
                                    <div class="score-circle score-${scoreClass}">${analysis.overall_score}</div>
                                    <h4 class="text-${scoreClass === 'excellent' ? 'success' : scoreClass === 'good' ? 'primary' : scoreClass === 'fair' ? 'warning' : 'danger'} mt-3">${scoreLabel}</h4>
                                    <p class="text-muted">Overall Score</p>
                                </div>
                                <div class="col-lg-8">
                                    <div class="row g-3">
                                        <div class="col-md-4 text-center">
                                            <div class="metric-card">
                                                <div class="metric-icon metric-stars">
                                                    <i class="fas fa-star"></i>
                                                </div>
                                                <h4 class="fw-bold text-warning mb-1">${analysis.popularity_score}</h4>
                                                <p class="text-muted mb-0 small">Popularity</p>
                                            </div>
                                        </div>
                                        <div class="col-md-4 text-center">
                                            <div class="metric-card">
                                                <div class="metric-icon metric-forks">
                                                    <i class="fas fa-chart-line"></i>
                                                </div>
                                                <h4 class="fw-bold text-info mb-1">${analysis.activity_score}</h4>
                                                <p class="text-muted mb-0 small">Activity</p>
                                            </div>
                                        </div>
                                        <div class="col-md-4 text-center">
                                            <div class="metric-card">
                                                <div class="metric-icon metric-watchers">
                                                    <i class="fas fa-users"></i>
                                                </div>
                                                <h4 class="fw-bold text-success mb-1">${analysis.contribution_score}</h4>
                                                <p class="text-muted mb-0 small">Contributions</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-5">
                <div class="col-12">
                    <div class="analysis-card">
                        <div class="analysis-header">
                            <h3 class="mb-0">
                                <i class="fas fa-chart-bar me-2"></i>Repository Metrics
                            </h3>
                        </div>
                        <div class="analysis-body">
                            <div class="row g-4">
                                <div class="col-lg-3 col-md-6">
                                    <div class="metric-card text-center">
                                        <div class="metric-icon metric-stars">
                                            <i class="fas fa-star"></i>
                                        </div>
                                        <h3 class="fw-bold text-warning mb-1">${analysis.stars.toLocaleString()}</h3>
                                        <p class="text-muted mb-0">Stars</p>
                                    </div>
                                </div>
                                <div class="col-lg-3 col-md-6">
                                    <div class="metric-card text-center">
                                        <div class="metric-icon metric-forks">
                                            <i class="fas fa-code-branch"></i>
                                        </div>
                                        <h3 class="fw-bold text-info mb-1">${analysis.forks.toLocaleString()}</h3>
                                        <p class="text-muted mb-0">Forks</p>
                                    </div>
                                </div>
                                <div class="col-lg-3 col-md-6">
                                    <div class="metric-card text-center">
                                        <div class="metric-icon metric-watchers">
                                            <i class="fas fa-eye"></i>
                                        </div>
                                        <h3 class="fw-bold text-primary mb-1">${analysis.watchers.toLocaleString()}</h3>
                                        <p class="text-muted mb-0">Watchers</p>
                                    </div>
                                </div>
                                <div class="col-lg-3 col-md-6">
                                    <div class="metric-card text-center">
                                        <div class="metric-icon metric-issues">
                                            <i class="fas fa-exclamation-circle"></i>
                                        </div>
                                        <h3 class="fw-bold text-danger mb-1">${analysis.open_issues.toLocaleString()}</h3>
                                        <p class="text-muted mb-0">Open Issues</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-lg-4 mb-4">
                    <div class="analysis-card h-100">
                        <div class="analysis-header" style="background: linear-gradient(135deg, #ffc107, #ffb300);">
                            <h4 class="mb-0">
                                <i class="fas fa-star me-2"></i>Popularity Analysis
                            </h4>
                        </div>
                        <div class="analysis-body">
                            <div class="text-center mb-3">
                                <h3 class="fw-bold text-warning">${analysis.popularity_score}</h3>
                                <p class="text-muted">Popularity Score</p>
                            </div>
                            <p class="card-text">${analysis.popularity_prediction}</p>
                            <div class="mt-3">
                                <canvas id="popularityChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 mb-4">
                    <div class="analysis-card h-100">
                        <div class="analysis-header" style="background: linear-gradient(135deg, #17a2b8, #138496);">
                            <h4 class="mb-0">
                                <i class="fas fa-chart-line me-2"></i>Maintainer Activity
                            </h4>
                        </div>
                        <div class="analysis-body">
                            <div class="text-center mb-3">
                                <h3 class="fw-bold text-info">${analysis.activity_score}</h3>
                                <p class="text-muted">Activity Score</p>
                            </div>
                            <p class="card-text">${analysis.activity_analysis}</p>
                            <div class="mt-3">
                                <canvas id="activityChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 mb-4">
                    <div class="analysis-card h-100">
                        <div class="analysis-header" style="background: linear-gradient(135deg, #28a745, #20c997);">
                            <h4 class="mb-0">
                                <i class="fas fa-users me-2"></i>Contribution Guide
                            </h4>
                        </div>
                        <div class="analysis-body">
                            <div class="text-center mb-3">
                                <h3 class="fw-bold text-success">${analysis.contribution_score}</h3>
                                <p class="text-muted">Guide Score</p>
                            </div>
                            <p class="card-text">${analysis.contribution_analysis}</p>
                            <div class="mt-3">
                                <canvas id="contributionChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NEW: Unique Analysis Features -->
            <div class="row mb-5">
                <div class="col-12">
                    <div class="analysis-card">
                        <div class="analysis-header" style="background: linear-gradient(135deg, #6f42c1, #5a32a3);">
                            <h3 class="mb-0">
                                <i class="fas fa-brain me-2"></i>AI-Powered Insights
                            </h3>
                        </div>
                        <div class="analysis-body">
                            <div class="row g-4">
                                ${analysis.ai_insights.map(insight => `
                                    <div class="col-md-6 mb-3">
                                        <div class="insight-card insight-${insight.type}">
                                            <div class="insight-header">
                                                <h6 class="mb-1">${insight.title}</h6>
                                                <span class="badge bg-${insight.type === 'success' ? 'success' : 'warning'}">${insight.impact} Impact</span>
                                            </div>
                                            <p class="text-muted small mb-0">${insight.message}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-5">
                <div class="col-lg-6 mb-4">
                    <div class="analysis-card h-100">
                        <div class="analysis-header" style="background: linear-gradient(135deg, #e83e8c, #d63384);">
                            <h4 class="mb-0">
                                <i class="fas fa-heartbeat me-2"></i>Repository Health
                            </h4>
                        </div>
                        <div class="analysis-body">
                            <div class="text-center mb-3">
                                <h3 class="fw-bold text-danger">${analysis.health_score}</h3>
                                <p class="text-muted">Health Score</p>
                            </div>
                            <div class="health-factors">
                                ${analysis.health_analysis.map(factor => `
                                    <div class="health-factor">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        ${factor}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6 mb-4">
                    <div class="analysis-card h-100">
                        <div class="analysis-header" style="background: linear-gradient(135deg, #fd7e14, #e55a00);">
                            <h4 class="mb-0">
                                <i class="fas fa-tree me-2"></i>Project Maturity
                            </h4>
                        </div>
                        <div class="analysis-body">
                            <div class="text-center mb-3">
                                <h3 class="fw-bold text-warning">${analysis.maturity_score}</h3>
                                <p class="text-muted">Maturity Score</p>
                            </div>
                            <div class="maturity-info">
                                <h6 class="text-primary">${analysis.maturity_assessment.level}</h6>
                                <p class="text-muted small">${analysis.maturity_assessment.description}</p>
                                <p class="text-muted small">Age: ${analysis.maturity_assessment.ageInYears} years (${analysis.maturity_assessment.ageInDays} days)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-5">
                <div class="col-lg-6 mb-4">
                    <div class="analysis-card h-100">
                        <div class="analysis-header" style="background: linear-gradient(135deg, #20c997, #17a2b8);">
                            <h4 class="mb-0">
                                <i class="fas fa-chart-area me-2"></i>Trend Analysis
                            </h4>
                        </div>
                        <div class="analysis-body">
                            <div class="text-center mb-3">
                                <h3 class="fw-bold text-info">${analysis.trend_score}</h3>
                                <p class="text-muted">Trend Score</p>
                            </div>
                            <div class="trend-list">
                                ${analysis.trend_analysis.map(trend => `
                                    <div class="trend-item">
                                        <i class="fas fa-arrow-up text-success me-2"></i>
                                        ${trend}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6 mb-4">
                    <div class="analysis-card h-100">
                        <div class="analysis-header" style="background: linear-gradient(135deg, #6c757d, #495057);">
                            <h4 class="mb-0">
                                <i class="fas fa-trophy me-2"></i>Competitor Analysis
                            </h4>
                        </div>
                        <div class="analysis-body">
                            <div class="text-center mb-3">
                                <h3 class="fw-bold text-secondary">${analysis.competitor_score}</h3>
                                <p class="text-muted">Competitor Score</p>
                            </div>
                            <div class="competitor-list">
                                ${analysis.competitor_analysis.map(competitor => `
                                    <div class="competitor-item">
                                        <i class="fas fa-medal text-warning me-2"></i>
                                        ${competitor}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-5">
                <div class="col-lg-6 mb-4">
                    <div class="analysis-card h-100">
                        <div class="analysis-header" style="background: linear-gradient(135deg, #dc3545, #c82333);">
                            <h4 class="mb-0">
                                <i class="fas fa-exclamation-triangle me-2"></i>Risk Assessment
                            </h4>
                        </div>
                        <div class="analysis-body">
                            <div class="risk-list">
                                ${analysis.risk_assessment.map(risk => `
                                    <div class="risk-item risk-${risk.level.toLowerCase()}">
                                        <div class="risk-header">
                                            <h6 class="mb-1">${risk.risk}</h6>
                                            <span class="badge bg-${risk.level === 'High' ? 'danger' : 'warning'}">${risk.level}</span>
                                        </div>
                                        <p class="text-muted small mb-1">${risk.description}</p>
                                        <p class="text-success small mb-0"><strong>Mitigation:</strong> ${risk.mitigation}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6 mb-4">
                    <div class="analysis-card h-100">
                        <div class="analysis-header" style="background: linear-gradient(135deg, #28a745, #20c997);">
                            <h4 class="mb-0">
                                <i class="fas fa-seedling me-2"></i>Growth Opportunities
                            </h4>
                        </div>
                        <div class="analysis-body">
                            <div class="opportunity-list">
                                ${analysis.growth_opportunities.map(opportunity => `
                                    <div class="opportunity-item">
                                        <div class="opportunity-header">
                                            <h6 class="mb-1">${opportunity.opportunity}</h6>
                                            <span class="badge bg-success">${opportunity.potential} Potential</span>
                                        </div>
                                        <p class="text-muted small mb-1">Category: ${opportunity.category}</p>
                                        <p class="text-primary small mb-0"><strong>Action:</strong> ${opportunity.action}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-5">
                <div class="col-12">
                    <div class="analysis-card">
                        <div class="analysis-header">
                            <h3 class="mb-0">
                                <i class="fas fa-lightbulb me-2"></i>Recommendations
                            </h3>
                        </div>
                        <div class="analysis-body">
                            <div class="row">
                                ${analysis.recommendations.map(rec => `
                                    <div class="col-12 mb-3">
                                        <div class="recommendation-card">
                                            <div class="d-flex align-items-start">
                                                <div class="priority-badge priority-${rec.priority.toLowerCase()} me-3">
                                                    ${rec.priority}
                                                </div>
                                                <div class="flex-grow-1">
                                                    <h5 class="mb-2">${rec.title}</h5>
                                                    <p class="text-muted mb-2">${rec.description}</p>
                                                    <div class="actions-list">
                                                        ${rec.actions.map(action => `
                                                            <div class="action-item">
                                                                <i class="fas fa-check-circle text-success me-2"></i>
                                                                ${action}
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${(() => {
                const suggestions = this.generateImprovementSuggestions(analysis);
                return `
                    <div class="row mb-5">
                        <div class="col-12">
                            <div class="analysis-card">
                                <div class="analysis-header" style="background: linear-gradient(135deg, #6f42c1, #5a32a3);">
                                    <h3 class="mb-0">
                                        <i class="fas fa-rocket me-2"></i>Improvement Roadmap
                                    </h3>
                                </div>
                                <div class="analysis-body">
                                    <div class="row">
                                        ${suggestions.immediate.length > 0 ? `
                                            <div class="col-lg-6 mb-4">
                                                <div class="improvement-section">
                                                    <h5 class="text-success mb-3">
                                                        <i class="fas fa-bolt me-2"></i>Immediate Actions (Today)
                                                    </h5>
                                                    ${suggestions.immediate.map(suggestion => `
                                                        <div class="improvement-card mb-3">
                                            <div class="improvement-header">
                                                <h6 class="mb-1">${suggestion.title}</h6>
                                                <div class="improvement-meta">
                                                    <span class="badge bg-success me-2">${suggestion.effort}</span>
                                                    <span class="badge bg-primary">${suggestion.impact} Impact</span>
                                                </div>
                                            </div>
                                            <p class="text-muted small mb-2">${suggestion.description}</p>
                                            <div class="steps-list">
                                                ${suggestion.steps.map((step, index) => `
                                                    <div class="step-item">
                                                        <span class="step-number">${index + 1}</span>
                                                        <span class="step-text">${step}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        ` : ''}
                                        
                                        ${suggestions.shortTerm.length > 0 ? `
                                            <div class="col-lg-6 mb-4">
                                                <div class="improvement-section">
                                                    <h5 class="text-warning mb-3">
                                                        <i class="fas fa-calendar-week me-2"></i>Short-term Goals (1-2 weeks)
                                                    </h5>
                                                    ${suggestions.shortTerm.map(suggestion => `
                                                        <div class="improvement-card mb-3">
                                            <div class="improvement-header">
                                                <h6 class="mb-1">${suggestion.title}</h6>
                                                <div class="improvement-meta">
                                                    <span class="badge bg-warning me-2">${suggestion.effort}</span>
                                                    <span class="badge bg-primary">${suggestion.impact} Impact</span>
                                                </div>
                                            </div>
                                            <p class="text-muted small mb-2">${suggestion.description}</p>
                                            <div class="steps-list">
                                                ${suggestion.steps.map((step, index) => `
                                                    <div class="step-item">
                                                        <span class="step-number">${index + 1}</span>
                                                        <span class="step-text">${step}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        ` : ''}
                                        
                                        ${suggestions.technical.length > 0 ? `
                                            <div class="col-lg-6 mb-4">
                                                <div class="improvement-section">
                                                    <h5 class="text-info mb-3">
                                                        <i class="fas fa-cogs me-2"></i>Technical Improvements
                                                    </h5>
                                                    ${suggestions.technical.map(suggestion => `
                                                        <div class="improvement-card mb-3">
                                            <div class="improvement-header">
                                                <h6 class="mb-1">${suggestion.title}</h6>
                                                <div class="improvement-meta">
                                                    <span class="badge bg-info me-2">${suggestion.effort}</span>
                                                    <span class="badge bg-primary">${suggestion.impact} Impact</span>
                                                </div>
                                            </div>
                                            <p class="text-muted small mb-2">${suggestion.description}</p>
                                            <div class="steps-list">
                                                ${suggestion.steps.map((step, index) => `
                                                    <div class="step-item">
                                                        <span class="step-number">${index + 1}</span>
                                                        <span class="step-text">${step}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        ` : ''}
                                        
                                        ${suggestions.community.length > 0 ? `
                                            <div class="col-lg-6 mb-4">
                                                <div class="improvement-section">
                                                    <h5 class="text-purple mb-3">
                                                        <i class="fas fa-users me-2"></i>Community Building
                                                    </h5>
                                                    ${suggestions.community.map(suggestion => `
                                                        <div class="improvement-card mb-3">
                                            <div class="improvement-header">
                                                <h6 class="mb-1">${suggestion.title}</h6>
                                                <div class="improvement-meta">
                                                    <span class="badge bg-purple me-2">${suggestion.effort}</span>
                                                    <span class="badge bg-primary">${suggestion.impact} Impact</span>
                                                </div>
                                            </div>
                                            <p class="text-muted small mb-2">${suggestion.description}</p>
                                            <div class="steps-list">
                                                ${suggestion.steps.map((step, index) => `
                                                    <div class="step-item">
                                                        <span class="step-number">${index + 1}</span>
                                                        <span class="step-text">${step}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            })()}

            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="fas fa-info-circle me-2"></i>Repository Information
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-6">
                                    <p class="mb-1"><strong>Language:</strong></p>
                                    <p class="mb-1"><strong>Created:</strong></p>
                                    <p class="mb-1"><strong>Last Updated:</strong></p>
                                    <p class="mb-1"><strong>Open PRs:</strong></p>
                                    <p class="mb-1"><strong>Contributors:</strong></p>
                                </div>
                                <div class="col-6">
                                    <p class="mb-1">${analysis.language || 'Unknown'}</p>
                                    <p class="mb-1">${new Date(analysis.created_at).toLocaleDateString()}</p>
                                    <p class="mb-1">${new Date(analysis.updated_at).toLocaleDateString()}</p>
                                    <p class="mb-1">${analysis.pulls.length}</p>
                                    <p class="mb-1">${analysis.contributors.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="fas fa-share-alt me-2"></i>Share Analysis
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <a href="https://twitter.com/intent/tweet?text=Check out this GitHub repository analysis: ${analysis.full_name}&url=${encodeURIComponent(window.location.href)}" 
                                   target="_blank" class="btn btn-outline-primary">
                                    <i class="fab fa-twitter me-2"></i>Share on Twitter
                                </a>
                                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}" 
                                   target="_blank" class="btn btn-outline-primary">
                                    <i class="fab fa-linkedin me-2"></i>Share on LinkedIn
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initializeCharts(analysis) {
        // Popularity Chart
        const popularityCtx = document.getElementById('popularityChart').getContext('2d');
        new Chart(popularityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Popularity Score', 'Remaining'],
                datasets: [{
                    data: [analysis.popularity_score, 100 - analysis.popularity_score],
                    backgroundColor: ['#ffc107', '#e9ecef'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Activity Chart
        const activityCtx = document.getElementById('activityChart').getContext('2d');
        new Chart(activityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Activity Score', 'Remaining'],
                datasets: [{
                    data: [analysis.activity_score, 100 - analysis.activity_score],
                    backgroundColor: ['#17a2b8', '#e9ecef'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Contribution Chart
        const contributionCtx = document.getElementById('contributionChart').getContext('2d');
        new Chart(contributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Guide Score', 'Remaining'],
                datasets: [{
                    data: [analysis.contribution_score, 100 - analysis.contribution_score],
                    backgroundColor: ['#28a745', '#e9ecef'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    showLoading(show) {
        const loading = document.querySelector('.loading');
        if (show) {
            loading.classList.add('show');
        } else {
            loading.classList.remove('show');
        }
    }

    showError(message) {
        const resultsSection = document.getElementById('results');
        resultsSection.style.display = 'block';
        
        let errorContent = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
        
        // Add retry button for rate limit errors
        if (message.includes('rate limit')) {
            errorContent += `
                <div class="text-center mt-3">
                    <button onclick="analyzer.retryAnalysis()" class="btn btn-outline-primary">
                        <i class="fas fa-redo me-2"></i>Retry Analysis
                    </button>
                    <p class="text-muted mt-2">
                        <small>
                            <i class="fas fa-info-circle me-1"></i>
                            GitHub allows 60 API calls per hour for unauthenticated users.
                            <br>Consider using a GitHub token for higher limits.
                        </small>
                    </p>
                </div>
            `;
        }
        
        resultsSection.innerHTML = errorContent;
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    retryAnalysis() {
        // Clear previous results and retry
        document.getElementById('results').style.display = 'none';
        this.analyzeRepository();
    }
}

// Documentation System
const documentationSystem = {
    docs: {
        userGuide: {
            title: "RepoPulse User Guide",
            content: `# 📖 RepoPulse User Guide

A comprehensive guide to using RepoPulse effectively.

## 🎯 Quick Start Guide

### Step 1: Access RepoPulse
1. Open index.html in your web browser
2. You'll see the main dashboard with analysis options

### Step 2: Analyze Your First Repository
1. Enter a GitHub repository URL in the input field
   - Example: https://github.com/django/django
   - Example: https://github.com/facebook/react
2. Click the "Analyze Repository" button
3. Wait for the analysis to complete (usually 10-30 seconds)

### Step 3: Review Results
- **Health Score**: Overall repository health (0-100)
- **Key Metrics**: Stars, forks, issues, pull requests
- **AI Insights**: Personalized recommendations
- **Charts**: Visual representation of data

## 🔍 Understanding Results

### Health Score Ranges
- **90-100**: 🟢 Excellent - Well-maintained, active project
- **80-89**: 🟡 Good - Solid foundation with room for improvement
- **70-79**: 🟠 Fair - Basic requirements met, needs attention
- **60-69**: 🔴 Poor - Significant issues need addressing
- **0-59**: ⚫ Critical - Major problems require immediate action

### Key Metrics Explained
- **Stars**: User interest and popularity
- **Forks**: Community engagement and potential contributions
- **Recent Commits**: Development activity level
- **Issues & PRs**: Community engagement and responsiveness
- **Documentation**: README quality and completeness

## 🔄 Repository Comparison

### How to Compare Repositories
1. Navigate to the "Compare" section
2. Enter up to 3 repository URLs
3. Select comparison type (Side-by-side, Quick Overview, Trend Analysis)
4. Click "Compare Repositories"
5. Review the comparison results

## 📥 Downloading Reports

### Available Formats
- **PDF Report**: Comprehensive analysis with charts
- **JSON Data**: Raw analysis data for integration
- **CSV Export**: Tabular data for spreadsheet analysis
- **Markdown Summary**: Formatted summary for documentation

### How to Download
1. After analysis, click the "Download Report" button
2. Select your preferred format
3. Choose report sections to include
4. Click "Generate Report"
5. Save the file to your device

## 🛠️ Troubleshooting

### Common Issues
- **Rate Limit Exceeded**: Wait for reset (usually 1 hour) or use authenticated requests
- **Repository Not Found**: Verify URL format and repository accessibility
- **Slow Loading**: Check internet connection and try smaller repositories first

## 📱 Mobile Usage
- Works on all screen sizes with responsive design
- Optimized for touch interaction
- Consider using WiFi for better performance

For detailed API documentation and advanced features, see the complete documentation.`
        },
        apiReference: {
            title: "RepoPulse API Reference",
            content: `# 🔌 RepoPulse API Reference

Complete API documentation for RepoPulse's internal APIs and GitHub integration.

## 🔗 GitHub API Integration

RepoPulse uses GitHub's REST API v3 for data retrieval.

### Base URL
https://api.github.com

### Rate Limits
- **Unauthenticated**: 60 requests per hour
- **Authenticated**: 5,000 requests per hour
- **Enterprise**: 15,000 requests per hour

### Core Endpoints

#### Repository Information
GET /repos/{owner}/{repo}

#### Repository Commits
GET /repos/{owner}/{repo}/commits?per_page=100

#### Repository Issues
GET /repos/{owner}/{repo}/issues?state=all&per_page=100

#### Repository Pull Requests
GET /repos/{owner}/{repo}/pulls?state=all&per_page=100

#### Repository Contents
GET /repos/{owner}/{repo}/contents/{path}

## 🔧 Internal APIs

### Analysis Engine
- analyzeRepository(repoUrl): Analyzes a GitHub repository
- compareRepositories(repoUrls, comparisonType): Compares multiple repositories
- calculateHealthScore(repoData): Calculates health score (0-100)
- generateInsights(repoData, healthScore): Generates AI-powered recommendations

### Report Generation
- generateReport(analysisResult, format, options): Creates downloadable reports
- Available formats: PDF, JSON, CSV, Markdown

## 📊 Data Structures

### AnalysisResult
Contains complete repository analysis including:
- Repository metadata
- Health score and breakdown
- Metrics and insights
- Recommendations and charts

### RepositoryData
GitHub repository information including:
- Basic repository details
- Activity metrics
- Community information
- Configuration settings

## ⚠️ Error Handling

### Error Types
- RateLimitError: GitHub API rate limit exceeded
- RepositoryNotFoundError: Repository not found or inaccessible
- NetworkError: Network connection failed
- ValidationError: Invalid input data

### Error Handling Examples
\`\`\`javascript
try {
  const result = await analyzeRepository(repoUrl);
} catch (error) {
  if (error.type === 'RATE_LIMIT_EXCEEDED') {
    console.log('Rate limit exceeded. Wait for reset.');
  }
}
\`\`\`

## 📝 Examples

### Basic Analysis
\`\`\`javascript
const result = await analyzeRepository('https://github.com/django/django');
console.log(result.healthScore); // 94
\`\`\`

### Repository Comparison
\`\`\`javascript
const comparison = await compareRepositories([
  'https://github.com/django/django',
  'https://github.com/pallets/flask'
], 'side-by-side');
\`\`\`

### Report Generation
\`\`\`javascript
const report = await generateReport(result, 'pdf', {
  includeCharts: true,
  includeRecommendations: true
});
\`\`\`

For complete examples and detailed documentation, see the full API reference.`
        },
        troubleshooting: {
            title: "RepoPulse Troubleshooting Guide",
            content: `# 🛠️ RepoPulse Troubleshooting Guide

Comprehensive troubleshooting guide for common RepoPulse issues.

## 🚨 Common Issues

### Rate Limit Exceeded

**Problem**: "GitHub API rate limit exceeded" error

**Symptoms**:
- Analysis fails with rate limit error
- Cannot analyze multiple repositories
- Error message shows remaining requests: 0

**Solutions**:
1. **Wait for Reset**: Rate limits reset every hour
2. **Use Authenticated Requests**: Create GitHub token for higher limits
3. **Reduce Frequency**: Don't analyze too many repositories quickly
4. **Check Current Limits**: Monitor remaining API calls

**Prevention**:
- Use authenticated requests when possible
- Space out analysis requests
- Monitor rate limit usage

### Repository Not Found

**Problem**: "Repository not found" error

**Symptoms**:
- 404 error when analyzing repository
- Cannot access repository data
- Error message indicates repository doesn't exist

**Solutions**:
1. **Verify URL Format**: Ensure correct GitHub URL format
2. **Check Repository Exists**: Confirm repository is accessible
3. **Check Permissions**: Ensure repository is public
4. **Try Different URL**: Use alternative URL formats

**URL Format Examples**:
- https://github.com/owner/repo
- https://github.com/owner/repo/
- owner/repo (without https://github.com/)

### Network Connectivity Issues

**Problem**: Network errors during analysis

**Symptoms**:
- Analysis times out
- Connection failed errors
- Incomplete data retrieval

**Solutions**:
1. **Check Internet Connection**: Ensure stable connection
2. **Try Again**: Network issues are often temporary
3. **Use Different Network**: Switch to different WiFi/mobile
4. **Clear Browser Cache**: Remove cached data

**Prevention**:
- Use stable internet connection
- Avoid analyzing during network congestion
- Consider using wired connection for large repositories

### Slow Analysis Performance

**Problem**: Analysis takes too long

**Symptoms**:
- Analysis runs for several minutes
- Browser becomes unresponsive
- Progress bar moves slowly

**Solutions**:
1. **Check Repository Size**: Large repositories take longer
2. **Close Other Tabs**: Free up browser resources
3. **Use Quick Analysis**: Select quick overview option
4. **Try Smaller Repos**: Start with smaller repositories

**Performance Tips**:
- Close unnecessary browser tabs
- Use modern browser (Chrome, Firefox, Safari, Edge)
- Ensure sufficient RAM available
- Use SSD storage if possible

### Browser Compatibility Issues

**Problem**: Features not working in certain browsers

**Symptoms**:
- Charts don't display
- Download buttons don't work
- Analysis fails silently

**Solutions**:
1. **Update Browser**: Use latest browser version
2. **Enable JavaScript**: Ensure JavaScript is enabled
3. **Try Different Browser**: Switch to Chrome, Firefox, or Safari
4. **Check Extensions**: Disable browser extensions temporarily

**Supported Browsers**:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Report Download Issues

**Problem**: Cannot download reports

**Symptoms**:
- Download button doesn't work
- Files are corrupted
- Wrong file format

**Solutions**:
1. **Check Browser Settings**: Ensure downloads are allowed
2. **Try Different Format**: Use JSON or CSV instead of PDF
3. **Check Storage**: Ensure sufficient disk space
4. **Try Different Browser**: Switch to different browser

**Download Formats**:
- **PDF**: Best for presentations and documentation
- **JSON**: Best for data integration and APIs
- **CSV**: Best for spreadsheet analysis
- **Markdown**: Best for documentation and README files

## 🔧 Advanced Troubleshooting

### Debug Mode

Enable debug mode to get detailed error information:

\`\`\`javascript
// Enable debug logging
localStorage.setItem('repopulse_debug', 'true');
\`\`\`

### API Rate Limit Monitoring

Check current rate limit status:

\`\`\`javascript
// Check rate limits
const checkRateLimit = async () => {
  try {
    const response = await fetch('https://api.github.com/rate_limit');
    const data = await response.json();
    console.log('Rate limit info:', data.resources.core);
  } catch (error) {
    console.error('Failed to check rate limit:', error);
  }
};
\`\`\`

### Network Diagnostics

Test network connectivity to GitHub API:

\`\`\`javascript
// Test API connectivity
const testConnectivity = async () => {
  try {
    const start = Date.now();
    const response = await fetch('https://api.github.com');
    const end = Date.now();
    console.log('API response time:', end - start, 'ms');
    console.log('API status:', response.status);
  } catch (error) {
    console.error('API connectivity test failed:', error);
  }
};
\`\`\`

## 📞 Getting Help

### Self-Help Resources
1. **Check This Guide**: Review relevant troubleshooting section
2. **Try Different Approach**: Use alternative methods or formats
3. **Check Examples**: Review working examples in documentation

### When to Seek Help
- Issue persists after trying all solutions
- Error messages are unclear or confusing
- Feature doesn't work as documented
- Performance is consistently poor

### Providing Help Information
When reporting issues, include:
- Browser and version
- Operating system
- Error messages (if any)
- Steps to reproduce
- Expected vs actual behavior

## 🚀 Performance Optimization

### For Large Repositories
- Use quick analysis mode
- Focus on specific directories
- Analyze during off-peak hours
- Use authenticated requests

### For Multiple Repositories
- Space out analysis requests
- Use batch comparison features
- Monitor rate limit usage
- Consider using API tokens

### For Mobile Devices
- Use WiFi connection
- Close other applications
- Use mobile-optimized view
- Be patient with large repositories

## 🔒 Security Considerations

### API Tokens
- Store tokens securely
- Use minimal required permissions
- Rotate tokens regularly
- Don't share tokens publicly

### Data Privacy
- Analysis data is processed locally
- No data is stored on servers
- Clear browser data to remove cached information
- Use private browsing for sensitive repositories

---

**Still having issues?** Check the main documentation or contact support with detailed information about your problem.`
        }
    },

    downloadDocumentation: function(format = 'markdown') {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `repopulse-documentation-${timestamp}`;
        
        let content = '';
        let mimeType = '';
        let extension = '';

        switch (format) {
            case 'markdown':
                content = this.generateMarkdownDocumentation();
                mimeType = 'text/markdown';
                extension = 'md';
                break;
            case 'html':
                content = this.generateHTMLDocumentation();
                mimeType = 'text/html';
                extension = 'html';
                break;
            case 'txt':
                content = this.generateTextDocumentation();
                mimeType = 'text/plain';
                extension = 'txt';
                break;
            case 'json':
                content = JSON.stringify(this.docs, null, 2);
                mimeType = 'application/json';
                extension = 'json';
                break;
            default:
                throw new Error('Unsupported format');
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        this.showNotification(`Documentation downloaded as ${filename}.${extension}`, 'success');
    },

    generateMarkdownDocumentation: function() {
        let content = `# 📚 RepoPulse Complete Documentation

Generated on: ${new Date().toLocaleDateString()}
Version: 1.0

---

## 📖 Table of Contents

1. [User Guide](#user-guide)
2. [API Reference](#api-reference)
3. [Troubleshooting Guide](#troubleshooting-guide)

---

## 📖 User Guide

${this.docs.userGuide.content}

---

## 🔌 API Reference

${this.docs.apiReference.content}

---

## 🛠️ Troubleshooting Guide

${this.docs.troubleshooting.content}

---

## 📞 Support

For additional help and support:
- Check the troubleshooting guide above
- Review the user guide for step-by-step instructions
- Consult the API reference for technical details
- Report issues with detailed information

---

**RepoPulse** - Making GitHub repository analysis simple, powerful, and accessible to everyone! 🚀

*Documentation generated by RepoPulse on ${new Date().toLocaleString()}*`;

        return content;
    },

    generateHTMLDocumentation: function() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RepoPulse Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1, h2, h3 { color: #24292e; }
        h1 { border-bottom: 2px solid #e1e4e8; padding-bottom: 10px; }
        h2 { border-bottom: 1px solid #e1e4e8; padding-bottom: 5px; margin-top: 30px; }
        code { background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: 'SFMono-Regular', Consolas, monospace; }
        pre { background: #f6f8fa; padding: 15px; border-radius: 6px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #e1e4e8; padding: 8px 12px; text-align: left; }
        th { background: #f6f8fa; font-weight: 600; }
        .toc { background: #f6f8fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .toc ul { margin: 0; padding-left: 20px; }
        .toc li { margin: 5px 0; }
        .alert { padding: 15px; border-radius: 6px; margin: 15px 0; }
        .alert-info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .alert-warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 RepoPulse Complete Documentation</h1>
        <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Version:</strong> 1.0</p>

        <div class="toc">
            <h2>📖 Table of Contents</h2>
            <ul>
                <li><a href="#user-guide">User Guide</a></li>
                <li><a href="#api-reference">API Reference</a></li>
                <li><a href="#troubleshooting">Troubleshooting Guide</a></li>
            </ul>
        </div>

        <div id="user-guide">
            <h2>📖 User Guide</h2>
            ${this.docs.userGuide.content.replace(/\n/g, '<br>').replace(/```/g, '<pre><code>').replace(/```/g, '</code></pre>')}
        </div>

        <div id="api-reference">
            <h2>🔌 API Reference</h2>
            ${this.docs.apiReference.content.replace(/\n/g, '<br>').replace(/```/g, '<pre><code>').replace(/```/g, '</code></pre>')}
        </div>

        <div id="troubleshooting">
            <h2>🛠️ Troubleshooting Guide</h2>
            ${this.docs.troubleshooting.content.replace(/\n/g, '<br>').replace(/```/g, '<pre><code>').replace(/```/g, '</code></pre>')}
        </div>

        <div class="alert alert-info">
            <h3>📞 Support</h3>
            <p>For additional help and support:</p>
            <ul>
                <li>Check the troubleshooting guide above</li>
                <li>Review the user guide for step-by-step instructions</li>
                <li>Consult the API reference for technical details</li>
                <li>Report issues with detailed information</li>
            </ul>
        </div>

        <hr>
        <p><em><strong>RepoPulse</strong> - Making GitHub repository analysis simple, powerful, and accessible to everyone! 🚀</em></p>
        <p><em>Documentation generated by RepoPulse on ${new Date().toLocaleString()}</em></p>
    </div>
</body>
</html>`;
    },

    generateTextDocumentation: function() {
        return `RepoPulse Complete Documentation
Generated on: ${new Date().toLocaleDateString()}
Version: 1.0

================================================================================

TABLE OF CONTENTS

1. User Guide
2. API Reference  
3. Troubleshooting Guide

================================================================================

USER GUIDE

${this.docs.userGuide.content}

================================================================================

API REFERENCE

${this.docs.apiReference.content}

================================================================================

TROUBLESHOOTING GUIDE

${this.docs.troubleshooting.content}

================================================================================

SUPPORT

For additional help and support:
- Check the troubleshooting guide above
- Review the user guide for step-by-step instructions
- Consult the API reference for technical details
- Report issues with detailed information

================================================================================

RepoPulse - Making GitHub repository analysis simple, powerful, and accessible to everyone!

Documentation generated by RepoPulse on ${new Date().toLocaleString()}`;
    },

    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
};

// Initialize the analyzer when the page loads
let analyzer;
document.addEventListener('DOMContentLoaded', () => {
    analyzer = new RepoPulse();
    window.documentationSystem = documentationSystem;
}); 