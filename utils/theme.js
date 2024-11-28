export function initDarkMode() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

export function toggleDarkMode() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

function enableDarkMode(withTransition = true) {
    if (!withTransition) {
        document.documentElement.classList.add('no-transition');
    }
    
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
    
    if (!withTransition) {
        // Force reflow
        document.documentElement.offsetHeight;
        document.documentElement.classList.remove('no-transition');
    }
}

function disableDarkMode(withTransition = true) {
    if (!withTransition) {
        document.documentElement.classList.add('no-transition');
    }
    
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
    
    if (!withTransition) {
        // Force reflow
        document.documentElement.offsetHeight;
        document.documentElement.classList.remove('no-transition');
    }
}