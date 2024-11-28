import { fetchAllRepos } from './utils/repos/repoUtils.js';
import { getTokens } from './utils/storage.js';
import { displayPullRequests} from './utils/pulls.js';
import { displayRepos } from './utils/repos/repo.js';
import { displayIssues } from './utils/issues/issues.js';
import { displayRecommendedIssues } from './utils/issues/recommendations.js';
import { toggleDarkMode, initDarkMode } from './utils/theme.js';
import { initStars } from './utils/stars.js';

export let repoCurrentPage = 1;
export const repoItemsPerPage = 10;

function initAccordions() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-target');
            const content = document.getElementById(targetId);
            
            // Toggle open class
            header.classList.toggle('open');
            content.classList.toggle('open');
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const menuTrigger = document.getElementById('menuTrigger');
    const floatingMenu = document.querySelector('.floating-menu');
    const menuItems = document.querySelectorAll('.floating-menu-item');

    if (menuTrigger && floatingMenu) {
        menuTrigger.addEventListener('mouseover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            floatingMenu.classList.add('active');
        });

        menuTrigger.addEventListener('mouseout', (e) => {
            e.preventDefault();
            e.stopPropagation();
            floatingMenu.classList.remove('active');
        });

        // Prevent menu items from closing the menu when hovered
        menuItems.forEach(item => {
            item.addEventListener('mouseover', (e) => {
                e.stopPropagation();
                floatingMenu.classList.add('active');
            });

            item.addEventListener('mouseout', (e) => {
                e.stopPropagation();
                floatingMenu.classList.remove('active');
            });
        });

        // Close menu when mouse leaves the floating menu
        floatingMenu.addEventListener('mouseleave', (e) => {
            floatingMenu.classList.remove('active');
        });
    }

    // Refresh all button functionality
    const refreshAllButton = document.getElementById('refreshAllButton');

    refreshAllButton.addEventListener('click', async () => {
        refreshAllButton.disabled = true;
        try {
            await Promise.all([
                displayPullRequests(),
                displayIssues(),
                displayRepos(),
                displayRecommendedIssues()
            ]);
        } finally {
            refreshAllButton.disabled = false;
            floatingMenu.classList.remove('active');
        }
    });
    // Initialize accordions
    initAccordions();
    
    // Initialize new features
    initDarkMode();
        // Add dark mode toggle listener
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    await displayRepos();
    await displayPullRequests();
    await displayIssues();
    await initStars();

    // Update floating menu initialization

    // Add search event listeners
    const searchInput = document.getElementById('repoSearch');
    const searchType = document.getElementById('searchType');
    const refreshButton = document.getElementById('refreshButton');

    if (refreshButton) {
        refreshButton.addEventListener('click', async () => {
            refreshButton.disabled = true;
            refreshButton.textContent = 'Refreshing...';
            try {
                await Promise.all([
                    displayPullRequests(),
                    displayIssues(),
                    displayRepos()
                ]);
            } finally {
                refreshButton.disabled = false;
                refreshButton.textContent = 'Refresh';
            }
        });
    }
    if (searchInput && searchType) {
        let debounceTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                repoCurrentPage = 1; // Reset to first page
                displayRepos();
            }, 300); // Debounce for 300ms
        });

        searchType.addEventListener('change', () => {
            repoCurrentPage = 1; // Reset to first page
            displayRepos();
        });
    }
});

const repoPrevPageButton = document.getElementById('repo_prevPage');
if (repoPrevPageButton) {
    repoPrevPageButton.addEventListener('click', () => {
        if (repoCurrentPage > 1) {
            repoCurrentPage--;
            displayRepos();
        }
    });
}

const repoNextPageButton = document.getElementById('repo_nextPage');
if (repoNextPageButton) {
    repoNextPageButton.addEventListener('click', async () => {
        const tokens = await getTokens();
        const repos = await fetchAllRepos(tokens, 'all');
        const totalPages = Math.max(1, Math.ceil(repos.length / repoItemsPerPage));
        
        if (repoCurrentPage < totalPages) {
            repoCurrentPage++;
            displayRepos();
        }
    });
}