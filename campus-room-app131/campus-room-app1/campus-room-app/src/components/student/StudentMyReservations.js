import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import '../../styles/student-reservation.css';

const StudentMyReservations = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [dateRange, setDateRange] = useState('upcoming');

  // Initialize state with localStorage on component mount
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      try {
        const storedReservations = localStorage.getItem('studentReservations');
        if (storedReservations) {
          const parsedReservations = JSON.parse(storedReservations);
          setReservations(parsedReservations);
          setFilteredReservations(parsedReservations);
        }
      } catch (error) {
        console.error('Error loading reservations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Apply filters, search, and sort whenever their states change
  useEffect(() => {
    let result = [...reservations];
    
    // Apply date range filter
    if (dateRange === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.date) >= today);
    } else if (dateRange === 'past') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.date) < today);
    } else if (dateRange === 'today') {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      result = result.filter(r => r.date === todayString);
    } else if (dateRange === 'thisWeek') {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      result = result.filter(r => {
        const reservationDate = new Date(r.date);
        return reservationDate >= startOfWeek && reservationDate <= endOfWeek;
      });
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status.toLowerCase() === filterStatus.toLowerCase());
    }
    
    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.room.toLowerCase().includes(searchLower) ||
        r.purpose.toLowerCase().includes(searchLower) ||
        r.date.includes(searchLower) ||
        r.time.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'room':
          comparison = a.room.localeCompare(b.room);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'purpose':
          comparison = a.purpose.localeCompare(b.purpose);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredReservations(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [reservations, filterStatus, searchTerm, sortBy, sortDirection, dateRange]);

  // View reservation details
  const viewReservation = (id) => {
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
      setSelectedReservation(reservation);
      setShowViewModal(true);
    }
  };

  // Close view modal
  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedReservation(null);
  };

  // Cancel reservation
  const cancelReservation = (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      const updatedReservations = reservations.filter(r => r.id !== id);
      setReservations(updatedReservations);
      
      // Update localStorage
      localStorage.setItem('studentReservations', JSON.stringify(updatedReservations));
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'notification success';
      notification.innerHTML = '<i class="fas fa-check-circle"></i> Reservation cancelled successfully';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 3000);
      }, 10);
    }
  };

  // Handle sorting when column header is clicked
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

  // Redirect to reservation form
  const goToReserve = () => {
    navigate('/student/reserve');
  };

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calculate pagination range
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReservations.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination controls
  const renderPagination = () => {
    const pageNumbers = [];
    
    // If few pages, show all
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Complex pagination with ellipsis
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Middle
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return (
      <div className="pagination">
        <button 
          className="pagination-btn" 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fas fa-chevron-left"></i> Previous
        </button>
        
        <div className="pagination-numbers">
          {pageNumbers.map((number, index) => (
            number === '...' ? 
              <span key={index} className="pagination-ellipsis">...</span> :
              <button 
                key={index}
                className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                onClick={() => handlePageChange(number)}
              >
                {number}
              </button>
          ))}
        </div>
        
        <button 
          className="pagination-btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  // Get status counts for the filter buttons
  const statusCounts = {
    all: reservations.length,
    approved: reservations.filter(r => r.status.toLowerCase() === 'approved').length,
    pending: reservations.filter(r => r.status.toLowerCase() === 'pending').length,
    rejected: reservations.filter(r => r.status.toLowerCase() === 'rejected').length,
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Calculate days remaining or overdue
  const getDaysRemaining = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reservationDate = new Date(dateString);
    reservationDate.setHours(0, 0, 0, 0);
    
    const timeDiff = reservationDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Tomorrow';
    if (daysDiff === -1) return 'Yesterday';
    if (daysDiff < 0) return `${Math.abs(daysDiff)} days ago`;
    return `in ${daysDiff} days`;
  };
  
  // Get appropriate icon for reservation purpose
  const getPurposeIcon = (purpose) => {
    if (!purpose) return 'fa-question-circle';
    
    const purposeLower = purpose.toLowerCase();
    if (purposeLower.includes('study') && purposeLower.includes('group')) return 'fa-users';
    if (purposeLower.includes('study')) return 'fa-book';
    if (purposeLower.includes('meeting')) return 'fa-handshake';
    if (purposeLower.includes('presentation')) return 'fa-presentation';
    if (purposeLower.includes('project')) return 'fa-project-diagram';
    
    return 'fa-calendar-check';
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="section-header">
        <div>
          <h1>My Study Room Reservations</h1>
          <p>Manage all your study space reservations</p>
        </div>
        <div className="section-actions">
          <button className="btn-primary" onClick={goToReserve}>
            <i className="fas fa-plus"></i> New Reservation
          </button>
        </div>
      </div>
      
      {/* Filters and Search - Enhanced */}
      <div className="filters-container">
        <div className="filter-row">
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
              <i className="fas fa-check-circle"></i> Approved <span className="count">{statusCounts.approved}</span>
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`} 
              onClick={() => setFilterStatus('pending')}
            >
              <i className="fas fa-clock"></i> Pending <span className="count">{statusCounts.pending}</span>
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`} 
              onClick={() => setFilterStatus('rejected')}
            >
              <i className="fas fa-times-circle"></i> Rejected <span className="count">{statusCounts.rejected}</span>
            </button>
          </div>
          
          <div className="date-filters">
            <select 
              className="date-filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>
        
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by room, purpose, date or time..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <i className="fas fa-search search-icon"></i>
          {searchTerm && (
            <button 
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>
      
      {/* Items Per Page Selector */}
      <div className="table-controls">
        <div className="items-per-page">
          <label htmlFor="items-per-page">Show</label>
          <select 
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
        
        <div className="result-count">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReservations.length)} of {filteredReservations.length} reservations
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reservations...</p>
        </div>
      ) : (
        <>
          {/* Reservations Table - Enhanced */}
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
                      : "You haven't made any study room reservations yet."}
                </p>
                {reservations.length === 0 && (
                  <button className="btn-primary" onClick={goToReserve}>
                    <i className="fas fa-plus"></i> Make Your First Reservation
                  </button>
                )}
              </div>
            ) : (
              <div className="responsive-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('room')} className="sortable-header">
                        <div className="th-content">
                          <i className="fas fa-door-open th-icon"></i> Room
                          {sortBy === 'room' && (
                            <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`}></i>
                          )}
                        </div>
                      </th>
                      <th onClick={() => handleSort('date')} className="sortable-header">
                        <div className="th-content">
                          <i className="fas fa-calendar th-icon"></i> Date
                          {sortBy === 'date' && (
                            <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`}></i>
                          )}
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="fas fa-clock th-icon"></i> Time
                        </div>
                      </th>
                      <th onClick={() => handleSort('purpose')} className="sortable-header">
                        <div className="th-content">
                          <i className="fas fa-tasks th-icon"></i> Purpose
                          {sortBy === 'purpose' && (
                            <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`}></i>
                          )}
                        </div>
                      </th>
                      <th onClick={() => handleSort('status')} className="sortable-header">
                        <div className="th-content">
                          <i className="fas fa-info-circle th-icon"></i> Status
                          {sortBy === 'status' && (
                            <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`}></i>
                          )}
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="fas fa-cog th-icon"></i> Actions
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map(reservation => (
                      <tr key={reservation.id} className={`status-row-${reservation.status.toLowerCase()}`}>
                        <td data-label="Room">
                          <div className="cell-content">
                            <div className="cell-main">{reservation.room}</div>
                          </div>
                        </td>
                        <td data-label="Date">
                          <div className="cell-content">
                            <div className="cell-main">{formatDate(reservation.date)}</div>
                            <div className="cell-sub">{getDaysRemaining(reservation.date)}</div>
                          </div>
                        </td>
                        <td data-label="Time">
                          <div className="cell-content">
                            <div className="cell-main">{reservation.time}</div>
                          </div>
                        </td>
                        <td data-label="Purpose">
                          <div className="cell-content">
                            <div className="cell-main">
                              <i className={`fas ${getPurposeIcon(reservation.purpose)} purpose-icon`}></i>
                              {reservation.purpose}
                            </div>
                          </div>
                        </td>
                        <td data-label="Status">
                          <div className="cell-content">
                            <span className={`status-badge status-${reservation.status.toLowerCase()}`}>
                              {reservation.status === 'Approved' && <i className="fas fa-check-circle"></i>}
                              {reservation.status === 'Pending' && <i className="fas fa-clock"></i>}
                              {reservation.status === 'Rejected' && <i className="fas fa-times-circle"></i>}
                              {reservation.status}
                            </span>
                          </div>
                        </td>
                        <td data-label="Actions">
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
                                onClick={() => navigate(`/student/reserve?edit=${reservation.id}`)}
                                title="Edit reservation"
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                            )}
                            {(reservation.status === 'Pending' || reservation.status === 'Approved') && (
                              <button 
                                className="btn-table btn-delete"
                                onClick={() => cancelReservation(reservation.id)}
                                title="Cancel reservation"
                              >
                                <i className="fas fa-times"></i> Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination - Enhanced */}
          {filteredReservations.length > itemsPerPage && renderPagination()}
        </>
      )}
      
      {/* View Modal */}
      {showViewModal && selectedReservation && (
        <div className="modal-backdrop active">
          <div className="modal reservation-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-info-circle"></i> Reservation Details
              </h3>
              <button className="modal-close" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="reservation-details">
                <div className="detail-item">
                  <div className="detail-label"><i className="fas fa-door-open"></i> Room</div>
                  <div className="detail-value">{selectedReservation.room}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label"><i className="fas fa-calendar"></i> Date</div>
                  <div className="detail-value">{formatDate(selectedReservation.date)}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label"><i className="fas fa-clock"></i> Time</div>
                  <div className="detail-value">{selectedReservation.time}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">
                    <i className={`fas ${getPurposeIcon(selectedReservation.purpose)}`}></i> Purpose
                  </div>
                  <div className="detail-value">{selectedReservation.purpose}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label"><i className="fas fa-tag"></i> Status</div>
                  <div className="detail-value">
                    <span className={`status-badge status-${selectedReservation.status.toLowerCase()}`}>
                      {selectedReservation.status === 'Approved' && <i className="fas fa-check-circle"></i>}
                      {selectedReservation.status === 'Pending' && <i className="fas fa-clock"></i>}
                      {selectedReservation.status === 'Rejected' && <i className="fas fa-times-circle"></i>}
                      {selectedReservation.status}
                    </span>
                  </div>
                </div>
                
                {selectedReservation.notes && (
                  <div className="detail-item">
                    <div className="detail-label"><i className="fas fa-comment"></i> Notes</div>
                    <div className="detail-value">{selectedReservation.notes}</div>
                  </div>
                )}
                
                {selectedReservation.status === 'Approved' && (
                  <div className="detail-note success">
                    <div className="detail-note-content">
                      <strong>Room Access Instructions:</strong>
                      <p>You can access the room using your student ID. Please remember to leave the room clean and organized after use.</p>
                    </div>
                  </div>
                )}
                
                {selectedReservation.status === 'Pending' && (
                  <div className="detail-note">
                    <div className="detail-note-content">
                      <strong>Note:</strong>
                      <p>Your reservation is currently pending approval. You will receive an email notification once it has been processed.</p>
                    </div>
                  </div>
                )}
                
                {selectedReservation.status === 'Rejected' && (
                  <div className="detail-note warning">
                    <div className="detail-note-content">
                      <strong>Note:</strong>
                      <p>Your reservation was rejected. This could be due to scheduling conflicts or room availability. Please try reserving another room or time slot.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              {selectedReservation.status === 'Pending' && (
                <button 
                  className="modal-btn btn-secondary"
                  onClick={() => {
                    closeViewModal();
                    navigate(`/student/reserve?edit=${selectedReservation.id}`);
                  }}
                >
                  <i className="fas fa-edit"></i> Edit Reservation
                </button>
              )}
              
              {(selectedReservation.status === 'Pending' || selectedReservation.status === 'Approved') && (
                <button 
                  className="modal-btn btn-danger"
                  onClick={() => {
                    cancelReservation(selectedReservation.id);
                    closeViewModal();
                  }}
                >
                  <i className="fas fa-times"></i> Cancel Reservation
                </button>
              )}
              
              <button className="modal-btn btn-primary" onClick={closeViewModal}>
                <i className="fas fa-check"></i> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMyReservations;