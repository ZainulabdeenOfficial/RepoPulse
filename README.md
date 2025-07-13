# RepoPulse - Real-time Analysis

A pure web-based application that analyzes GitHub repositories using real-time data from the GitHub API. No server required - runs entirely in your browser!

## 🌟 Features

- **Real-time Data**: Fetches live data directly from GitHub's API
- **Popularity Prediction**: Analyzes stars, forks, and engagement metrics
- **Maintainer Activity**: Tracks commit frequency and community engagement
- **Contribution Guide Check**: Verifies essential documentation and templates
- **Smart Recommendations**: Provides actionable suggestions for improvement
- **Improvement Roadmap**: Detailed step-by-step improvement plans with effort estimates
- **Beautiful UI**: Modern, responsive design with interactive charts
- **100% Free**: No API keys or authentication required

## 🚀 **Unique Features That Set Us Apart**

### 🤖 **AI-Powered Insights**
- **Smart Pattern Recognition**: Analyzes star-to-fork ratios and activity patterns
- **Community Health Analysis**: Identifies engagement patterns and contributor diversity
- **Predictive Analytics**: Forecasts project growth and sustainability

### 💚 **Repository Health Score**
- **Issue Resolution Rate**: Tracks how quickly issues are resolved
- **Activity Consistency**: Measures development regularity and patterns
- **Release Frequency**: Analyzes release cadence and stability
- **Contributor Diversity**: Evaluates community participation levels

### 🌳 **Project Maturity Assessment**
- **Age-based Classification**: Infant → Child → Teenager → Young Adult → Adolescent → Mature
- **Community Evolution**: Tracks project growth stages
- **Stability Indicators**: Measures project reliability and longevity

### 📈 **Trend Analysis**
- **Recent Star Growth**: Tracks increasing interest and popularity
- **Development Momentum**: Analyzes recent commit activity patterns
- **Community Engagement**: Measures issue and PR interaction levels

### 🏆 **Competitor Analysis**
- **Language-based Ranking**: Compares against similar repositories
- **Market Position**: Shows your rank among top repositories
- **Performance Benchmarking**: Measures against industry leaders

### ⚠️ **Risk Assessment**
- **Single Maintainer Risk**: Identifies dependency on one person
- **Inactivity Warnings**: Alerts to declining project activity
- **Issue Backlog**: Highlights maintenance challenges
- **Documentation Gaps**: Points out missing essential guides

### 🌱 **Growth Opportunities**
- **Community Expansion**: Suggests ways to increase visibility
- **Team Building**: Recommends contributor recruitment strategies
- **Documentation Enhancement**: Guides documentation improvements
- **Release Optimization**: Advises on release schedule improvements

## 🚀 Quick Start

1. **Open the application**:
   - Simply open `index.html` in your web browser
   - Or host it on any static web server

2. **Analyze a repository**:
   - Enter a GitHub repository URL (e.g., `https://github.com/username/repo-name`)
   - Click "Analyze Repository"
   - Wait 10-30 seconds for real-time analysis

3. **View results**:
   - Overall score with detailed breakdown
   - Interactive charts and metrics
   - Personalized recommendations and improvement roadmap
   - Step-by-step action plans with effort estimates
   - Share results on social media

## 📊 What We Analyze

### Popularity Score (40% weight)
- Stars, forks, and watchers count
- Growth trends and engagement metrics
- Future popularity prediction

### Activity Score (40% weight)
- Recent commit frequency (7 and 30 days)
- Open issues and pull requests
- Contributor diversity and engagement

### Contribution Guide Score (20% weight)
- README file presence and quality
- CONTRIBUTING guidelines
- Issue and PR templates
- Code of Conduct and License

## 🛠️ Technical Details

- **Frontend**: Pure HTML, CSS, JavaScript
- **API**: GitHub REST API (public endpoints)
- **Charts**: Chart.js for data visualization
- **UI**: Bootstrap 5 for responsive design
- **Icons**: Font Awesome

## 📈 Analysis Algorithm

The application uses sophisticated algorithms to calculate scores:

1. **Popularity**: Logarithmic scaling of stars/forks/watchers
2. **Activity**: Weighted scoring based on recent commits and engagement
3. **Contributions**: File presence checking for essential documentation

## 🔧 Rate Limiting

- Uses GitHub's public API (60 requests/hour for unauthenticated users)
- Automatically checks rate limit status
- Shows helpful error messages when limits are exceeded

## 🌐 Deployment

### Local Development
```bash
# Simply open index.html in your browser
# Or use a local server:
python -m http.server 8000
# Then visit http://localhost:8000
```

### Static Hosting
Deploy to any static hosting service:
- **GitHub Pages**: Push to a repository and enable Pages
- **Netlify**: Drag and drop the folder
- **Vercel**: Import the repository
- **Firebase Hosting**: Use Firebase CLI

## 📝 Example Analysis

Try analyzing these popular repositories:
- `https://github.com/facebook/react`
- `https://github.com/microsoft/vscode`
- `https://github.com/tensorflow/tensorflow`

## 🤝 Contributing

This is a static web application. To contribute:

1. Fork the repository
2. Make your changes to `index.html` or `js/app.js`
3. Test locally by opening `index.html`
4. Submit a pull request

**📖 Detailed Contributing Guide**: See [CONTRIBUTING.md](CONTRIBUTING.md) for comprehensive instructions on how to add improvements, new features, and contribute to the project.

## 📄 License

MIT License - feel free to use and modify as needed.

## 🆘 Troubleshooting

**"Repository not found" error**:
- Check the URL format: `https://github.com/username/repo-name`
- Ensure the repository is public
- Verify the repository exists

**"Rate limit exceeded" error**:
- Wait for the rate limit to reset (usually 1 hour)
- The app will automatically retry when limits are available

**Slow loading**:
- Analysis takes 10-30 seconds for comprehensive results
- This is normal due to multiple API calls for real-time data

## 🔗 Links

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Chart.js Documentation](https://www.chartjs.org/)
- [Bootstrap Documentation](https://getbootstrap.com/)

---

**Note**: This application uses GitHub's public API and respects rate limits. For higher limits, consider using a GitHub personal access token.
