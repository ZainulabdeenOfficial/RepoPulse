# 🔌 RepoPulse API Reference

Complete API documentation for RepoPulse's internal APIs and GitHub integration.

## 📋 Table of Contents

1. [GitHub API Integration](#github-api-integration)
2. [Internal APIs](#internal-apis)
3. [Data Structures](#data-structures)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Examples](#examples)

## 🔗 GitHub API Integration

RepoPulse uses GitHub's REST API v3 for data retrieval. All requests are made to the public GitHub API endpoints.

### Base URL
```
https://api.github.com
```

### Authentication
- **Unauthenticated**: 60 requests per hour
- **Authenticated**: 5,000 requests per hour
- **Enterprise**: 15,000 requests per hour

### Headers
```javascript
{
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'RepoPulse/1.0'
}
```

### Core Endpoints

#### Repository Information
```javascript
GET /repos/{owner}/{repo}
```

**Response Structure:**
```json
{
  "id": 123456,
  "name": "repository-name",
  "full_name": "owner/repository-name",
  "description": "Repository description",
  "private": false,
  "fork": false,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-12-01T00:00:00Z",
  "pushed_at": "2023-12-01T00:00:00Z",
  "size": 1024,
  "stargazers_count": 1000,
  "watchers_count": 1000,
  "language": "JavaScript",
  "has_issues": true,
  "has_projects": true,
  "has_downloads": true,
  "has_wiki": true,
  "has_pages": false,
  "has_discussions": false,
  "forks_count": 100,
  "archived": false,
  "disabled": false,
  "license": {
    "key": "mit",
    "name": "MIT License",
    "url": "https://api.github.com/licenses/mit"
  },
  "allow_forking": true,
  "is_template": false,
  "web_commit_signoff_required": false,
  "topics": ["javascript", "web"],
  "visibility": "public",
  "default_branch": "main"
}
```

#### Repository Commits
```javascript
GET /repos/{owner}/{repo}/commits?per_page=100
```

**Response Structure:**
```json
[
  {
    "sha": "commit-hash",
    "node_id": "node-id",
    "commit": {
      "author": {
        "name": "Author Name",
        "email": "author@example.com",
        "date": "2023-12-01T00:00:00Z"
      },
      "committer": {
        "name": "Committer Name",
        "email": "committer@example.com",
        "date": "2023-12-01T00:00:00Z"
      },
      "message": "Commit message"
    },
    "url": "https://api.github.com/repos/owner/repo/commits/commit-hash",
    "html_url": "https://github.com/owner/repo/commit/commit-hash",
    "comments_url": "https://api.github.com/repos/owner/repo/commits/commit-hash/comments",
    "author": {
      "login": "author-username",
      "id": 123,
      "avatar_url": "https://avatars.githubusercontent.com/u/123?v=4"
    },
    "committer": {
      "login": "committer-username",
      "id": 456,
      "avatar_url": "https://avatars.githubusercontent.com/u/456?v=4"
    }
  }
]
```

#### Repository Issues
```javascript
GET /repos/{owner}/{repo}/issues?state=all&per_page=100
```

**Response Structure:**
```json
[
  {
    "id": 123456,
    "node_id": "issue-node-id",
    "number": 1,
    "title": "Issue title",
    "user": {
      "login": "username",
      "id": 123,
      "avatar_url": "https://avatars.githubusercontent.com/u/123?v=4"
    },
    "labels": [
      {
        "id": 123,
        "node_id": "label-node-id",
        "name": "bug",
        "color": "d73a4a"
      }
    ],
    "state": "open",
    "locked": false,
    "assignee": null,
    "assignees": [],
    "milestone": null,
    "comments": 0,
    "created_at": "2023-12-01T00:00:00Z",
    "updated_at": "2023-12-01T00:00:00Z",
    "closed_at": null,
    "author_association": "OWNER",
    "active_lock_reason": null,
    "body": "Issue description",
    "reactions": {
      "url": "https://api.github.com/repos/owner/repo/issues/1/reactions",
      "total_count": 0,
      "+1": 0,
      "-1": 0,
      "laugh": 0,
      "hooray": 0,
      "confused": 0,
      "heart": 0,
      "rocket": 0,
      "eyes": 0
    },
    "timeline_url": "https://api.github.com/repos/owner/repo/issues/1/timeline",
    "performed_via_github_app": null,
    "state_reason": null
  }
]
```

#### Repository Pull Requests
```javascript
GET /repos/{owner}/{repo}/pulls?state=all&per_page=100
```

**Response Structure:**
```json
[
  {
    "id": 123456,
    "node_id": "pr-node-id",
    "number": 1,
    "title": "Pull request title",
    "user": {
      "login": "username",
      "id": 123,
      "avatar_url": "https://avatars.githubusercontent.com/u/123?v=4"
    },
    "body": "Pull request description",
    "state": "open",
    "locked": false,
    "active_lock_reason": null,
    "created_at": "2023-12-01T00:00:00Z",
    "updated_at": "2023-12-01T00:00:00Z",
    "closed_at": null,
    "merged_at": null,
    "merge_commit_sha": null,
    "assignee": null,
    "assignees": [],
    "requested_reviewers": [],
    "requested_teams": [],
    "labels": [],
    "milestone": null,
    "draft": false,
    "commits_url": "https://api.github.com/repos/owner/repo/pulls/1/commits",
    "review_comments_url": "https://api.github.com/repos/owner/repo/pulls/1/comments",
    "review_comment_url": "https://api.github.com/repos/owner/repo/pulls/comments/{number}",
    "comments_url": "https://api.github.com/repos/owner/repo/issues/1/comments",
    "statuses_url": "https://api.github.com/repos/owner/repo/commits/{sha}/statuses",
    "head": {
      "label": "username:branch-name",
      "ref": "branch-name",
      "sha": "commit-sha",
      "user": {
        "login": "username",
        "id": 123,
        "avatar_url": "https://avatars.githubusercontent.com/u/123?v=4"
      },
      "repo": {
        "id": 123456,
        "node_id": "repo-node-id",
        "name": "repo-name",
        "full_name": "username/repo-name",
        "private": false
      }
    },
    "base": {
      "label": "owner:main",
      "ref": "main",
      "sha": "base-commit-sha",
      "user": {
        "login": "owner",
        "id": 456,
        "avatar_url": "https://avatars.githubusercontent.com/u/456?v=4"
      },
      "repo": {
        "id": 789012,
        "node_id": "base-repo-node-id",
        "name": "repo-name",
        "full_name": "owner/repo-name",
        "private": false
      }
    },
    "_links": {
      "self": {
        "href": "https://api.github.com/repos/owner/repo/pulls/1"
      },
      "html": {
        "href": "https://github.com/owner/repo/pull/1"
      },
      "issue": {
        "href": "https://api.github.com/repos/owner/repo/issues/1"
      },
      "comments": {
        "href": "https://api.github.com/repos/owner/repo/issues/1/comments"
      },
      "review_comments": {
        "href": "https://api.github.com/repos/owner/repo/pulls/1/comments"
      },
      "review_comment": {
        "href": "https://api.github.com/repos/owner/repo/pulls/comments/{number}"
      },
      "commits": {
        "href": "https://api.github.com/repos/owner/repo/pulls/1/commits"
      },
      "statuses": {
        "href": "https://api.github.com/repos/owner/repo/commits/{sha}/statuses"
      }
    },
    "author_association": "OWNER",
    "auto_merge": null,
    "draft": false,
    "merged": false,
    "mergeable": null,
    "mergeable_state": "unknown",
    "merged_by": null,
    "comments": 0,
    "review_comments": 0,
    "maintainer_can_modify": false,
    "commits": 1,
    "additions": 10,
    "deletions": 5,
    "changed_files": 2
  }
]
```

#### Repository Contents
```javascript
GET /repos/{owner}/{repo}/contents/{path}
```

**Response Structure:**
```json
[
  {
    "type": "file",
    "encoding": "base64",
    "size": 1234,
    "name": "filename.md",
    "path": "path/to/filename.md",
    "content": "base64-encoded-content",
    "sha": "file-sha",
    "url": "https://api.github.com/repos/owner/repo/contents/path/to/filename.md",
    "git_url": "https://api.github.com/repos/owner/repo/git/blobs/file-sha",
    "html_url": "https://github.com/owner/repo/blob/main/path/to/filename.md",
    "download_url": "https://raw.githubusercontent.com/owner/repo/main/path/to/filename.md",
    "_links": {
      "git": "https://api.github.com/repos/owner/repo/git/blobs/file-sha",
      "self": "https://api.github.com/repos/owner/repo/contents/path/to/filename.md",
      "html": "https://github.com/owner/repo/blob/main/path/to/filename.md"
    }
  }
]
```

#### Repository Contributors
```javascript
GET /repos/{owner}/{repo}/contributors
```

**Response Structure:**
```json
[
  {
    "login": "username",
    "id": 123,
    "node_id": "user-node-id",
    "avatar_url": "https://avatars.githubusercontent.com/u/123?v=4",
    "gravatar_id": "",
    "url": "https://api.github.com/users/username",
    "html_url": "https://github.com/username",
    "followers_url": "https://api.github.com/users/username/followers",
    "following_url": "https://api.github.com/users/username/following{/other_user}",
    "gists_url": "https://api.github.com/users/username/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/username/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/username/subscriptions",
    "organizations_url": "https://api.github.com/users/username/orgs",
    "repos_url": "https://api.github.com/users/username/repos",
    "events_url": "https://api.github.com/users/username/events{/privacy}",
    "received_events_url": "https://api.github.com/users/username/received_events",
    "type": "User",
    "site_admin": false,
    "contributions": 42
  }
]
```

#### Repository Releases
```javascript
GET /repos/{owner}/{repo}/releases
```

**Response Structure:**
```json
[
  {
    "url": "https://api.github.com/repos/owner/repo/releases/123456",
    "assets_url": "https://api.github.com/repos/owner/repo/releases/123456/assets",
    "upload_url": "https://uploads.github.com/repos/owner/repo/releases/123456/assets{?name,label}",
    "html_url": "https://github.com/owner/repo/releases/tag/v1.0.0",
    "id": 123456,
    "author": {
      "login": "username",
      "id": 123,
      "avatar_url": "https://avatars.githubusercontent.com/u/123?v=4"
    },
    "node_id": "release-node-id",
    "tag_name": "v1.0.0",
    "target_commitish": "main",
    "name": "Release v1.0.0",
    "draft": false,
    "prerelease": false,
    "created_at": "2023-12-01T00:00:00Z",
    "published_at": "2023-12-01T00:00:00Z",
    "assets": [],
    "tarball_url": "https://api.github.com/repos/owner/repo/tarball/v1.0.0",
    "zipball_url": "https://api.github.com/repos/owner/repo/zipball/v1.0.0",
    "body": "Release notes"
  }
]
```

## 🔧 Internal APIs

### Analysis Engine

#### `analyzeRepository(repoUrl)`
Analyzes a GitHub repository and returns comprehensive results.

**Parameters:**
- `repoUrl` (string): GitHub repository URL

**Returns:** Promise<AnalysisResult>

**Example:**
```javascript
const result = await analyzeRepository('https://github.com/django/django');
console.log(result.healthScore); // 94
console.log(result.recommendations); // Array of recommendations
```

#### `compareRepositories(repoUrls, comparisonType)`
Compares multiple repositories side-by-side.

**Parameters:**
- `repoUrls` (string[]): Array of GitHub repository URLs
- `comparisonType` (string): 'side-by-side' | 'quick-overview' | 'trend-analysis'

**Returns:** Promise<ComparisonResult>

**Example:**
```javascript
const comparison = await compareRepositories([
  'https://github.com/django/django',
  'https://github.com/pallets/flask'
], 'side-by-side');
```

### Health Scoring

#### `calculateHealthScore(repoData)`
Calculates the overall health score for a repository.

**Parameters:**
- `repoData` (RepositoryData): Repository analysis data

**Returns:** number (0-100)

**Scoring Weights:**
- Activity: 25%
- Documentation: 20%
- Community: 20%
- Code Quality: 15%
- Security: 10%
- Maintenance: 10%

### AI Insights

#### `generateInsights(repoData, healthScore)`
Generates AI-powered improvement recommendations.

**Parameters:**
- `repoData` (RepositoryData): Repository analysis data
- `healthScore` (number): Calculated health score

**Returns:** Insight[]

**Categories:**
- Documentation Improvements
- Community Engagement
- Code Quality
- Security & Maintenance
- Growth Opportunities

### Report Generation

#### `generateReport(analysisResult, format, options)`
Generates downloadable reports in various formats.

**Parameters:**
- `analysisResult` (AnalysisResult): Repository analysis results
- `format` (string): 'pdf' | 'json' | 'csv' | 'markdown'
- `options` (ReportOptions): Report customization options

**Returns:** Promise<Blob>

**Example:**
```javascript
const report = await generateReport(result, 'pdf', {
  includeCharts: true,
  includeRecommendations: true,
  sections: ['overview', 'metrics', 'insights']
});
```

## 📊 Data Structures

### AnalysisResult
```typescript
interface AnalysisResult {
  repository: {
    name: string;
    owner: string;
    fullName: string;
    description: string;
    language: string;
    size: number;
    stars: number;
    forks: number;
    watchers: number;
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    license: string;
    topics: string[];
    defaultBranch: string;
  };
  metrics: {
    commits: CommitData[];
    issues: IssueData[];
    pullRequests: PullRequestData[];
    contributors: ContributorData[];
    releases: ReleaseData[];
  };
  healthScore: number;
  healthBreakdown: {
    activity: number;
    documentation: number;
    community: number;
    codeQuality: number;
    security: number;
    maintenance: number;
  };
  insights: Insight[];
  charts: ChartData[];
  recommendations: Recommendation[];
  analysisDate: string;
  apiCallsUsed: number;
  rateLimitRemaining: number;
  rateLimitReset: string;
}
```

### RepositoryData
```typescript
interface RepositoryData {
  id: number;
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  fork: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  size: number;
  stargazersCount: number;
  watchersCount: number;
  language: string;
  hasIssues: boolean;
  hasProjects: boolean;
  hasDownloads: boolean;
  hasWiki: boolean;
  hasPages: boolean;
  hasDiscussions: boolean;
  forksCount: number;
  archived: boolean;
  disabled: boolean;
  license: LicenseData;
  allowForking: boolean;
  isTemplate: boolean;
  topics: string[];
  visibility: string;
  defaultBranch: string;
}
```

### Insight
```typescript
interface Insight {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priority: number;
  steps: string[];
  estimatedTime: string;
  expectedBenefits: string[];
  relatedMetrics: string[];
}
```

### Recommendation
```typescript
interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priority: number;
  actionPlan: {
    steps: string[];
    estimatedTime: string;
    resources: string[];
  };
  metrics: {
    current: number;
    target: number;
    improvement: number;
  };
  examples: string[];
  relatedInsights: string[];
}
```

### ComparisonResult
```typescript
interface ComparisonResult {
  repositories: AnalysisResult[];
  comparison: {
    healthScores: { [repoName: string]: number };
    activityComparison: ActivityComparison;
    documentationComparison: DocumentationComparison;
    communityComparison: CommunityComparison;
    codeQualityComparison: CodeQualityComparison;
  };
  insights: ComparisonInsight[];
  recommendations: ComparisonRecommendation[];
  charts: ComparisonChart[];
  analysisDate: string;
}
```

## ⚠️ Error Handling

### Error Types

#### RateLimitError
```javascript
{
  type: 'RATE_LIMIT_EXCEEDED',
  message: 'GitHub API rate limit exceeded',
  resetTime: '2023-12-01T01:00:00Z',
  remaining: 0,
  limit: 60
}
```

#### RepositoryNotFoundError
```javascript
{
  type: 'REPOSITORY_NOT_FOUND',
  message: 'Repository not found or inaccessible',
  url: 'https://github.com/owner/repo',
  status: 404
}
```

#### NetworkError
```javascript
{
  type: 'NETWORK_ERROR',
  message: 'Network connection failed',
  status: 0,
  retryable: true
}
```

#### ValidationError
```javascript
{
  type: 'VALIDATION_ERROR',
  message: 'Invalid repository URL format',
  field: 'repositoryUrl',
  value: 'invalid-url'
}
```

### Error Handling Examples

#### Handling Rate Limits
```javascript
try {
  const result = await analyzeRepository(repoUrl);
} catch (error) {
  if (error.type === 'RATE_LIMIT_EXCEEDED') {
    const resetTime = new Date(error.resetTime);
    const waitTime = Math.ceil((resetTime - new Date()) / 1000 / 60);
    console.log(`Rate limit exceeded. Reset in ${waitTime} minutes.`);
  }
}
```

#### Handling Network Errors
```javascript
try {
  const result = await analyzeRepository(repoUrl);
} catch (error) {
  if (error.type === 'NETWORK_ERROR' && error.retryable) {
    // Implement retry logic
    setTimeout(() => analyzeRepository(repoUrl), 5000);
  }
}
```

## 🚦 Rate Limiting

### GitHub API Limits

| Authentication | Requests/Hour | Requests/Minute |
|----------------|---------------|-----------------|
| Unauthenticated | 60 | 1 |
| Authenticated | 5,000 | 83 |
| Enterprise | 15,000 | 250 |

### Rate Limit Headers

```javascript
// Response headers
{
  'X-RateLimit-Limit': '60',
  'X-RateLimit-Remaining': '45',
  'X-RateLimit-Reset': '1701388800',
  'X-RateLimit-Used': '15'
}
```

### Rate Limit Management

#### Checking Rate Limits
```javascript
const checkRateLimit = async () => {
  const response = await fetch('https://api.github.com/rate_limit');
  const data = await response.json();
  return {
    limit: data.resources.core.limit,
    remaining: data.resources.core.remaining,
    reset: new Date(data.resources.core.reset * 1000)
  };
};
```

#### Implementing Retry Logic
```javascript
const analyzeWithRetry = async (repoUrl, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await analyzeRepository(repoUrl);
    } catch (error) {
      if (error.type === 'RATE_LIMIT_EXCEEDED') {
        const waitTime = Math.ceil((error.resetTime - new Date()) / 1000);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      } else if (error.type === 'NETWORK_ERROR' && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)));
      } else {
        throw error;
      }
    }
  }
};
```

## 📝 Examples

### Complete Analysis Example
```javascript
// Analyze a repository with full error handling
const analyzeRepositoryComplete = async (repoUrl) => {
  try {
    // Validate URL
    if (!isValidGitHubUrl(repoUrl)) {
      throw new ValidationError('Invalid GitHub repository URL');
    }

    // Check rate limits
    const rateLimit = await checkRateLimit();
    if (rateLimit.remaining < 10) {
      console.warn(`Low rate limit remaining: ${rateLimit.remaining}`);
    }

    // Perform analysis
    const result = await analyzeRepository(repoUrl);
    
    // Generate insights
    const insights = generateInsights(result.repository, result.healthScore);
    
    // Create charts
    const charts = createCharts(result.metrics);
    
    return {
      ...result,
      insights,
      charts,
      rateLimitInfo: rateLimit
    };
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
};
```

### Batch Analysis Example
```javascript
// Analyze multiple repositories with rate limit management
const analyzeMultipleRepositories = async (repoUrls) => {
  const results = [];
  const rateLimit = await checkRateLimit();
  
  for (const repoUrl of repoUrls) {
    try {
      // Check if we have enough rate limit
      if (rateLimit.remaining < 5) {
        const waitTime = Math.ceil((rateLimit.reset - new Date()) / 1000);
        console.log(`Waiting ${waitTime} seconds for rate limit reset...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        rateLimit.remaining = rateLimit.limit;
      }
      
      const result = await analyzeRepository(repoUrl);
      results.push(result);
      rateLimit.remaining--;
      
    } catch (error) {
      console.error(`Failed to analyze ${repoUrl}:`, error);
      results.push({ error, url: repoUrl });
    }
  }
  
  return results;
};
```

### Custom Report Generation
```javascript
// Generate custom report with specific sections
const generateCustomReport = async (analysisResult) => {
  const reportOptions = {
    includeCharts: true,
    includeRecommendations: true,
    includeRawData: false,
    sections: ['overview', 'health-score', 'insights', 'recommendations'],
    format: 'pdf',
    customStyling: {
      primaryColor: '#0366d6',
      secondaryColor: '#586069',
      fontFamily: 'Arial, sans-serif'
    }
  };
  
  const report = await generateReport(analysisResult, 'pdf', reportOptions);
  
  // Download the report
  const url = URL.createObjectURL(report);
  const a = document.createElement('a');
  a.href = url;
  a.download = `repopulse-analysis-${analysisResult.repository.fullName}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

**For more examples and use cases, check the examples directory and user guide.** 