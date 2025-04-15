import React, { useState, useEffect } from 'react';
import '../../styles/dashboard.css';

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
  
  // Load data on component mount
  useEffect(() => {
    const calculateStats = () => {
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
        count
      })).sort((a, b) => b.count - a.count).slice(0, 5);
      
      setPopularRooms(popularRoomsArray);
      
      // Calculate most active users
      const userCounts = {};
      
      // Count professor reservations by user
      professorReservations.forEach(res => {
        const userId = res.userId;
        if (!userCounts[userId]) {
          userCounts[userId] = 0;
        }
        userCounts[userId]++;
      });
      
      // Count student reservations by user
      studentReservations.forEach(res => {
        const userId = res.userId;
        if (!userCounts[userId]) {
          userCounts[userId] = 0;
        }
        userCounts[userId]++;
      });
      
      // Convert to array and sort
      const activeUsersArray = Object.entries(userCounts).map(([user, count]) => ({
        user,
        count
      })).sort((a, b) => b.count - a.count).slice(0, 5);
      
      setMostActiveUsers(activeUsersArray);
      
      // Calculate monthly activity
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyStats = months.map(month => ({
        month,
        professorCount: professorReservations.filter(res => res.date.includes(month)).length,
        studentCount: studentReservations.filter(res => res.date.includes(month)).length
      }));
      
      setMonthlyActivity(monthlyStats);
    };
    
    calculateStats();
  }, []);
  
  // Generate CSV report
  const generateCSV = () => {
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
      csvContent += `${res.id},${res.roomName},${res.userId},${res.userType},${res.date},${res.time},${res.purpose},${res.status}\n`;
    });
    
    // Create and download file
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'reservations_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="main-content">
      <div className="section-header">
        <h2>System Reports</h2>
        <button 
          className="btn-primary"
          onClick={generateCSV}
        >
          <i className="fas fa-download"></i> Export CSV Report
        </button>
      </div>
      
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
              {popularRooms.map((room, index) => (
                <tr key={index}>
                  <td>{room.room}</td>
                  <td>{room.count}</td>
                  <td>
                    <div className="progress-bar">
                      <div 
                        className="progress" 
                        style={{ 
                          width: `${Math.min((room.count / (stats.totalReservations || 1)) * 100, 100)}%`,
                          backgroundColor: index === 0 ? '#4a6cf7' : index === 1 ? '#6c70dc' : '#8e82c3' 
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
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
                <th>Reservations</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {mostActiveUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.user}</td>
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
              ))}
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
              {monthlyActivity.map((month, index) => (
                <tr key={index}>
                  <td>{month.month}</td>
                  <td>{month.professorCount}</td>
                  <td>{month.studentCount}</td>
                  <td>{month.professorCount + month.studentCount}</td>
                </tr>
              ))}
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
              >
                Export CSV
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
              <button className="btn-primary">Export Excel</button>
            </div>
          </div>
          
          <div className="export-card">
            <div className="export-icon">
              <i className="fas fa-file-pdf"></i>
            </div>
            <div className="export-info">
              <h4>System Status Report</h4>
              <p>Export formatted system status summary</p>
              <button className="btn-primary">Export PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;