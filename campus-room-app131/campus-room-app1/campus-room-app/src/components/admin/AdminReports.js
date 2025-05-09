import React, { useState, useEffect } from 'react';
import '../../styles/dashboard.css';
import ReportService from '../../services/ReportService';

const AdminReports = () => {
  const [stats, setStats] = useState({
    totalReservations: 0,
    approvedReservations: 0,
    pendingReservations: 0,
    rejectedReservations: 0,
    professorReservations: 0,
    studentReservations: 0,
    totalClassrooms: 0,
    totalStudyRooms: 0,
    totalUsers: 0
  });
  
  const [popularRooms, setPopularRooms] = useState([]);
  const [mostActiveUsers, setMostActiveUsers] = useState([]);
  const [monthlyActivity, setMonthlyActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load data on component mount
  useEffect(() => {
    fetchReportData();
  }, []);
  
  // Fetch report data from API
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch comprehensive reports data
      const reportData = await ReportService.getReportsData();
      
      // Set stats from API response
      if (reportData.statistics) {
        setStats(reportData.statistics);
      }
      
      // Set popular rooms from API response
      if (reportData.popularRooms) {
        setPopularRooms(reportData.popularRooms);
      }
      
      // Set most active users from API response
      if (reportData.activeUsers) {
        setMostActiveUsers(reportData.activeUsers);
      }
      
      // Set monthly activity from API response
      if (reportData.monthlyActivity) {
        setMonthlyActivity(reportData.monthlyActivity);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setError("Failed to load report data from server.");
      
      // Fallback to localStorage if API fails
      fallbackToLocalStorage();
      
      setLoading(false);
    }
  };
  
  // Fallback to localStorage data if API fails
  const fallbackToLocalStorage = () => {
    try {
      console.log("Falling back to localStorage data");
      
      // Get data from localStorage
      const professorReservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
      const studentReservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
      const classrooms = JSON.parse(localStorage.getItem('availableClassrooms') || '[]');
      const studyRooms = JSON.parse(localStorage.getItem('studyRooms') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Calculate basic stats
      const totalReservations = professorReservations.length + studentReservations.length;
      const approvedReservations = professorReservations.filter(res => res.status === 'Approved').length + 
                                studentReservations.filter(res => res.status === 'Approved').length;
      const pendingReservations = professorReservations.filter(res => res.status === 'Pending').length + 
                              studentReservations.filter(res => res.status === 'Pending').length;
      const rejectedReservations = professorReservations.filter(res => res.status === 'Rejected').length + 
                              studentReservations.filter(res => res.status === 'Rejected').length;
      
      setStats({
        totalReservations,
        approvedReservations,
        pendingReservations,
        rejectedReservations,
        professorReservations: professorReservations.length,
        studentReservations: studentReservations.length,
        totalClassrooms: classrooms.length,
        totalStudyRooms: studyRooms.length,
        totalUsers: users.length
      });
      
      // Calculate popular rooms
      const roomCounts = {};
      
      // Count professor reservations by room
      professorReservations.forEach(res => {
        const roomName = res.classroom;
        if (!roomCounts[roomName]) {
          roomCounts[roomName] = 0;
        }
        roomCounts[roomName]++;
      });
      
      // Count student reservations by room
      studentReservations.forEach(res => {
        const roomName = res.room;
        if (!roomCounts[roomName]) {
          roomCounts[roomName] = 0;
        }
        roomCounts[roomName]++;
      });
      
      // Convert to array and sort
      const popularRoomsArray = Object.entries(roomCounts).map(([room, count]) => ({
        room,
        count,
        percentage: (count / totalReservations) * 100
      })).sort((a, b) => b.count - a.count).slice(0, 5);
      
      setPopularRooms(popularRoomsArray);
      
      // Calculate most active users
      const userCounts = {};
      
      // Count professor reservations by user
      professorReservations.forEach(res => {
        const userId = res.userId || res.reservedBy;
        if (!userCounts[userId]) {
          userCounts[userId] = 0;
        }
        userCounts[userId]++;
      });
      
      // Count student reservations by user
      studentReservations.forEach(res => {
        const userId = res.userId || res.reservedBy;
        if (!userCounts[userId]) {
          userCounts[userId] = 0;
        }
        userCounts[userId]++;
      });
      
      // Convert to array and sort
      const activeUsersArray = Object.entries(userCounts).map(([userId, count]) => ({
        userId,
        userName: userId,
        role: "Unknown",
        count
      })).sort((a, b) => b.count - a.count).slice(0, 5);
      
      setMostActiveUsers(activeUsersArray);
      
      // Calculate monthly activity
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyStats = months.map(month => {
        const profCount = professorReservations.filter(res => res.date && res.date.includes(month)).length;
        const studCount = studentReservations.filter(res => res.date && res.date.includes(month)).length;
        
        return {
          month,
          professorCount: profCount,
          studentCount: studCount,
          total: profCount + studCount
        };
      });
      
      setMonthlyActivity(monthlyStats);
    } catch (error) {
      console.error("Error in localStorage fallback:", error);
      // If localStorage also fails, set some default data
      setDefaultFallbackData();
    }
  };
  
  // Set default fallback data if both API and localStorage fail
  const setDefaultFallbackData = () => {
    setStats({
      totalReservations: 0,
      approvedReservations: 0,
      pendingReservations: 0,
      rejectedReservations: 0,
      professorReservations: 0,
      studentReservations: 0,
      totalClassrooms: 0,
      totalStudyRooms: 0,
      totalUsers: 0
    });
    setPopularRooms([]);
    setMostActiveUsers([]);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    setMonthlyActivity(months.map(month => ({
      month,
      professorCount: 0,
      studentCount: 0,
      total: 0
    })));
  };
  
  // Generate CSV report
  const generateCSV = async () => {
    try {
      setLoading(true);
      
      // Try to get CSV data from service
      const csvContent = await ReportService.generateCSVReport();
      
      // Create and download file
      const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'reservations_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setLoading(false);
    } catch (error) {
      console.error("Error generating CSV:", error);
      
      // Fallback: generate CSV from localStorage
      try {
        // Get data from localStorage
        const professorReservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
        const studentReservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
        
        // Combine all reservations
        const allReservations = [
          ...professorReservations.map(res => ({
            ...res,
            roomName: res.classroom,
            userType: 'Professor'
          })),
          ...studentReservations.map(res => ({
            ...res,
            roomName: res.room,
            userType: 'Student'
          }))
        ];
        
        // Sort by date
        allReservations.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Create CSV header
        let csvContent = 'ID,Room,User,User Type,Date,Time,Purpose,Status\n';
        
        // Add rows
        allReservations.forEach(res => {
          csvContent += `${res.id},${res.roomName},${res.userId || res.reservedBy},${res.userType},${res.date},${res.time},${res.purpose || ''},${res.status}\n`;
        });
        
        // Create and download file
        const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'reservations_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error("Error in CSV localStorage fallback:", fallbackError);
        alert("Failed to generate CSV report. Please try again later.");
      }
      
      setLoading(false);
    }
  };
  
  // Export data to Excel format (skeleton function for future implementation)
  const exportToExcel = () => {
    alert("Excel export functionality will be implemented in a future update.");
  };
  
  // Export data to PDF format (skeleton function for future implementation)
  const exportToPDF = () => {
    alert("PDF export functionality will be implemented in a future update.");
  };
  
  // Show loading state
  if (loading && Object.values(stats).every(val => val === 0)) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="main-content">
      <div className="section-header">
        <h2>System Reports</h2>
        <button 
          className="btn-primary"
          onClick={generateCSV}
          disabled={loading}
        >
          {loading ? (
            <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
          ) : (
            <span><i className="fas fa-download"></i> Export CSV Report</span>
          )}
        </button>
      </div>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {/* Overview Stats */}
      <div className="section">
        <h3 className="sub-section-title">System Overview</h3>
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon icon-blue">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-info">
              <h3>Total Reservations</h3>
              <p className="stat-number">{stats.totalReservations}</p>
              <p className="stat-description">
                {stats.approvedReservations} approved, {stats.pendingReservations} pending
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon icon-green">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <h3>User Reservations</h3>
              <p className="stat-number">{stats.professorReservations} / {stats.studentReservations}</p>
              <p className="stat-description">
                Professor / Student reservations
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon icon-yellow">
              <i className="fas fa-door-open"></i>
            </div>
            <div className="stat-info">
              <h3>Rooms Available</h3>
              <p className="stat-number">{stats.totalClassrooms + stats.totalStudyRooms}</p>
              <p className="stat-description">
                {stats.totalClassrooms} classrooms, {stats.totalStudyRooms} study rooms
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon icon-red">
              <i className="fas fa-user-friends"></i>
            </div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <p className="stat-number">{stats.totalUsers}</p>
              <p className="stat-description">
                Registered system users
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Popular Rooms */}
      <div className="section">
        <h3 className="sub-section-title">Most Popular Rooms</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Reservations</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              {popularRooms.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">No data available</td>
                </tr>
              ) : (
                popularRooms.map((room, index) => (
                  <tr key={index}>
                    <td>{room.room}</td>
                    <td>{room.count}</td>
                    <td>
                      <div className="progress-bar">
                        <div 
                          className="progress" 
                          style={{ 
                            width: `${Math.min(room.percentage, 100)}%`,
                            backgroundColor: index === 0 ? '#4a6cf7' : index === 1 ? '#6c70dc' : '#8e82c3' 
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Most Active Users */}
      <div className="section">
        <h3 className="sub-section-title">Most Active Users</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Reservations</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {mostActiveUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">No data available</td>
                </tr>
              ) : (
                mostActiveUsers.map((user, index) => (
                  <tr key={index}>
                    <td>{user.userName}</td>
                    <td>{user.role}</td>
                    <td>{user.count}</td>
                    <td>
                      <div className="progress-bar">
                        <div 
                          className="progress" 
                          style={{ 
                            width: `${Math.min((user.count / (stats.totalReservations || 1)) * 100, 100)}%`,
                            backgroundColor: index === 0 ? '#28a745' : index === 1 ? '#5cb85c' : '#80c780' 
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Monthly Activity */}
      <div className="section">
        <h3 className="sub-section-title">Monthly Reservation Activity</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Professor Reservations</th>
                <th>Student Reservations</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlyActivity.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">No data available</td>
                </tr>
              ) : (
                monthlyActivity.map((month, index) => (
                  <tr key={index}>
                    <td>{month.month}</td>
                    <td>{month.professorCount}</td>
                    <td>{month.studentCount}</td>
                    <td>{month.professorCount + month.studentCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="section">
        <h3 className="sub-section-title">Data Export Options</h3>
        <div className="export-options">
          <div className="export-card">
            <div className="export-icon">
              <i className="fas fa-file-csv"></i>
            </div>
            <div className="export-info">
              <h4>Full Reservations Report</h4>
              <p>Export all reservation data with details</p>
              <button 
                className="btn-primary"
                onClick={generateCSV}
                disabled={loading}
              >
                {loading ? (
                  <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                ) : (
                  <span>Export CSV</span>
                )}
              </button>
            </div>
          </div>
          
          <div className="export-card">
            <div className="export-icon">
            <i className="fas fa-file-excel"></i>
            </div>
            <div className="export-info">
              <h4>Monthly Usage Report</h4>
              <p>Export month-by-month usage statistics</p>
              <button 
                className="btn-primary"
                onClick={exportToExcel}
                disabled={loading}
              >
                Export Excel
              </button>
            </div>
          </div>
          
          <div className="export-card">
            <div className="export-icon">
              <i className="fas fa-file-pdf"></i>
            </div>
            <div className="export-info">
              <h4>System Status Report</h4>
              <p>Export formatted system status summary</p>
              <button 
                className="btn-primary"
                onClick={exportToPDF}
                disabled={loading}
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;