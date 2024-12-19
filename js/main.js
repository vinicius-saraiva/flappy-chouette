let featureModal;

async function loadFeatures() {
    const { data: features, error } = await supabaseClient
        .from('feature_requests')
        .select('*')
        .order('votes', { ascending: false });

    if (error) {
        console.error('Error loading features:', error);
        return;
    }

    const featureList = document.getElementById('featureList');
    featureList.innerHTML = '';

    features.forEach(feature => {
        const featureElement = document.createElement('div');
        featureElement.className = 'feature-item';
        featureElement.innerHTML = `
            <div class="vote-buttons">
                <button class="btn btn-sm btn-outline-primary" onclick="vote(${feature.id}, 1)">▲</button>
                <button class="btn btn-sm btn-outline-primary" onclick="vote(${feature.id}, -1)">▼</button>
            </div>
            <div class="feature-text">${feature.feature_text}</div>
            <div class="vote-count">${feature.votes}</div>
        `;
        featureList.appendChild(featureElement);
    });
}

async function vote(featureId, value) {
    const { data, error } = await supabaseClient
        .from('feature_requests')
        .update({ votes: supabase.sql`votes + ${value}` })
        .eq('id', featureId);

    if (error) {
        console.error('Error voting:', error);
        return;
    }

    loadFeatures();
}

async function submitFeature() {
    const input = document.getElementById('newFeature');
    const featureText = input.value.trim();
    const username = localStorage.getItem('username');

    if (!featureText || !username) return;

    const { error } = await supabaseClient
        .from('feature_requests')
        .insert({
            feature_text: featureText,
            created_by: username
        });

    if (error) {
        console.error('Error submitting feature:', error);
        return;
    }

    input.value = '';
    loadFeatures();
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the modal
    featureModal = new bootstrap.Modal(document.getElementById('featureModal'));
    
    // Add button click handler
    document.getElementById('featureRequestBtn').addEventListener('click', () => {
        loadFeatures();
        featureModal.show();
    });

    // Add submit button handler
    document.getElementById('submitFeature').addEventListener('click', submitFeature);

    // Add input validation
    document.getElementById('newFeature').addEventListener('input', (e) => {
        if (e.target.value.length > 50) {
            e.target.value = e.target.value.slice(0, 50);
        }
    });
});