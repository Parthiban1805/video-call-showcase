import axios from 'axios';

// Create an Axios instance with default configuration
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Global Errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle session expiration
        if (error.response && error.response.status === 401) {
            console.warn('Session expired. Redirecting to login...');
            localStorage.removeItem('token');
            // Typically dispatch a logout action or redirect
            // window.location.href = '/login'; 
        }

        // Normalize error message format
        const message = error.response?.data?.msg || error.message || 'An unexpected error occurred';
        return Promise.reject({ ...error, message });
    }
);

export default apiClient;
