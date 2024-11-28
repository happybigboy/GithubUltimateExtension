export async function saveToken(token) {
    const response = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `token ${token}`
        }
    });
    const userData = await response.json();
    
    return new Promise((resolve) => {
        chrome.storage.local.get('githubTokens', (result) => {
            const tokens = result.githubTokens || {};
            tokens[userData.login] = token; // Use username as key
            chrome.storage.local.set({ githubTokens: tokens }, resolve);
        });
    });
}

export function getTokens() {
    return new Promise((resolve) => {
        chrome.storage.local.get('githubTokens', (result) => {
            resolve(result.githubTokens || {});
        });
    });
}

export function deleteToken(username) {
    return new Promise((resolve) => {
        chrome.storage.local.get('githubTokens', (result) => {
            const tokens = result.githubTokens || {};
            delete tokens[username];
            chrome.storage.local.set({ githubTokens: tokens }, resolve);
        });
    });
}
