class ChampionshipPopup {
    constructor() {
        this.modal = null;
        this.supabaseClient = supabase.createClient(
            'https://jkvwfawlgpxtvtxjlsjr.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprdndmYXdsZ3B4dHZ0eGpsc2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyMjE3MjMsImV4cCI6MjA0OTc5NzcyM30.yKURsZiOq3Vz71Om4xtnpK3xNHHnCnJAYdmExFzfYFI'
        );
        this.isLoading = true;
    }

    async initialize() {
        try {
            this.addModalHTML();
            this.modal = new bootstrap.Modal(document.getElementById('championshipModal'));
            
            // Add event listener for modal hidden event
            document.getElementById('championshipModal').addEventListener('hidden.bs.modal', () => {
                // Remove the modal element
                document.getElementById('championshipModal').remove();
                // Remove any remaining backdrop
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            });

            this.setLoading(true);
            await this.loadChampionshipStats();
            this.modal.show();
        } catch (error) {
            console.error('Error initializing championship popup:', error);
        }
    }

    addModalHTML() {
        const modalHTML = `
            <div class="modal fade" id="championshipModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content championship-modal">
                        <div class="modal-header">
                            <h5 class="modal-title">Le vrai maitre de la Chouette est</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="loading-overlay">
                                <div class="loading-content">
                                    <div class="loading-spinner"></div>
                                    <div class="loading-text">Chargement des statistiques...</div>
                                </div>
                            </div>
                            
                            <div class="champion-card">
                                <div id="championStats">Loading...</div>
                            </div>
                            <div class="runners-up">
                                <div class="runner-up">
                                    <div id="secondPlace">Loading...</div>
                                </div>
                                <div class="runner-up">
                                    <div id="thirdPlace">Loading...</div>
                                </div>
                            </div>

                            <div class="championship-stats">
                                <h6>Statistiques du championnat</h6>
                                <div class="coming-soon">Coming soon...</div>
                            </div>

                            <div class="newsletter-signup medieval-box">
                                <p class="newsletter-title">Stay in touch!</p>
                                <p class="newsletter-text">Sign up to stay updated on next championships:</p>
                                <div class="signup-form">
                                    <input type="email" id="modalEmailInput" placeholder="Your email address" class="email-input">
                                    <button id="modalSubscribeButton" class="subscribe-button">Subscribe</button>
                                </div>
                                <div id="modalSubscribeMessage" class="subscribe-message"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listener for the modal's subscribe button
        document.getElementById('modalSubscribeButton').addEventListener('click', async () => {
            const emailInput = document.getElementById('modalEmailInput');
            const messageDiv = document.getElementById('modalSubscribeMessage');
            const email = emailInput.value.trim();

            if (!email) {
                messageDiv.textContent = 'Please enter your email address';
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                messageDiv.textContent = 'Please enter a valid email address';
                return;
            }

            try {
                const { error } = await this.supabaseClient
                    .from('newsletter_subscribers')
                    .insert([{ email }]);

                // Always show success message
                messageDiv.textContent = 'Thank you for subscribing!';
                emailInput.value = '';
                
            } catch (error) {
                console.error('Error subscribing:', error);
                // Still show success message even if there's an error
                messageDiv.textContent = 'Thank you for subscribing!';
                emailInput.value = '';
            }
        });
    }

    setLoading(loading) {
        this.isLoading = loading;
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            if (loading) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }
    }

    async loadChampionshipStats() {
        try {
            this.setLoading(true);
            
            // First, get the top 3 players
            const { data: top3, error: top3Error } = await this.supabaseClient
                .from('scores')
                .select('username, score, created_at')
                .order('score', { ascending: false })
                .limit(3);

            if (top3Error) throw top3Error;

            // Get total matches and unique players
            const { data: statsData, error: statsError } = await this.supabaseClient
                .from('scores')
                .select('id, username, score');

            if (statsError) throw statsError;

            // Calculate statistics
            const totalMatches = statsData.length;
            const uniquePlayers = new Set(statsData.map(s => s.username)).size;
            const totalScore = statsData.reduce((sum, s) => sum + s.score, 0);
            const averageScore = Math.round((totalScore / totalMatches) * 10) / 10;
            const totalSeconds = statsData.reduce((sum, s) => sum + (5 + (s.score * 0.89)), 0);
            const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

            // Find most active player
            const playerMatches = {};
            statsData.forEach(s => {
                playerMatches[s.username] = (playerMatches[s.username] || 0) + 1;
            });
            const mostActive = Object.entries(playerMatches)
                .reduce((max, [username, count]) => 
                    count > (max.count || 0) ? {username, count} : max
                , {username: '', count: 0});

            console.log('Stats calculated:', {
                top3,
                totalMatches,
                uniquePlayers,
                averageScore,
                totalHours,
                mostActive
            });

            this.updateDOM(
                top3,
                totalMatches,
                totalHours,
                uniquePlayers,
                averageScore,
                mostActive
            );
        } catch (error) {
            console.error('Error loading championship stats:', error);
        } finally {
            this.setLoading(false);
        }
    }

    updateDOM(top3, totalMatches, totalHours, totalPlayers, averageScore, mostActivePlayer) {
        try {
            // Update champion card
            if (top3 && top3[0]) {
                document.getElementById('championStats').innerHTML = `
                    <div class="champion-name">${top3[0].username}</div>
                    <div class="champion-score">${top3[0].score} points</div>
                    <div class="champion-date">${this.formatDate(top3[0].created_at)}</div>
                    <div class="champion-duration">${this.formatDuration(top3[0].score)}</div>
                    <div class="champion-quote">"La chouette de Minerve ne prend son envol qu'à la tombée du jour"</div>
                `;
            }

            // Update runners up
            if (top3 && top3[1]) {
                document.getElementById('secondPlace').innerHTML = `
                    <div class="runner-name">${top3[1].username}</div>
                    <div class="runner-score">${top3[1].score} points</div>
                    <div class="runner-date">${this.formatDate(top3[1].created_at)}</div>
                    <div class="runner-duration">${this.formatDuration(top3[1].score)}</div>
                    <div class="runner-quote">"Benissez vos merges!"</div>
                `;
            }

            if (top3 && top3[2]) {
                document.getElementById('thirdPlace').innerHTML = `
                    <div class="runner-name">${top3[2].username}</div>
                    <div class="runner-score">${top3[2].score} points</div>
                    <div class="runner-date">${this.formatDate(top3[2].created_at)}</div>
                    <div class="runner-duration">${this.formatDuration(top3[2].score)}</div>
                    <div class="runner-quote">"Je suis fier de ma création"</div>
                `;
            }

            // Update statistics
            document.getElementById('totalMatches').textContent = totalMatches || 0;
            document.getElementById('totalHours').textContent = totalHours || 0;
            document.getElementById('totalPlayers').textContent = totalPlayers || 0;
            document.getElementById('averageScore').textContent = averageScore || 0;
            document.getElementById('mostActivePlayer').textContent = 
                mostActivePlayer ? `${mostActivePlayer.username} (${mostActivePlayer.count} matches)` : '-';

        } catch (error) {
            console.error('Error updating DOM:', error);
        }
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDuration(score) {
        const seconds = 5 + (score * 0.89);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `Durée: ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize when document is ready - show popup when maintenance mode is ON
document.addEventListener('DOMContentLoaded', () => {
    if (CONFIG.MAINTENANCE_MODE) {
        console.log('Initializing championship popup in maintenance mode');
        const championship = new ChampionshipPopup();
        championship.initialize();
    }
});