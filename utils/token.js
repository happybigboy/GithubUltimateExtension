// Cache for API responses
export const cache = {
    repos: new Map(),
    details: new Map(),
    codespaces: new Map()
};

export async function checkToken(token) {
    const response = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `token ${token}`
        }
    });
    return response.ok;
}

// Clear cache periodically
setInterval(() => {
    cache.codespaces.clear();
    cache.repos.clear();
    cache.details.clear();
}, 5 * 60 * 1000); // Clear every 5 minutes
