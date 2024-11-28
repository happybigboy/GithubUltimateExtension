import { formatDate } from '../utils.js';

function getLanguageStats(repos) {
    const stats = {};
    repos.forEach(repo => {
        if (repo.language) {
            stats[repo.language] = (stats[repo.language] || 0) + 1;
        }
    });
    return Object.entries(stats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([lang]) => lang);
}

export async function fetchRecommendedIssues(token, repos) {
    try {
        const topLanguages = getLanguageStats(repos);
        const languageQuery = topLanguages.map(lang => `language:${lang}`).join('+');
        
        const response = await fetch(
            `https://api.github.com/search/issues?q=is:issue+is:open+no:assignee+good-first-issue+${languageQuery}&sort=created&per_page=10`,
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) return [];
        
        const data = await response.json();
        
        // Fetch repository details for each issue
        const issues = await Promise.all((data.items || []).map(async issue => {
            // Extract owner and repo from repository_url
            const [, , , , owner, repo] = issue.repository_url.split('/');
            const repoResponse = await fetch(
                `https://api.github.com/repos/${owner}/${repo}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            const repoData = await repoResponse.json();
            
            return {
                ...issue,
                repository: repoData
            };
        }));
        
        return issues;
    } catch (error) {
        console.error('Error fetching recommended issues:', error);
        return [];
    }
}


export async function displayRecommendedIssues(tokens, repos) {
    const recTableBody = document.getElementById('recommendedIssuesBody');
    if (!recTableBody) return; // Ensure element exists
    recTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading Recommendations...</td></tr>';

    try {
        const token = Object.values(tokens)[0]; // Use first token for recommendations
        const recommendations = await fetchRecommendedIssues(token, repos);

        if (!recommendations || recommendations.length === 0) {
            recTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No recommendations found</td></tr>';
            return;
        }

        const fragment = document.createDocumentFragment();
        
        recommendations.forEach(issue => {
            if (!issue.repository) return; // Skip if repository data is missing
            
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
            row.innerHTML = `
                <td class="py-3 px-6 text-left">
                    <div class="flex items-center">
                        <img src="${issue.repository.owner?.avatar_url || ''}" class="w-6 h-6 rounded-full mr-2" 
                             onerror="this.src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'"/>
                        <a href="${issue.repository.html_url}" target="_blank" class="text-blue-500 hover:underline">
                            ${issue.repository.full_name || 'Unknown Repository'}
                        </a>
                    </div>
                </td>
                <td class="py-3 px-6 text-left">
                    <a href="${issue.html_url}" target="_blank" class="text-blue-500 hover:underline">
                        ${issue.title}
                    </a>
                </td>
                <td class="py-3 px-6 text-left">${formatDate(issue.created_at)}</td>
                <td class="py-3 px-6 text-left">
                    ${(issue.labels || []).map(label => 
                        `<span class="px-2 py-1 rounded-full text-xs" style="background-color: #${label.color}4D">${label.name}</span>`
                    ).join(' ')}
                </td>
            `;
            fragment.appendChild(row);
        });

        recTableBody.innerHTML = '';
        recTableBody.appendChild(fragment);
    } catch (error) {
        console.error('Error displaying recommended issues:', error);
        recTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Error loading recommendations</td></tr>';
    }
}