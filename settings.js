import { checkToken} from './utils/token.js';
import { saveToken, getTokens, deleteToken } from './utils/storage.js';
import { toggleDarkMode, initDarkMode } from './utils/theme.js';

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
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
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