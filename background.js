// ...existing code...
async function getUserData() {
    chrome.storage.local.get('githubTokens', async (result) => {
        const tokens = result.githubTokens || {};
        for (const token of Object.values(tokens)) {
            const response = await fetch('https://api.github.com/user', {
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
    chrome.storage.local.get(['githubTokens', 'starredRepos'], async (result) => {
        const tokens = result.githubTokens || {};
        const previousStarredRepos = result.starredRepos || {};

        for (const token of Object.values(tokens)) {
            const response = await fetch('https://api.github.com/user/starred', {
                headers: {
                    'Authorization': `token ${token}`
                }
            });
            const starredRepos = await response.json();

            starredRepos.forEach(repo => {
                if (!previousStarredRepos[repo.id]) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon.png',
                        title: 'New Star!',
                        message: `Your repository ${repo.name} has a new star!`
                    });
                }
            });

            const newStarredRepos = {};
            starredRepos.forEach(repo => {
                newStarredRepos[repo.id] = repo;
            });

            chrome.storage.local.set({ starredRepos: newStarredRepos });
        }
    });
}

getUserData();
setInterval(checkForNewStars, 6000); // Check for new stars every minute
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'index.html' });
});