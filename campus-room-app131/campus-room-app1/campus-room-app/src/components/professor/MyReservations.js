import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/dashboard.css';

const MyReservations = () => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');

  // Initialize state with localStorage on component mount
  useEffect(() => {
    const storedReservations = localStorage.getItem('professorReservations');
    if (storedReservations) {
      const parsedReservations = JSON.parse(storedReservations);
      setReservations(parsedReservations);
      setFilteredReservations(parsedReservations);
    }
  }, []);

  // Apply filters, search, and sort whenever their states change
  useEffect(() => {
    let result = [...reservations];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status.toLowerCase() === filterStatus.toLowerCase());
    }
    
    // Apply search
    if (searchTerm) {
      result = result.filter(r => 
        r.classroom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.date.includes(searchTerm)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'classroom':
          comparison = a.classroom.localeCompare(b.classroom);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredReservations(result);
  }, [reservations, filterStatus, searchTerm, sortBy, sortDirection]);

  const viewReservation = (id) => {
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
      alert(`Viewing reservation: ${reservation.classroom} on ${reservation.date} at ${reservation.time} for ${reservation.purpose}`);
    }
  };

  const cancelReservation = (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      const updatedReservations = reservations.filter(r => r.id !== id);
      setReservations(updatedReservations);
      
      // Update localStorage
      localStorage.setItem('professorReservations', JSON.stringify(updatedReservations));
      
      alert('Reservation cancelled successfully.');
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Get status counts for the filter buttons
  const statusCounts = {
    all: reservations.length,
    approved: reservations.filter(r => r.status.toLowerCase() === 'approved').length,
    pending: reservations.filter(r => r.status.toLowerCase() === 'pending').length,
    rejected: reservations.filter(r => r.status.toLowerCase() === 'rejected').length,
  };

  return (
    <div className="main-content">
      <div className="section-header">
        <h1>My Reservations</h1>
        <p>Manage all your classroom reservations</p>
      </div>
      
      {/* Filters and Search */}
      <div className="filters-container">
        <div className="status-filters">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('all')}
          >
            All <span className="count">{statusCounts.all}</span>
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'approved' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('approved')}
          >
            Approved <span className="count">{statusCounts.approved}</span>
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('pending')}
          >
            Pending <span className="count">{statusCounts.pending}</span>
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('rejected')}
          >
            Rejected <span className="count">{statusCounts.rejected}</span>
          </button>
        </div>
        
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by classroom, purpose, or date..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <i className="fas fa-search search-icon"></i>
        </div>
      </div>
      
      {/* Reservations Table */}
      <div className="data-table-container">
        {filteredReservations.length === 0 ? (
          <div className="no-results">
            <i className="fas fa-calendar-times no-results-icon"></i>
            <h3>No Reservations Found</h3>
            <p>
              {searchTerm 
                ? "No reservations match your search criteria." 
                : filterStatus !== 'all' 
                  ? `You don't have any ${filterStatus} reservations.` 
                  : "You haven't made any classroom reservations yet."}
            </p>
            {reservations.length === 0 && (
              <button className="btn-primary">Make Your First Reservation</button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('classroom')} className="sortable-header">
                  Classroom
                  {sortBy === 'classroom' && (
                    <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`}></i>
                  )}
                </th>
                <th onClick={() => handleSort('date')} className="sortable-header">
                  Date
                  {sortBy === 'date' && (
                    <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`}></i>
                  )}
                </th>
                <th>Time</th>
                <th>Purpose</th>
                <th onClick={() => handleSort('status')} className="sortable-header">
                  Status
                  {sortBy === 'status' && (
                    <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`}></i>
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map(reservation => (
                <tr key={reservation.id}>
                  <td>{reservation.classroom}</td>
                  <td>{reservation.date}</td>
                  <td>{reservation.time}</td>
                  <td>{reservation.purpose}</td>
                  <td>
                    <span className={`status-badge status-${reservation.status.toLowerCase()}`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn-table btn-view"
                        onClick={() => viewReservation(reservation.id)}
                        title="View details"
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                      {reservation.status === 'Pending' && (
                        <button 
                          className="btn-table btn-edit"
                          title="Edit reservation"
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                      )}
                      <button 
                        className="btn-table btn-delete"
                        onClick={() => cancelReservation(reservation.id)}
                        title="Cancel reservation"
                      >
                        <i className="fas fa-times"></i> Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination - for future implementation */}
      {filteredReservations.length > 0 && (
        <div className="pagination">
          <button className="pagination-btn" disabled>
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <div className="pagination-info">
            Page 1 of 1 ({filteredReservations.length} items)
          </div>
          <button className="pagination-btn" disabled>
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default MyReservations;