class NewsletterSignup {
    constructor() {
        this.emailInput = document.getElementById('emailInput');
        this.subscribeButton = document.getElementById('subscribeButton');
        this.messageElement = document.getElementById('subscribeMessage');
        this.supabaseClient = supabase.createClient(
            'https://jkvwfawlgpxtvtxjlsjr.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprdndmYXdsZ3B4dHZ0eGpsc2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyMjE3MjMsImV4cCI6MjA0OTc5NzcyM30.yKURsZiOq3Vz71Om4xtnpK3xNHHnCnJAYdmExFzfYFI'
        );
        
        this.init();
    }

    init() {
        this.subscribeButton.addEventListener('click', () => this.handleSubscribe());
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSubscribe();
        });
    }

    async handleSubscribe() {
        const email = this.emailInput.value.trim();
        const username = localStorage.getItem('username') || 'Anonymous';

        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        try {
            const { error } = await this.supabaseClient
                .from('newsletter_subscribers')
                .insert([
                    { email: email, username: username }
                ]);

            if (error) {
                if (error.code === '23505') { // Unique violation
                    this.showMessage('This email is already subscribed!', 'error');
                } else {
                    throw error;
                }
            } else {
                this.showMessage('Successfully subscribed!', 'success');
                this.emailInput.value = '';
            }
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('An error occurred. Please try again later.', 'error');
        }
    }

    validateEmail(email) {
        return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }

    showMessage(message, type) {
        this.messageElement.textContent = message;
        this.messageElement.className = 'subscribe-message ' + type;
        setTimeout(() => {
            this.messageElement.textContent = '';
            this.messageElement.className = 'subscribe-message';
        }, 5000);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    new NewsletterSignup();
}); 