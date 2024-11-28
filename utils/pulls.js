// Fix the import path by removing 'utils/'
import { getTokens } from './storage.js';

export async function displayPullRequests() {
    const prTableBody = document.getElementById('prTableBody');
    if (!prTableBody) return; // Ensure element exists
    prTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading Pull Requests...</td></tr>';

    const tokens = await getTokens();
    const prs = await fetchAllPullRequests(tokens);

    if (prs.length === 0) {
        prTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No open pull requests</td></tr>';
        return;
    }

    const fragment = document.createDocumentFragment();
    
    prs.forEach(pr => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600';
        const createdAt = new Date(pr.created_at).toLocaleDateString();
        row.innerHTML = `
            <td class="py-3 px-6 text-left">
                <div class="flex items-center space-x-2">
                    <div class="flex -space-x-2">
                        <img src="${pr.base?.user?.avatar_url || pr.base?.repo?.owner?.avatar_url}" 
                             class="w-6 h-6 rounded-full ring-2 ring-white" 
                             alt="Repository owner"
                             title="Repository owner"/>
                        <img src="${pr.user.avatar_url}" 
                             class="w-6 h-6 rounded-full ring-2 ring-white" 
                             alt="${pr.user.login}"
                             title="Pull request author: ${pr.user.login}"/>
                    </div>
                    <a href="${pr.repository_url.replace('api.github.com/repos', 'github.com')}" target="_blank" class="text-blue-500 dark:text-blue-200 dark:text-blue-200 hover:underline">
                        ${pr.repository_url.split('/').slice(-2).join('/')}
                    </a>
                </div>
            </td>
            <td class="py-3 px-6 text-left">
                <a href="${pr.html_url}" target="_blank" class="text-blue-500 dark:text-blue-200 hover:underline">
                    ${pr.title}
                </a>
            </td>
            <td class="py-3 px-6 text-left">${createdAt}</td>
            <td class="py-3 px-6 text-left">
                <span class="px-2 py-1 rounded-full text-xs ${pr.draft ? 'bg-gray-200' : 'bg-yellow-200'}">
                    ${pr.draft ? 'Draft' : 'Open'}
                </span>
            </td>
        `;
        fragment.appendChild(row);
    });

    prTableBody.innerHTML = '';
    prTableBody.appendChild(fragment);
}

export async function fetchPullRequests(token) {
    // Use the correct API query format for user's PRs
    const response = await fetch('https://api.github.com/search/issues?q=is:pr+is:open+author:@me', {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (response.ok) {
        const data = await response.json();
        const prs = data.items || [];
        
        // Fetch additional PR details for each pull request
        const detailedPRs = await Promise.all(prs.map(async pr => {
            const prResponse = await fetch(pr.pull_request.url, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (prResponse.ok) {
                const prData = await prResponse.json();
                return {
                    ...pr,
                    draft: prData.draft,
                    repository_url: prData.base.repo.html_url,
                    base: prData.base
                };
            }
            return pr;
        }));
        
        return detailedPRs;
    }
    console.error(`Error fetching pull requests: ${response.status}`);
    return [];
}

export async function fetchAllPullRequests(tokens) {
    const prPromises = Object.values(tokens).map(token => fetchPullRequests(token));
    const prArrays = await Promise.all(prPromises);
    return prArrays.flat();
}