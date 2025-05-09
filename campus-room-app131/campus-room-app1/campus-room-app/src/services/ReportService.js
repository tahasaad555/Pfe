// src/services/ReportService.js
import API from '../api';

/**
 * Service for handling report data operations
 * Improved with better database connectivity and real-time updates
 */
class ReportService {
  /**
   * Fetch dashboard statistics for reports directly from the database
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    try {
      // Make a direct API call to get fresh data
      const response = await API.get('/admin/dashboard/stats');
      
      // Dispatch an event to notify components of data update
      this._dispatchDataUpdateEvent('stats-updated');
      
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Fallback: Try ReportsAPI if available in the API object
      try {
        if (API.reportsAPI && API.reportsAPI.getDashboardStats) {
          const response = await API.reportsAPI.getDashboardStats();
          return response.data;
        }
      } catch (fallbackError) {
        console.error('Fallback stats fetch failed:', fallbackError);
      }
      
      // Final fallback: try to combine data from multiple endpoints
      try {
        const promises = [
          API.get('/rooms/classrooms').catch(() => ({ data: [] })),
          API.get('/rooms/study-rooms').catch(() => ({ data: [] })),
          API.get('/reservations').catch(() => ({ data: [] })),
          API.get('/users').catch(() => ({ data: [] }))
        ];
        
        const [classroomsRes, studyRoomsRes, reservationsRes, usersRes] = await Promise.all(promises);
        
        const classrooms = classroomsRes.data || [];
        const studyRooms = studyRoomsRes.data || [];
        const reservations = reservationsRes.data || [];
        const users = usersRes.data || [];
        
        // Calculate statistics from the raw data
        const activeReservations = reservations.filter(r => r.status === 'APPROVED').length;
        const pendingReservations = reservations.filter(r => r.status === 'PENDING').length;
        const professorReservations = reservations.filter(r => r.role?.toLowerCase() === 'professor').length;
        const studentReservations = reservations.filter(r => r.role?.toLowerCase() === 'student').length;
        
        const lectureHalls = classrooms.filter(c => c.type === 'Lecture Hall').length;
        const regularClassrooms = classrooms.filter(c => c.type === 'Classroom').length;
        const computerLabs = classrooms.filter(c => c.type === 'Computer Lab').length;
        
        // Return formatted stats
        return {
          totalClassrooms: classrooms.length,
          totalStudyRooms: studyRooms.length,
          totalReservations: reservations.length,
          activeReservations,
          pendingReservations,
          rejectedReservations: reservations.filter(r => r.status === 'REJECTED').length,
          professorReservations,
          studentReservations,
          totalUsers: users.length,
          classroomBreakdown: `${lectureHalls} lecture halls, ${regularClassrooms} classrooms, ${computerLabs} labs`,
          reservationBreakdown: `${professorReservations} by professors, ${studentReservations} by students`
        };
      } catch (multiError) {
        console.error('Multi-endpoint stats gathering failed:', multiError);
        throw error; // Throw the original error
      }
    }
  }

  /**
   * Fetch full reports data from the database for admin reports page
   * @returns {Promise<Object>} Complete reports data
   */
  async getReportsData() {
    try {
      // Try the dedicated endpoint for comprehensive report data
      const response = await API.get('/admin/reports');
      
      // Notify components of data update
      this._dispatchDataUpdateEvent('reports-updated');
      
      return response.data;
    } catch (error) {
      console.error('Error fetching reports data:', error);
      
      // Try alternative endpoint if available
      try {
        if (API.reportsAPI && API.reportsAPI.getReportsData) {
          const response = await API.reportsAPI.getReportsData();
          return response.data;
        }
      } catch (alternativeError) {
        console.error('Alternative endpoint failed:', alternativeError);
      }
      
      // Fallback: try to calculate the data from multiple endpoints
      try {
        // Gather all necessary data
        const promises = [
          API.get('/rooms/classrooms').catch(() => ({ data: [] })),
          API.get('/rooms/study-rooms').catch(() => ({ data: [] })),
          API.get('/reservations').catch(() => ({ data: [] })),
          API.get('/users').catch(() => ({ data: [] }))
        ];
        
        const [classroomsRes, studyRoomsRes, reservationsRes, usersRes] = await Promise.all(promises);
        
        const classrooms = classroomsRes.data || [];
        const studyRooms = studyRoomsRes.data || [];
        const reservations = reservationsRes.data || [];
        const users = usersRes.data || [];
        
        // Calculate statistics
        const stats = this._calculateStats(classrooms, studyRooms, reservations, users);
        
        // Calculate popular rooms
        const popularRooms = this._calculatePopularRooms(reservations);
        
        // Calculate most active users
        const mostActiveUsers = this._calculateActiveUsers(reservations, users);
        
        // Calculate monthly activity
        const monthlyActivity = this._calculateMonthlyActivity(reservations);
        
        return {
          statistics: stats,
          popularRooms,
          activeUsers: mostActiveUsers,
          monthlyActivity
        };
      } catch (fallbackError) {
        console.error('Fallback reports data gathering failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }
  
  /**
   * Fetch specific report data by type directly from the database
   * @param {string} reportType - Type of report to fetch (e.g., 'popular-rooms', 'active-users')
   * @returns {Promise<Object>} Report data for the specified type
   */
  async getSpecificReport(reportType) {
    try {
      // Validate report type
      const validReportTypes = ['popular-rooms', 'active-users', 'monthly-activity'];
      if (!validReportTypes.includes(reportType)) {
        throw new Error(`Invalid report type: ${reportType}`);
      }
      
      // Convert report type to API endpoint format
      const endpoint = `/admin/reports/${reportType}`;
      
      // Make API call to get report data
      const response = await API.get(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${reportType} report:`, error);
      
      // Try alternative endpoint if available
      try {
        if (API.reportsAPI) {
          // Convert report type to method name (e.g., 'popular-rooms' -> 'getPopularRooms')
          const methodName = 'get' + reportType.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join('');
          
          if (API.reportsAPI[methodName]) {
            const response = await API.reportsAPI[methodName]();
            return response.data;
          }
        }
      } catch (alternativeError) {
        console.error('Alternative endpoint failed:', alternativeError);
      }
      
      // Fallback to recalculating the specific report
      try {
        // Get all reservations
        const reservationsResponse = await API.get('/reservations');
        const reservations = reservationsResponse.data || [];
        
        // Get all users if needed
        let users = [];
        if (reportType === 'active-users') {
          const usersResponse = await API.get('/users');
          users = usersResponse.data || [];
        }
        
        // Calculate and return the specific report
        switch (reportType) {
          case 'popular-rooms':
            return this._calculatePopularRooms(reservations);
          case 'active-users':
            return this._calculateActiveUsers(reservations, users);
          case 'monthly-activity':
            return this._calculateMonthlyActivity(reservations);
          default:
            throw new Error('Invalid report type');
        }
      } catch (fallbackError) {
        console.error('Fallback calculation failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }
  
  /**
   * Calculate basic statistics from raw data
   * @private
   */
  _calculateStats(classrooms, studyRooms, reservations, users) {
    const totalReservations = reservations.length;
    const approvedReservations = reservations.filter(r => r.status === 'APPROVED').length;
    const pendingReservations = reservations.filter(r => r.status === 'PENDING').length;
    const rejectedReservations = reservations.filter(r => r.status === 'REJECTED').length;
    
    const professorReservations = reservations.filter(r => r.role?.toLowerCase() === 'professor').length;
    const studentReservations = reservations.filter(r => r.role?.toLowerCase() === 'student').length;
    
    return {
      totalReservations,
      approvedReservations,
      pendingReservations,
      rejectedReservations,
      professorReservations,
      studentReservations,
      totalClassrooms: classrooms.length,
      totalStudyRooms: studyRooms.length,
      totalUsers: users.length
    };
  }
  
  /**
   * Calculate popular rooms statistics
   * @private
   */
  _calculatePopularRooms(reservations) {
    // Count reservations by room
    const roomCounts = {};
    reservations.forEach(res => {
      const roomName = res.classroom || res.room || 'Unknown';
      roomCounts[roomName] = (roomCounts[roomName] || 0) + 1;
    });
    
    // Convert to array and sort
    const totalReservations = reservations.length || 1; // Avoid division by zero
    const popularRooms = Object.entries(roomCounts).map(([room, count]) => ({
      room,
      count,
      percentage: (count / totalReservations) * 100
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    return popularRooms;
  }
  
  /**
   * Calculate most active users
   * @private
   */
  _calculateActiveUsers(reservations, users) {
    // Count reservations by user
    const userCounts = {};
    reservations.forEach(res => {
      const userId = res.userId || res.reservedBy || 'Unknown';
      userCounts[userId] = (userCounts[userId] || 0) + 1;
    });
    
    // Map user IDs to names and roles
    const userIdToDetails = {};
    users.forEach(user => {
      const userId = user.id || user.email || 'Unknown';
      userIdToDetails[userId] = {
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || userId,
        role: user.role || 'Unknown'
      };
    });
    
    // Convert to array and sort
    const activeUsers = Object.entries(userCounts).map(([userId, count]) => {
      const userDetails = userIdToDetails[userId] || { 
        userName: userId, 
        role: 'Unknown' 
      };
      
      return {
        userId,
        userName: userDetails.userName,
        role: userDetails.role,
        count
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);
    
    return activeUsers;
  }
  
  /**
   * Calculate monthly activity
   * @private
   */
  _calculateMonthlyActivity(reservations) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize counts for each month
    const monthlyStats = months.map(month => ({
      month,
      professorCount: 0,
      studentCount: 0,
      total: 0
    }));
    
    // Count reservations by month and role
    reservations.forEach(res => {
      if (!res.date) return;
      
      try {
        const date = new Date(res.date);
        const monthIndex = date.getMonth();
        
        if (res.role?.toLowerCase() === 'professor') {
          monthlyStats[monthIndex].professorCount++;
        } else if (res.role?.toLowerCase() === 'student') {
          monthlyStats[monthIndex].studentCount++;
        }
        
        monthlyStats[monthIndex].total++;
      } catch (e) {
        console.error('Error parsing date:', res.date, e);
      }
    });
    
    return monthlyStats;
  }
  
  /**
   * Generate CSV report of all reservations from the database
   * @returns {Promise<string>} CSV content as string
   */
  async generateCSVReport() {
    try {
      // Try to get the CSV directly from the API
      try {
        const response = await API.get('/admin/reports/csv', {
          responseType: 'text'
        });
        return response.data;
      } catch (directError) {
        console.error('Direct CSV fetch failed:', directError);
      }
      
      // Try alternative endpoint if available
      try {
        if (API.reportsAPI && API.reportsAPI.getCSVReport) {
          const response = await API.reportsAPI.getCSVReport();
          return response.data;
        }
      } catch (alternativeError) {
        console.error('Alternative CSV endpoint failed:', alternativeError);
      }
      
      // Fallback: Generate CSV from raw data
      // Get all reservations from API
      const response = await API.get('/reservations');
      const reservations = response.data;
      
      // Create CSV header
      let csvContent = 'ID,Room,User,User Type,Date,Time,Purpose,Status\n';
      
      // Add rows
      reservations.forEach(res => {
        csvContent += `${res.id || ''},${res.classroom || res.room || ''},${res.reservedBy || ''},${res.role || ''},${res.date || ''},${res.time || ''},${this._escapeCsvField(res.purpose) || ''},${res.status || ''}\n`;
      });
      
      return csvContent;
    } catch (error) {
      console.error('Error generating CSV report:', error);
      throw error;
    }
  }
  
  /**
   * Escape special characters in CSV fields
   * @private
   */
  _escapeCsvField(field) {
    if (!field) return '';
    // Escape quotes and wrap in quotes if the field contains commas, quotes, or newlines
    const escaped = field.toString().replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`;
    }
    return escaped;
  }
  
  /**
   * Generate Excel report with comprehensive data
   * @returns {Promise<Blob>} Excel file as blob
   */
  async generateExcelReport() {
    try {
      // Try to get the Excel file directly from the API
      const response = await API.get('/admin/reports/excel', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error generating Excel report:', error);
      throw error;
    }
  }
  
  /**
   * Generate PDF report with comprehensive data
   * @returns {Promise<Blob>} PDF file as blob
   */
  async generatePDFReport() {
    try {
      // Try to get the PDF file directly from the API
      const response = await API.get('/admin/reports/pdf', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }
  
  /**
   * Register event handler for report data updates
   * @param {Function} handler - Function to call when data is updated
   * @returns {Function} Function to unregister the handler
   */
  onDataUpdate(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    
    // Add event listeners for all update events
    const eventTypes = [
      'stats-updated',
      'reports-updated',
      'reservation-updated',
      'user-created',
      'room-updated'
    ];
    
    // Register handler for each event type
    eventTypes.forEach(eventType => {
      window.addEventListener(eventType, handler);
    });
    
    // Return function to remove event listeners
    return () => {
      eventTypes.forEach(eventType => {
        window.removeEventListener(eventType, handler);
      });
    };
  }
  
  /**
   * Dispatch custom event to notify of data updates
   * @param {string} eventType - Type of update event
   * @private
   */
  _dispatchDataUpdateEvent(eventType) {
    const event = new CustomEvent(eventType, {
      detail: {
        timestamp: new Date().toISOString(),
        source: 'ReportService'
      }
    });
    
    window.dispatchEvent(event);
  }
  
  /**
   * Notify that a reservation has been updated
   * Used by other services to trigger report updates
   */
  notifyReservationUpdated() {
    this._dispatchDataUpdateEvent('reservation-updated');
  }
  
  /**
   * Notify that a user has been created or updated
   * Used by other services to trigger report updates
   */
  notifyUserUpdated() {
    this._dispatchDataUpdateEvent('user-created');
  }
  
  /**
   * Notify that a room has been updated
   * Used by other services to trigger report updates
   */
  notifyRoomUpdated() {
    this._dispatchDataUpdateEvent('room-updated');
  }
}

export default new ReportService();