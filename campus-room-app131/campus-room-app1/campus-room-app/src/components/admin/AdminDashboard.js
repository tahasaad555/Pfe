import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/dashboard.css';

// Component imports
import SideNav from '../common/SideNav';
import StatCard from '../common/StatCard';
import ReservationsList from './ReservationsList';
import UserManagement from './UserManagement';
import AdminClassrooms from './AdminClassrooms';
import AdmineDemands from './AdminDemands.js';
import AdminReports from './AdminReports.js';
import AdminSettings from './AdminSettings';
import Profile from '../common/Profile';


const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Mock data - in a real app, these would come from an API
  const [stats, setStats] = useState({
    totalClassrooms: 24,
    activeReservations: 18,
    pendingDemands: 7,
    totalUsers: 156
  });
  
  const [recentReservations, setRecentReservations] = useState([
    {
      id: 'RES1001',
      classroom: 'Room 101',
      reservedBy: 'Professor Smith',
      role: 'Professor',
      date: 'Mar 25, 2025',
      time: '10:00 - 12:00',
      status: 'Approved'
    },
    {
      id: 'RES1002',
      classroom: 'Room 203',
      reservedBy: 'John Doe',
      role: 'Student',
      date: 'Mar 26, 2025',
      time: '14:00 - 16:00',
      status: 'Pending'
    },
    {
      id: 'RES1003',
      classroom: 'Lab 305',
      reservedBy: 'Professor Johnson',
      role: 'Professor',
      date: 'Mar 27, 2025',
      time: '09:00 - 11:00',
      status: 'Approved'
    }
  ]);
  
  const [pendingDemands, setPendingDemands] = useState([
    {
      id: 'DEM1001',
      classroom: 'Room 203',
      requestedBy: 'John Doe',
      role: 'Student',
      date: 'Mar 26, 2025',
      time: '14:00 - 16:00',
      purpose: 'Group Study'
    },
    {
      id: 'DEM1002',
      classroom: 'Room 105',
      requestedBy: 'Jane Smith',
      role: 'Student',
      date: 'Mar 28, 2025',
      time: '10:00 - 12:00',
      purpose: 'Project Meeting'
    },
    {
      id: 'DEM1003',
      classroom: 'Lab 201',
      requestedBy: 'Professor Davis',
      role: 'Professor',
      date: 'Apr 1, 2025',
      time: '13:00 - 15:00',
      purpose: 'Extra Lab Session'
    }
  ]);
  
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const approveReservation = (id) => {
    // In a real app, this would call an API to update the database
    const updatedReservations = recentReservations.map(reservation => {
      if (reservation.id === id) {
        return { ...reservation, status: 'Approved' };
      }
      return reservation;
    });
    
    setRecentReservations(updatedReservations);
    
    // Also update pending demands
    const updatedDemands = pendingDemands.filter(demand => demand.id !== id);
    setPendingDemands(updatedDemands);
    
    alert('Reservation approved successfully.');
  };

  const rejectReservation = (id) => {
    if (window.confirm('Are you sure you want to reject this reservation?')) {
      // Remove from recent reservations if exists
      const updatedReservations = recentReservations.filter(
        reservation => reservation.id !== id
      );
      setRecentReservations(updatedReservations);
      
      // Remove from pending demands if exists
      const updatedDemands = pendingDemands.filter(demand => demand.id !== id);
      setPendingDemands(updatedDemands);
      
      alert('Reservation rejected successfully.');
    }
  };

  // Content for the main dashboard view
  const DashboardHome = () => (
    <div className="main-content">
      {/* Stats Overview */}
      <div className="stats-container">
        <StatCard
          icon="fas fa-chalkboard"
          title="Total Classrooms"
          value={stats.totalClassrooms}
          color="blue"
          description="8 classrooms, 10 labs, 6 lecture halls"
        />
        <StatCard
          icon="fas fa-calendar-check"
          title="Active Reservations"
          value={stats.activeReservations}
          color="green"
          description="12 by professors, 6 by students"
        />
        <StatCard
          icon="fas fa-bell"
          title="Pending Demands"
          value={stats.pendingDemands}
          color="yellow"
          description="Requires your approval"
        />
        <StatCard
          icon="fas fa-users"
          title="Total Users"
          value={stats.totalUsers}
          color="red"
          description="42 professors, 114 students"
        />
      </div>
      
      {/* Recent Reservations */}
      <div className="section">
        <div className="section-header">
          <h2>Recent Reservations</h2>
          <Link to="/admin/reservations" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Classroom</th>
                <th>Reserved By</th>
                <th>Role</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentReservations.map(reservation => (
                <tr key={reservation.id}>
                  <td>{reservation.id}</td>
                  <td>{reservation.classroom}</td>
                  <td>{reservation.reservedBy}</td>
                  <td>{reservation.role}</td>
                  <td>{reservation.date}</td>
                  <td>{reservation.time}</td>
                  <td>
                    <span className={`status-badge status-${reservation.status.toLowerCase()}`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-table btn-view">
                        View
                      </button>
                      {reservation.status === 'Pending' && (
                        <>
                          <button 
                            className="btn-table btn-edit"
                            onClick={() => approveReservation(reservation.id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn-table btn-delete"
                            onClick={() => rejectReservation(reservation.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {reservation.status === 'Approved' && (
                        <button 
                          className="btn-table btn-delete"
                          onClick={() => rejectReservation(reservation.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pending Demands */}
      <div className="section">
        <div className="section-header">
          <h2>Pending Approval Demands</h2>
          <Link to="/admin/demands" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Classroom</th>
                <th>Requested By</th>
                <th>Role</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingDemands.map(demand => (
                <tr key={demand.id}>
                  <td>{demand.id}</td>
                  <td>{demand.classroom}</td>
                  <td>{demand.requestedBy}</td>
                  <td>{demand.role}</td>
                  <td>{demand.date}</td>
                  <td>{demand.time}</td>
                  <td>{demand.purpose}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-table btn-view">
                        View
                      </button>
                      <button 
                        className="btn-table btn-edit"
                        onClick={() => approveReservation(demand.id)}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn-table btn-delete"
                        onClick={() => rejectReservation(demand.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Sidebar navigation links
  const navLinks = [
    { to: '/admin', icon: 'fas fa-tachometer-alt', text: 'Dashboard', exact: true },
    { to: '/admin/classrooms', icon: 'fas fa-chalkboard', text: 'Classrooms' },
    { to: '/admin/reservations', icon: 'fas fa-calendar-check', text: 'Reservations' },
    { to: '/admin/demands', icon: 'fas fa-bell', text: 'Demands' },
    { to: '/admin/users', icon: 'fas fa-users', text: 'Users' },
    { to: '/admin/reports', icon: 'fas fa-chart-bar', text: 'Reports' },
    { to: '/admin/settings', icon: 'fas fa-cog', text: 'Settings' },
    { to: '/admin/profile', icon: 'fas fa-user', text: 'Profile' }
  ];

  // Modal for notifications
  const NotificationsModal = () => (
    <div 
      className={`modal-backdrop ${showNotifications ? 'show' : ''}`}
      onClick={() => setShowNotifications(false)}
    >
      <div 
        className="modal-container"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Notifications</h3>
          <button className="close-modal" onClick={() => setShowNotifications(false)}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="notification-item">
            <div className="notification-icon icon-yellow">
              <i className="fas fa-bell"></i>
            </div>
            <div className="notification-content">
              <div className="notification-title">New Reservation Request</div>
              <div className="notification-text">
                John Doe requested Room 203 for Mar 26, 2025
              </div>
              <div className="notification-time">5 minutes ago</div>
            </div>
          </div>
          <div className="notification-item">
            <div className="notification-icon icon-red">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <div className="notification-content">
              <div className="notification-title">Reservation Cancelled</div>
              <div className="notification-text">
                Professor Wilson cancelled Room 101 for Mar 24, 2025
              </div>
              <div className="notification-time">2 hours ago</div>
            </div>
          </div>
          <div className="notification-item">
            <div className="notification-icon icon-blue">
              <i className="fas fa-user"></i>
            </div>
            <div className="notification-content">
              <div className="notification-title">New User Registration</div>
              <div className="notification-text">
                Jane Smith registered as a Student
              </div>
              <div className="notification-time">Yesterday</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <SideNav 
        title="CampusRoom"
        logoSrc="/images/logo.png"
        navLinks={navLinks}
        onLogout={handleLogout}
        currentUser={currentUser}
        userRole="Admin"
      />
      
      <div className="content-wrapper">
        <div className="header">
          <h1>Admin Dashboard</h1>
          <div className="top-bar-actions">
            <button 
              className="action-button notification-badge" 
              onClick={() => setShowNotifications(true)}
            >
              <i className="fas fa-bell"></i>
            </button>
            <button className="action-button">
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
        
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reservations" element={<ReservationsList reservations={recentReservations} />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/classrooms" element={<AdminClassrooms />} />
          <Route path="/demands" element={<AdmineDemands />}
           />
           <Route path="/settings" element={<AdminSettings />} />
          <Route path="/reports" element={<AdminReports />} />
          <Route path="/profile" element={<Profile />} /> {/* Autres routes... */}
        </Routes>
      </div>
      
      {showNotifications && <NotificationsModal />}
    </div>
  );
};

export default AdminDashboard;