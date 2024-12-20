// Maintenance check script
document.addEventListener('DOMContentLoaded', () => {
    if (CONFIG.MAINTENANCE_MODE) {
        // Check if we're on the game page
        if (window.location.pathname.includes('/game')) {
            window.location.href = CONFIG.MAINTENANCE_REDIRECT;
        }
        
        // Hide all game-related elements
        const elementsToHide = [
            '.auth-section',      // username input and play button container
            '.countdown',         // countdown container
            '.leaderboard',      // leaderboard container
            '.match-count',      // matches played and last match container
            '.announcement'       // announcements section
        ];

        elementsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element) element.style.display = 'none';
            });
        });

        // Add some spacing for the newsletter signup
        const newsletterSignup = document.querySelector('.newsletter-signup');
        if (newsletterSignup) {
            newsletterSignup.style.marginTop = '30px';
        }
    }
}); 