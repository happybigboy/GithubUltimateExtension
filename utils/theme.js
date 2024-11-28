export const initDarkMode = () => {
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
    }
};

export const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
};

export function enableDarkMode(withTransition = true) {
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

export function disableDarkMode(withTransition = true) {
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