export const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Common fetch wrapper for API calls that automatically adds Authorization header
 * and handles base URL.
 * 
 * @param {string} endpoint - e.g. '/products'
 * @param {Object} options - fetch options (method, body, headers)
 * @returns {Promise<any>}
 */
export async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            console.warn('Unauthorized. Redirecting to login.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
            throw new Error('Unauthorized');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
