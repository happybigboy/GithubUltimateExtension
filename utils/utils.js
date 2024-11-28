let displayTimeout;

export function getRandomCodespaceIcon() {
    const icons = ['🚀', '💫', '⭐', '🌟', '✨', '🎯', '🎮', '🎪', '🎨', '🎭', '🎪', '🎢', '🎡'];
    return icons[Math.floor(Math.random() * icons.length)];
}

export function extractCodespaceName(url) {
    // Extract name from URL like "https://expert-parakeet-wrg54pxv769w3v96v.github.dev"
    const match = url.match(/https:\/\/(.*?)(?:-[a-z0-9]+)?\.github\.dev/);
    return match ? match[1].replace(/-/g, ' ') : 'Codespace';
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatFileSize(bytes) {
    const units = ['KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size >= 10 ? Math.round(size) : size.toFixed(1)}${units[unitIndex]}`;
}