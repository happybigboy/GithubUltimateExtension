import { checkToken } from './utils/token.js';
import { saveToken, getTokens, deleteToken } from './utils/storage.js';
import { toggleDarkMode, initDarkMode } from './utils/theme.js';

const DEBOUNCE_DELAY = 300;

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize dark mode
    initDarkMode();

    // Add dark mode toggle listener
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // Token form submission
    const tokenForm = document.getElementById('tokenForm');
    if (tokenForm) {
        tokenForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const token = document.getElementById('token').value;
            checkToken(token).then(isValid => {
                if (isValid) {
                    saveToken(token).then(() => {
                        console.log('Token saved.');
                        displayTokens();
                    });
                } else {
                    alert('Invalid GitHub token.');
                }
            });
        });
    }

    // Add token input validation
    const tokenInput = document.getElementById('token');
    const tokenStatus = document.getElementById('tokenStatus');
    const tokenHelp = document.getElementById('tokenHelp');

    const validateToken = debounce(async (token) => {
        if (!token) return;
        
        tokenStatus.classList.remove('hidden');
        try {
            const isValid = await checkToken(token);
            tokenStatus.innerHTML = isValid ? 
                '<svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : 
                '<svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
        } catch (error) {
            tokenStatus.innerHTML = '<svg class="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
        }
    }, DEBOUNCE_DELAY);

    if (tokenInput) {
        tokenInput.addEventListener('input', (e) => validateToken(e.target.value));
    }

    // Initialize interval input with stored value
    chrome.storage.local.get('checkInterval', (result) => {
        const interval = document.getElementById('interval');
        if (interval) {
            interval.value = result.checkInterval || 1;
        }
    });

    // Time interval form submission
    const intervalForm = document.getElementById('timeinterval');
    if (intervalForm) {
        intervalForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const interval = document.getElementById('interval').value;
            const intervalNum = parseInt(interval);
            
            if (intervalNum < 30) {
                alert('Interval must be at least 30 seconds to avoid API rate limits.');
                return;
            }

            chrome.storage.local.set({ checkInterval: intervalNum }, () => {
                console.log('Check interval saved.');
                alert('Check interval updated successfully.');
            });
        });
    }

    // Pagination buttons
    const prevPageButton = document.getElementById('prevPage');
    if (prevPageButton) {
        prevPageButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayTokens();
            }
        });
    }

    const nextPageButton = document.getElementById('nextPage');
    if (nextPageButton) {
        nextPageButton.addEventListener('click', () => {
            getTokens().then(tokens => {
                const totalPages = Math.ceil(Object.keys(tokens).length / itemsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    displayTokens();
                }
            });
        });
    }

    displayTokens();
});

let currentPage = 1;
const itemsPerPage = 10;

function displayTokens() {
    getTokens().then(async tokens => {
        const tokenTableBody = document.getElementById('tokenTableBody');
        if (!tokenTableBody) return; // Ensure element exists
        tokenTableBody.innerHTML = '';

        const tokenEntries = Object.entries(tokens);
        const totalPages = Math.ceil(tokenEntries.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        for (const [username, token] of tokenEntries.slice(start, end)) {
            const userData = await fetch(`https://api.github.com/users/${username}`, {
                headers: { 'Authorization': `token ${token}` }
            }).then(r => r.json());

            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600';
            row.innerHTML = `
                <td class="py-3 px-6 text-left">${token}</td>
                <td class="py-3 px-6 text-left flex items-center">
                    <img src="${userData.avatar_url}" class="w-6 h-6 rounded-full mr-2" alt="${username}"/>
                    ${username}
                </td>
                <td class="py-3 px-6 text-left">
                    <button class="delete-btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" data-name="${username}">Delete</button>
                </td>
            `;
            tokenTableBody.appendChild(row);
        }

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                deleteTokenHandler(this.dataset.name);
            });
        });

        const pageNumber = document.getElementById('pageNumber');
        if (pageNumber) pageNumber.textContent = `Page ${currentPage} of ${totalPages}`;
        const prevPage = document.getElementById('prevPage');
        if (prevPage) prevPage.disabled = currentPage === 1;
        const nextPage = document.getElementById('nextPage');
        if (nextPage) nextPage.disabled = currentPage === totalPages;
    });
}

function deleteTokenHandler(name) {
    deleteToken(name).then(() => {
        console.log('Token deleted.');
        displayTokens();
    });
}