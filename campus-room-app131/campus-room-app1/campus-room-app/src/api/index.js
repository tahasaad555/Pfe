// api/index.js
import axios from 'axios';

// Configure base URL for API requests
const API = axios.create({
  baseURL: '/api'
});

// Add request interceptor to include auth token in every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Add response interceptor to handle common errors
API.interceptors.response.use(
  response => response,
  error => {
    // Handle token expiration - MODIFIED: Only redirect if it's truly an auth issue
    if (error.response && error.response.status === 401) {
      // Check if we're already on the login page to prevent redirect loops
      if (window.location.pathname !== '/') {
        console.log('Authentication required - redirecting to login page');
        
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Use a timeout to allow the current operation to complete
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    }
    
    // Log detailed error information for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

// Debug info - log API object structure to console
console.log('API module loading correctly');

// Add API services directly to the API object
API.authAPI = {
  login: (email, password, rememberMe = false) => {
    return API.post('/auth/login', { email, password, rememberMe });
  },
  
  register: (userData) => {
    return API.post('/auth/register', userData);
  },
  
  forgotPassword: (email) => {
    return API.post('/auth/forgot-password', { email });
  },
  
  resetPassword: (token, password, confirmPassword) => {
    return API.post('/auth/reset-password', {
      token,
      password,
      confirmPassword
    });
  },
  
  // Added method for token validation
  validateToken: () => {
    return API.get('/auth/validate-token');
  }
};

// Room API Services
API.roomAPI = {
  getAllClassrooms: () => {
    return API.get('/classrooms'); 
  },
  getClassroomById: (id) => {
    return API.get(`/rooms/classrooms/${id}`);
  },
  createClassroom: (classroomData) => {
    return API.post('/rooms/classrooms', classroomData);
  },
  updateClassroom: (id, classroomData) => {
    return API.put(`/rooms/classrooms/${id}`, classroomData);
  },
  deleteClassroom: (id) => {
    return API.delete(`/rooms/classrooms/${id}`);
  },
  getAllStudyRooms: () => {
    return API.get('/rooms/study-rooms');
  },
  getStudyRoomById: (id) => {
    return API.get(`/rooms/study-rooms/${id}`);
  },
  createStudyRoom: (studyRoomData) => {
    return API.post('/rooms/study-rooms', studyRoomData);
  },
  updateStudyRoom: (id, studyRoomData) => {
    return API.put(`/rooms/study-rooms/${id}`, studyRoomData);
  },
  deleteStudyRoom: (id) => {
    return API.delete(`/rooms/study-rooms/${id}`);
  },
  searchAvailableRooms: (searchCriteria) => {
    return API.get('/rooms/search', { params: searchCriteria });
  },
  checkClassroomAvailability: (id, date) => {
    return API.get(`/rooms/classrooms/${id}/availability`, { params: { date } });
  },
  getAvailableTimeSlots: (id, date) => {
    return API.get(`/rooms/classrooms/${id}/available-times`, { params: { date } });
  },
  isRoomAvailable: (id, date, startTime, endTime) => {
    return API.get(`/rooms/classrooms/${id}/check`, { 
      params: { date, startTime, endTime } 
    });
  },
  checkStudyRoomAvailability: (id, date) => {
    return API.get(`/rooms/study-rooms/${id}/availability`, { params: { date } });
  },
  getStudyRoomAvailableTimeSlots: (id, date) => {
    return API.get(`/rooms/study-rooms/${id}/available-times`, { params: { date } });
  },
  isStudyRoomAvailable: (id, date, startTime, endTime) => {
    return API.get(`/rooms/study-rooms/${id}/check`, { 
      params: { date, startTime, endTime } 
    });
  },
  searchAvailableStudyRooms: (searchCriteria) => {
    return API.get('/rooms/study-rooms/search', { params: searchCriteria });
  }
};

// Student API Services - Explicitly define all methods
API.studentAPI = {
  getStudyRooms: () => {
    // Added fallback to public endpoint if authentication fails
    return API.get('/student/study-rooms')
      .catch(error => {
        console.log('Falling back to public study rooms endpoint');
        return API.get('/rooms/public-studyrooms');
      });
  },
  requestStudyRoomReservation: (roomId, reservationData) => {
    const requestData = {
      roomId,
      ...reservationData
    };
    return API.post('/student/study-room-reservations', requestData);
  },
  getMyReservations: () => {
    return API.get('/student/my-reservations');
  },
  cancelReservation: (reservationId) => {
    return API.put(`/student/reservations/${reservationId}/cancel`);
  },
  checkStudyRoomAvailability: (id, date) => {
    return API.get(`/student/study-rooms/${id}/availability`, { params: { date } });
  },
  getStudyRoomAvailableTimeSlots: (id, date) => {
    return API.get(`/student/study-rooms/${id}/available-times`, { params: { date } });
  },
  searchAvailableStudyRooms: (criteria) => {
    return API.post('/student/study-rooms/search', criteria);
  },
  getStudyRoomUsageStats: () => {
    return API.get('/student/study-room-usage-stats');
  }
};

// Professor API Services
API.professorAPI = {
  getMyReservations: () => {
    return API.get('/professor/reservations');
  },
  searchAvailableClassrooms: (criteria) => {
    return API.post('/professor/reservations/search', criteria);
  },
  requestReservation: (reservationData) => {
    return API.post('/professor/reservations/request', reservationData);
  },
  cancelReservation: (id) => {
    return API.put(`/professor/reservations/${id}/cancel`);
  }
};

// Reservation API Services
API.reservationAPI = {
  getAllReservations: () => {
    return API.get('/reservations');
  },
  getReservationsByStatus: (status) => {
    return API.get(`/reservations/status/${status}`);
  },
  getPendingDemands: (filters = {}) => {
    return API.get('/reservations/pending', { params: filters });
  },
  approveReservation: (id) => {
    return API.put(`/reservations/${id}/approve`);
  },
  rejectReservation: (id, reason) => {
    return API.put(`/reservations/${id}/reject`, { reason });
  },
  cancelReservation: (id) => {
    return API.put(`/reservations/${id}/cancel`);
  },
  getStudyRoomReservations: () => {
    return API.get('/reservations/study-rooms');
  },
  getStudyRoomReservationsByStatus: (status) => {
    return API.get(`/reservations/study-rooms/status/${status}`);
  }
};

// Notification API Services
API.notificationAPI = {
  getAllNotifications: () => {
    return API.get('/notifications');
  },
  getUnreadNotifications: () => {
    return API.get('/notifications/unread');
  },
  getUnreadCount: () => {
    return API.get('/notifications/count');
  },
  markAsRead: (id) => {
    return API.put(`/notifications/${id}/read`);
  },
  markAllAsRead: () => {
    return API.put('/notifications/read-all');
  }
};

// Admin API Services
API.adminAPI = {
  getDashboardStats: () => {
    return API.get('/admin/dashboard/stats');
  },
  getNotifications: () => {
    return API.get('/admin/dashboard/notifications');
  },
  getRecentReservations: () => {
    return API.get('/admin/dashboard/recent-reservations');
  },
  getPendingDemands: () => {
    return API.get('/admin/dashboard/pending-demands');
  },
  getReportsData: () => {
    return API.get('/admin/reports');
  },
  approveReservation: (id) => {
    return API.put(`/admin/approve-reservation/${id}`);
  },
  rejectReservation: (id, reason) => {
    return API.put(`/admin/reject-reservation/${id}`, { reason });
  },
  getUserNotifications: (userId) => {
    return API.get(`/admin/user-notifications/${userId}`);
  },
  getStudyRoomStats: () => {
    return API.get('/admin/study-room-stats');
  },
  getStudyRoomUsage: () => {
    return API.get('/admin/study-room-usage');
  },
  getStudyRoomReservations: () => {
    return API.get('/admin/study-room-reservations');
  }
};

// User API Services
API.userAPI = {
  getAllUsers: () => {
    return API.get('/users');
  },
  getUserById: (id) => {
    return API.get(`/users/${id}`);
  },
  getUserProfile: () => {
    return API.get('/users/profile');
  },
  updateUserProfile: (userData) => {
    return API.put('/users/profile', userData);
  },
  changePassword: (passwordData) => {
    return API.put('/users/change-password', passwordData);
  },
  getUsersByRole: (role) => {
    return API.get(`/users/role/${role}`);
  }
};

// Settings API Services
API.settingsAPI = {
  getSystemSettings: () => {
    return API.get('/settings');
  },
  updateSystemSettings: (settingsData) => {
    return API.put('/settings', settingsData);
  },
  getStudyRoomSettings: () => {
    return API.get('/settings/study-rooms');
  },
  updateStudyRoomSettings: (settingsData) => {
    return API.put('/settings/study-rooms', settingsData);
  }
};

// Email Notification API Services
API.emailAPI = {
  sendReservationStatusNotification: (reservationId, status, reason) => {
    return API.post('/notifications/reservation-status', {
      reservationId,
      status,
      reason: reason || ''
    });
  },
  sendNewReservationNotification: (reservationData) => {
    return API.post('/notifications/new-reservation', {
      reservationData
    });
  }
};

// Public endpoints without authentication requirements
API.publicAPI = {
  getStudyRooms: () => {
    return axios.get('/api/rooms/public-studyrooms');
  },
  getPublicRoomInfo: () => {
    return axios.get('/api/public/rooms');
  }
};

// Console log to help debug
console.log('API studentAPI defined:', API.studentAPI != null);
console.log('API professorAPI defined:', API.professorAPI != null);
console.log('API publicAPI defined:', API.publicAPI != null);

// Export as default and named export for compatibility
export { API };
export default API;