import { getTokens } from '../storage.js';
import { formatDate } from '../utils.js';

async function fetchUserIssues(token) {
    const response = await fetch('https://api.github.com/search/issues?q=is:issue+is:open+assignee:@me', {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (response.ok) {
        const data = await response.json();
        return data.items || [];
    }
    console.error(`Error fetching issues: ${response.status}`);
    return [];
}

export async function fetchAllIssues(tokens) {
    try {
        const issuePromises = Object.values(tokens).map(token => fetchUserIssues(token));
        const issueArrays = await Promise.all(issuePromises);
        return issueArrays.flat().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } catch (error) {
        console.error('Error fetching issues:', error);
        return [];
    }
}

export async function displayIssues() {
    const issueTableBody = document.getElementById('issueTableBody');
    if (!issueTableBody) return; // Ensure element exists
    issueTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading Issues...</td></tr>';

    try {
        const tokens = await getTokens();
        const issues = await fetchAllIssues(tokens);

        if (issues.length === 0) {
            issueTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No open issues</td></tr>';
            return;
        }

        const fragment = document.createDocumentFragment();
        
        issues.forEach(issue => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600';
            const updatedAt = formatDate(issue.updated_at);
            row.innerHTML = `
                <td class="py-3 px-6 text-left">
                    <div class="flex items-center">
                        <img src="${issue.repository.owner.avatar_url}" class="w-6 h-6 rounded-full mr-2"/>
                        <a href="${issue.repository.html_url}" target="_blank" class="text-blue-500 dark:text-blue-200 hover:underline">
                            ${issue.repository.full_name}
                        </a>
                    </div>
                </td>
                <td class="py-3 px-6 text-left">
                    <a href="${issue.html_url}" target="_blank" class="text-blue-500 dark:text-blue-200 hover:underline">
                        ${issue.title}
                    </a>
                </td>
                <td class="py-3 px-6 text-left">${issue.labels.map(label => 
                    `<span class="px-2 py-1 rounded-full text-xs" style="background-color: #${label.color}4D">${label.name}</span>`
                ).join(' ')}</td>
                <td class="py-3 px-6 text-left">${updatedAt}</td>
                <td class="py-3 px-6 text-left">
                    <span class="px-2 py-1 rounded-full text-xs ${issue.state === 'open' ? 'bg-green-200' : 'bg-red-200'}">
                        ${issue.state}
                    </span>
                </td>
            `;
            fragment.appendChild(row);
        });

        issueTableBody.innerHTML = '';
        issueTableBody.appendChild(fragment);
    } catch (error) {
        console.error('Error displaying issues:', error);
        issueTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Error loading issues</td></tr>';
    }
}

