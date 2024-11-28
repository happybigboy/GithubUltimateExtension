import { formatDate,formatFileSize } from '../utils.js';
import {cache} from '../token.js'
export function filterRepos(repos, searchTerm, searchType) {
    if (!searchTerm) return repos;
    
    searchTerm = searchTerm.toLowerCase();
    return repos.filter(repo => {
        switch (searchType) {
            case 'name':
                return repo.name.toLowerCase().includes(searchTerm) ||
                       repo.full_name.toLowerCase().includes(searchTerm);
            case 'language':
                return repo.language && repo.language.toLowerCase().includes(searchTerm);
            case 'owner':
                return repo.owner.login.toLowerCase().includes(searchTerm);
            default:
                return true;
        }
    });
}


export function getRepoStats(repo) {
    return `
        <div class="text-xs space-y-1">
            <div>🕒 Created: ${formatDate(repo.created_at)}</div>
            <div>📝 Updated: ${formatDate(repo.pushed_at)}</div>
            <div>⭐ ${repo.stargazers_count} · 👁️ ${repo.watchers_count} · 🔨 ${repo.open_issues_count}</div>
            <div>📦 ${repo.language || 'No language'} · ${formatFileSize(repo.size)}</div>
        </div>
    `;
}

async function fetchCodespaces(token) {
    const response = await fetch('https://api.github.com/user/codespaces', {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (response.ok) {
        const data = await response.json();
        // The API returns an object with a codespaces array
        return Array.isArray(data.codespaces) ? data.codespaces : [];
    }
    console.error(`Error fetching codespaces: ${response.status}`);
    return [];
}

export async function fetchRepos(token, type = 'all') {
    try {
        let cachedRepos = cache.repos.get(token);
        if (cachedRepos) return cachedRepos;

        const response = await fetch(`https://api.github.com/user/repos?type=${type}&per_page=100`, {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        
        if (!response.ok) {
            console.error(`Error fetching repos: ${response.status}`);
            return [];
        }

        const repos = await response.json();
        
        const forkedRepos = repos.filter(repo => repo.fork);
        const detailPromises = forkedRepos.map(async repo => {
            try {
                const detailResponse = await fetch(repo.url, {
                    headers: {
                        'Authorization': `token ${token}`
                    }
                });
                const details = await detailResponse.json();
                cache.details.set(repo.url, details);
                return details;
            } catch (error) {
                console.error(`Error fetching fork details: ${error}`);
                return repo;
            }
        });

        const forkedDetails = await Promise.all(detailPromises);
        const detailedRepos = repos.map(repo => 
            repo.fork ? forkedDetails.find(d => d.id === repo.id) || repo : repo
        );
        
        const codespaces = await fetchCodespaces(token);
        
        const reposWithCodespaces = detailedRepos.map(repo => ({
            ...repo,
            codespaces: codespaces.find(cs => cs.repository?.id === repo.id)?.web_url || null
        }));
        
        cache.repos.set(token, reposWithCodespaces);
        return reposWithCodespaces;
    } catch (error) {
        console.error(`Error in fetchRepos: ${error}`);
        return [];
    }
}

export async function fetchAllRepos(tokens, type = 'all') {
    try {
        const repoPromises = Object.values(tokens).map(token => fetchRepos(token, type));
        const repoArrays = await Promise.all(repoPromises);
        const allRepos = repoArrays.flat().filter(Boolean); // Filter out any null/undefined values
        return allRepos;
    } catch (error) {
        console.error(`Error in fetchAllRepos: ${error}`);
        return [];
    }
}