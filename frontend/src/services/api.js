import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if we're not already on the login page
      // and it's not a login attempt
      const isLoginPage = window.location.pathname === '/login';
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      
      if (!isLoginPage && !isLoginRequest) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  checkStatus: () => api.get('/auth/status'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/users/${id}`),
  getBookings: (id) => api.get(`/users/${id}/bookings`),
};

// Events API
export const eventsAPI = {
  getAll: (params = {}) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
  getReviews: (id) => api.get(`/events/${id}/reviews`),
};

// Bookings API
export const bookingsAPI = {
  getAll: () => api.get('/bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (bookingData) => api.post('/bookings', bookingData),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

// Tickets API
export const ticketsAPI = {
  getByEvent: (eventId) => api.get(`/tickets/event/${eventId}`),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (ticketData) => api.post('/tickets', ticketData),
  update: (id, ticketData) => api.put(`/tickets/${id}`, ticketData),
  delete: (id) => api.delete(`/tickets/${id}`),
  getStats: (id) => api.get(`/tickets/${id}/stats`),
};

// Reviews API
export const reviewsAPI = {
  getByEvent: (eventId) => api.get(`/reviews/event/${eventId}`),
  getUserReviews: () => api.get('/reviews/user'),
  getById: (id) => api.get(`/reviews/${id}`),
  create: (reviewData) => api.post('/reviews', reviewData),
  update: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  delete: (id) => api.delete(`/reviews/${id}`),
  getAll: (params = {}) => api.get('/reviews', { params }),
};

// Venues API
export const venuesAPI = {
  getAll: (params = {}) => api.get('/venues', { params }),
  getById: (id) => api.get(`/venues/${id}`),
  create: (venueData) => api.post('/venues', venueData),
  update: (id, venueData) => api.put(`/venues/${id}`, venueData),
  delete: (id) => api.delete(`/venues/${id}`),
  getStats: (id) => api.get(`/venues/${id}/stats`),
  getCities: () => api.get('/venues/cities/list'),
};

// Payments API
export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  getAllAdmin: (params = {}) => api.get('/payments/admin/all', { params }),
  updateStatus: (id, status) => api.put(`/payments/${id}/status`, { status }),
  processRefund: (id, reason) => api.post(`/payments/${id}/refund`, { reason }),
  getStats: (params = {}) => api.get('/payments/admin/stats', { params }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read/all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  create: (notificationData) => api.post('/notifications', notificationData),
  getUnreadCount: () => api.get('/notifications/count/unread'),
  deleteAllRead: () => api.delete('/notifications/read/all'),
};

// Organizer API
export const organizerAPI = {
  getEvents: (id) => api.get(`/organizer/${id}/events`),
  getAttendees: (id) => api.get(`/organizer/${id}/attendees`),
  getEventAttendees: (id, eventId) => api.get(`/organizer/${id}/events/${eventId}/attendees`),
  getStats: (id) => api.get(`/organizer/${id}/stats`),
  getRevenue: (id, params = {}) => api.get(`/organizer/${id}/revenue`, { params }),
};

// Categories API (assuming you might need this)
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export default api;