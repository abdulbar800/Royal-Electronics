export const BASE_URL = 'https://royal-electronics.onrender.com';
export const API_URL = `${BASE_URL}/api`;

// Har request mein token automatically attach karne ke liye
const getHeaders = (isJson = true) => {
    const token = localStorage.getItem('token');
    const headers = {};

    if (isJson) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};


const handleAuthError = (status) => {
    if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('authChange'));
    }
};


const handleResponse = async (res) => {
    let data;
    try {
        data = await res.json();
    } catch {
        data = {};
    }

    if (!res.ok) {
        handleAuthError(res.status);
        const error = new Error(data.message || `Request failed with status ${res.status}`);
        error.status = res.status;
        error.data = data;
        throw error;
    }

    return data;
};

// ============================================
//  MAIN API FUNCTIONS
// ============================================

// GET request
export const apiGet = async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders()
    });
    return handleResponse(res);
};

// POST request
export const apiPost = async (endpoint, body = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    });
    return handleResponse(res);
};

// PUT request
export const apiPut = async (endpoint, body = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
    });
    return handleResponse(res);
};

// DELETE request
export const apiDelete = async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(res);
};


export const apiUpload = async (endpoint, formData, method = 'POST') => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: getHeaders(false), 
        body: formData
    });
    return handleResponse(res);
};

export default {
    BASE_URL,
    API_URL,
    apiGet,
    apiPost,
    apiPut,
    apiDelete,
    apiUpload
};