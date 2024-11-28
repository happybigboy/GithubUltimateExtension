// Add at the top of the file
let isFirstRun = true;

// Add at top of file
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;
let totalNewStarsCount = 0;

async function fetchWithRetry(url, options, retries = 0) {
    try {
        const response = await fetch(url, options);
        
        if (response.status === 403) {
            const rateLimitReset = response.headers.get('X-RateLimit-Reset');
            if (rateLimitReset) {
                const waitTime = (parseInt(rateLimitReset) * 1000) - Date.now();
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return fetchWithRetry(url, options);
            }
        }

        if (!response.ok && retries < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, options, retries + 1);
        }

        return response;
    } catch (error) {
        if (retries < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, options, retries + 1);
        }
        throw error;
    }
}

// Update the badge with star count
function updateBadge(count) {
    totalNewStarsCount += count;
    chrome.action.setBadgeText({ text: totalNewStarsCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}

// ...existing code...
async function getUserData() {
    chrome.storage.local.get('githubTokens', async (result) => {
        const tokens = result.githubTokens || {};
        for (const token of Object.values(tokens)) {
            const response = await fetchWithRetry('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`
                }
            });
            const data = await response.json();
            chrome.storage.local.set({ userData: data }, () => {
                console.log('User data saved.');
            });
        }
    });
}

async function checkForNewStars() {
    try {
        const result = await chrome.storage.local.get(['githubTokens', 'starredRepos']);
        const tokens = result.githubTokens || {};
        const previousStarredRepos = result.starredRepos || {};

        for (const token of Object.values(tokens)) {
            const reposResponse = await fetchWithRetry('https://api.github.com/user/repos', {
                headers: {
                    'Authorization': `token ${token}`
                }
            });

            if (!reposResponse.ok) {
                console.error('Failed to fetch repos:', await reposResponse.text());
                continue;
            }

            const repos = await reposResponse.json();
            const newStarredRepos = {};
            let totalNewStars = 0;
            let reposWithNewStars = [];

            for (const repo of repos) {
                try {
                    const starsResponse = await fetchWithRetry(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/stargazers`, {
                        headers: {
                            'Authorization': `token ${token}`
                        }
                    });

                    if (!starsResponse.ok) {
                        const errorData = await starsResponse.json();
                        if (errorData.block && errorData.block.reason === "tos") {
                            console.log(`Skipping blocked repository: ${repo.name}`);
                            continue;
                        }
                        console.error(`Failed to fetch stargazers for ${repo.name}:`, errorData.message);
                        continue;
                    }

                    const stargazers = await starsResponse.json();
                    const stargazerIds = stargazers.map(user => user.id);
                    newStarredRepos[repo.id] = stargazerIds;

                    // Ensure previousStars is an array
                    const previousStars = Array.isArray(previousStarredRepos[repo.id]) 
                        ? previousStarredRepos[repo.id] 
                        : [];

                    // Compare current and previous stars
                    const newStars = stargazerIds.filter(id => 
                        !previousStars.some(prevId => prevId === id)
                    );

                    if (newStars.length > 0) {
                        totalNewStars += newStars.length;
                        reposWithNewStars.push({
                            name: repo.name,
                            newStars: newStars.length
                        });
                    }
                } catch (repoError) {
                    console.error(`Error processing repository ${repo.name}:`, repoError);
                    continue;
                }
            }

            if (totalNewStars > 0 && !isFirstRun) {
                updateBadge(totalNewStars);
                const notificationMessage = reposWithNewStars
                    .map(repo => `${repo.name}: ${repo.newStars} new star${repo.newStars > 1 ? 's' : ''}`)
                    .join('\n');

                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '/images/icon128.png',
                    title: `${totalNewStars} New Star${totalNewStars > 1 ? 's' : ''}!`,
                    message: notificationMessage,
                    priority: 2
                });
            }

            await chrome.storage.local.set({ starredRepos: newStarredRepos });
            isFirstRun = false;  // Set to false after first run
        }
    } catch (error) {
        console.error('Error checking for new stars:', error);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/images/icon128.png',
            title: 'Error',
            message: 'Failed to check for new stars. Will retry later.',
            priority: 1
        });
    }
}

// Use chrome.alarms with minimum interval
chrome.storage.local.get('checkInterval', (result) => {
    const interval = Math.max(result.checkInterval || 30, 30); // Ensure minimum 30 seconds
    chrome.alarms.create('checkStars', {
        periodInMinutes: interval / 60 // Convert seconds to minutes
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkStars') {
        checkForNewStars();
    }
});

// Initial check
getUserData();
checkForNewStars();

// Reset badge when clicking the extension icon
chrome.action.onClicked.addListener(() => {
    totalNewStarsCount = 0;
    chrome.action.setBadgeText({ text: '' });
    chrome.tabs.create({ url: 'index.html' });
});