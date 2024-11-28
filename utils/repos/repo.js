import {displayRecommendedIssues} from '../issues/recommendations.js'
import { getTokens } from '../storage.js';
import {getRandomCodespaceIcon,extractCodespaceName,formatDate} from '../utils.js'
import {filterRepos,getRepoStats,fetchAllRepos} from './repoUtils.js'
import { repoItemsPerPage,repoCurrentPage } from '../../app.js';
let filteredRepos = []; // Add this at the top with other state variables

export async function displayRepos() {
    const repoTableBody = document.getElementById('repoTableBody');
    if (!repoTableBody) return; // Ensure element exists
    repoTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-4">
                <div class="flex items-center justify-center">
                    <svg class="animate-spin h-5 w-5 mr-3 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-gray-700 dark:text-gray-200">Loading repositories...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const tokens = await getTokens();
        const repos = await fetchAllRepos(tokens, 'all');

        if (!repos || repos.length === 0) {
            repoTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No repositories found</td></tr>';
            return;
        }

        // Get search term and type
        const searchTerm = document.getElementById('repoSearch')?.value || '';
        const searchType = document.getElementById('searchType')?.value || 'name';
        
        // Filter repositories
        filteredRepos = filterRepos(repos, searchTerm, searchType);

        if (filteredRepos.length === 0) {
            repoTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No matching repositories found</td></tr>';
            return;
        }

        const totalPages = Math.max(1, Math.ceil(filteredRepos.length / repoItemsPerPage));
        const start = (repoCurrentPage - 1) * repoItemsPerPage;
        const end = start + repoItemsPerPage;

        // Reset page if current page is beyond total pages
        if (repoCurrentPage > totalPages) {
            repoCurrentPage = 1;
        }

        const fragment = document.createDocumentFragment();
        
        filteredRepos.slice(start, end).forEach(repo => {
            if (!repo || !repo.owner) return; // Ensure repo and owner exist

            const icon = repo.codespaces ? getRandomCodespaceIcon() : null;
            const codespace_name = repo.codespaces ? extractCodespaceName(repo.codespaces) : null;
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
            row.innerHTML = `
                <td class="py-3 px-6 text-left">
                    <div class="flex items-center">
                        <img src="${repo.owner.avatar_url}" class="w-6 h-6 rounded-full mr-2" alt="${repo.owner.login}"/>
                        ${repo.owner.login}
                    </div>
                </td>
                <td class="py-3 px-6 text-left">
                    <a href="${repo.html_url}" target="_blank" class="text-blue-500 hover:underline">
                        ${repo.name} ${repo.fork ? '🔱' : ''} 🔗
                    </a>
                    ${repo.fork && repo.parent && repo.parent.owner ? `
                        <div class="text-xs text-gray-500 flex items-center mt-1">
                            <img src="${repo.parent.owner.avatar_url}" class="w-4 h-4 rounded-full mr-1" alt="${repo.parent.owner.login}"/>
                            Forked from: <a href="${repo.parent.html_url}" target="_blank" class="text-blue-500 hover:underline ml-1">${repo.parent.full_name}</a>
                        </div>
                    ` : ''}
                </td>
                <td class="py-3 px-6 text-left repo-stats-placeholder">Loading...</td>
                <td class="py-3 px-6 text-left">${repo.private ? '✅' : '❌'}</td>
                <td class="py-3 px-6 text-left">
                    ${icon ? 
                        `<a href="${repo.codespaces}" target="_blank" class="text-green-500 hover:underline">${icon} ${codespace_name}</a>` : 
                        `<button class="create-codespace-btn bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center" 
                                 data-repo-url="${repo.html_url}">+</button>`
                    }
                </td>
            `;
            fragment.appendChild(row);
        });

        repoTableBody.innerHTML = '';
        repoTableBody.appendChild(fragment);

        // Add event listeners for create codespace buttons
        document.querySelectorAll('.create-codespace-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const repoUrl = btn.dataset.repoUrl;
                if (repoUrl) {
                    // Open GitHub's codespace creation page in a new tab
                    window.open(`${repoUrl}/codespaces/new`, '_blank');
                }
            });
        });

        const repoPageNumber = document.getElementById('repo_pageNumber');
        if (repoPageNumber) repoPageNumber.textContent = `Page ${repoCurrentPage} of ${totalPages}`;
        const repoPrevPage = document.getElementById('repo_prevPage');
        if (repoPrevPage) repoPrevPage.disabled = repoCurrentPage === 1;
        const repoNextPage = document.getElementById('repo_nextPage');
        if (repoNextPage) repoNextPage.disabled = repoCurrentPage >= totalPages;

        filteredRepos.slice(start, end).forEach(async (repo, index) => {
            const stats = getRepoStats(repo);
            const row = repoTableBody.children[index];
            const statsCell = row.querySelector('.repo-stats-placeholder');
            if (statsCell) statsCell.innerHTML = stats;
        });

        await displayRecommendedIssues(tokens, repos);

    } catch (error) {
        console.error('Error displaying repos:', error);
        repoTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Error loading repositories</td></tr>';
    }
}
