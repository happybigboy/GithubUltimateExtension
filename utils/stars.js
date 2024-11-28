import { getTokens } from './storage.js';

export async function initStars() {
    await updateStarsList();
}

async function getAllStarredRepos(username, token) {
    let page = 1;
    let allStars = [];
    
    while (true) {
        const response = await fetch(
            `https://api.github.com/users/${username}/starred?page=${page}&per_page=100`,
            { headers: { 'Authorization': `token ${token}` } }
        );
        
        // Get total pages from Link header
        const linkHeader = response.headers.get('Link');
        const stars = await response.json();
        
        if (!stars.length) break;
        allStars = [...allStars, ...stars];
        
        // Check if we've reached the last page
        if (!linkHeader || !linkHeader.includes('rel="next"')) {
            break;
        }
        page++;
    }
    
    return allStars;
}

async function updateStarsList() {
    const starsList = document.getElementById('starsList');
    if (!starsList) return;

    const tokens = await getTokens();
    if (!Object.keys(tokens).length) {
        starsList.innerHTML = '<div class="text-gray-500">No GitHub tokens found</div>';
        return;
    }

    try {
        // Fetch user data and all stars for all users
        const allStars = await Promise.all(
            Object.entries(tokens).map(async ([username, token]) => {
                try {
                    const [userResponse, stars] = await Promise.all([
                        fetch(`https://api.github.com/users/${username}`, {
                            headers: { 'Authorization': `token ${token}` }
                        }).then(r => r.json()),
                        getAllStarredRepos(username, token)
                    ]);
                    
                    return { username, userData: userResponse, stars };
                } catch (error) {
                    console.error(`Error fetching data for ${username}:`, error);
                    return { username, userData: null, stars: [] };
                }
            })
        );

        // Create user sections with avatars and total star count
        starsList.innerHTML = allStars.map(({ username, userData, stars }) => {
            if (!userData) {
                return `<div class="text-red-500">Error fetching data for ${username}</div>`;
            }
            return `
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <img src="${userData.avatar_url}" alt="${username}" 
                                 class="w-8 h-8 rounded-full border-2 border-blue-500">
                            <h4 class="font-semibold text-sm text-gray-600 dark:text-gray-400">
                                ${username}'s Stars
                            </h4>
                        </div>
                        <span class="text-sm text-gray-500">Total: ${stars.length} ⭐</span>
                    </div>
                    ${stars.length ? 
                        stars.slice(0, 3).map(repo => `
                            <div class="flex items-center justify-between p-2 border-b dark:border-gray-600">
                                <div class="flex items-center gap-2">
                                    <img src="${repo.owner.avatar_url}" alt="${repo.owner.login}"
                                         class="w-6 h-6 rounded-full border border-gray-200">
                                    <a href="${repo.html_url}" target="_blank" class="text-blue-500 dark:text-blue-200 hover:text-blue-700">
                                        ${repo.full_name}
                                    </a>
                                </div>
                                <span class="text-sm text-gray-500">${repo.stargazers_count} ⭐</span>
                            </div>
                        `).join('') :
                        '<div class="text-gray-500">No starred repositories</div>'
                    }
                    ${stars.length > 3 ? `
                        <a href="https://github.com/${username}?tab=stars" target="_blank" 
                           class="block mt-2 text-blue-500 dark:text-blue-200 hover:text-blue-700 text-sm">
                            View all ${stars.length} starred repositories →
                        </a>
                    ` : ''}
                </div>
            `;
        }).join('<hr class="my-4 border-gray-200 dark:border-gray-600">');

    } catch (error) {
        starsList.innerHTML = '<div class="text-red-500">Error fetching starred repositories</div>';
        console.error('Error fetching stars:', error);
    }
}
