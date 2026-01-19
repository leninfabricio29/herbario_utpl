/**
 * API Service - Axios instance configurada
 */
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Crear instancia de axios
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
    response => response,
    error => {
        const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
        return Promise.reject({ message: errorMessage, status: error.response?.status });
    }
);

/**
 * Hacer request con token de autorización
 */
const authRequest = (token) => {
    return axios.create({
        baseURL: API_BASE_URL,
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
};

/**
 * Auth API
 */
const authAPI = {
    login: async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        return response.data;
    },
    register: async (userData) => {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    },
    getProfile: async (token) => {
        const response = await authRequest(token).get('/auth/profile');
        return response.data;
    },
    getUsers: async (token) => {
        const response = await authRequest(token).get('/auth/users');
        return response.data;
    }
};

/**
 * Plants API
 */
const plantsAPI = {
    getAll: async (token, params = {}) => {
        const response = await authRequest(token).get('/plants', { params });
        return response.data;
    },
    getById: async (token, id) => {
        const response = await authRequest(token).get(`/plants/${id}`);
        return response.data;
    },
    create: async (token, plantData) => {
        const response = await authRequest(token).post('/plants', plantData);
        return response.data;
    },
    update: async (token, id, plantData) => {
        const response = await authRequest(token).put(`/plants/${id}`, plantData);
        return response.data;
    },
    delete: async (token, id) => {
        const response = await authRequest(token).delete(`/plants/${id}`);
        return response.data;
    },
    getStats: async (token) => {
        const response = await authRequest(token).get('/plants/stats');
        return response.data;
    }
};

/**
 * Public API (sin autenticación)
 */
const publicAPI = {
    getSpecimen: async (occurrenceID) => {
        const response = await apiClient.get(`/public/specimen/${occurrenceID}`);
        return response.data;
    },
    getStats: async () => {
        const response = await apiClient.get('/public/stats');
        return response.data;
    }
};

module.exports = {
    apiClient,
    authRequest,
    authAPI,
    plantsAPI,
    publicAPI
};
