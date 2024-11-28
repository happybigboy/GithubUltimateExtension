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

getUserData();
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'index.html' });
});