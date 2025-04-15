import React, { useState } from 'react';
import '../../styles/dashboard.css';

const ReservationsList = ({ reservations = [] }) => {
  const [filteredReservations, setFilteredReservations] = useState(reservations);
  const [filterCriteria, setFilterCriteria] = useState({
    status: '',
    role: '',
    date: ''
  });

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    // Filter based on criteria
    let filtered = [...reservations];
    
    if (filterCriteria.status) {
      filtered = filtered.filter(
        reservation => reservation.status.toLowerCase() === filterCriteria.status.toLowerCase()
      );
    }
    
    if (filterCriteria.role) {
      filtered = filtered.filter(
        reservation => reservation.role.toLowerCase() === filterCriteria.role.toLowerCase()
      );
    }
    
    if (filterCriteria.date) {
      // In a real app, you would compare dates more effectively
      filtered = filtered.filter(
        reservation => reservation.date.includes(filterCriteria.date)
      );
    }
    
    setFilteredReservations(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterCriteria({
      status: '',
      role: '',
      date: ''
    });
    setFilteredReservations(reservations);
  };

  // Handle reservation actions (these would call API endpoints in a real app)
  const viewReservation = (id) => {
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
      alert(`Viewing details for reservation ${id}`);
    }
  };

  const approveReservation = (id) => {
    alert(`Reservation ${id} approved`);
  };

  const rejectReservation = (id) => {
    if (window.confirm('Are you sure you want to reject this reservation?')) {
      alert(`Reservation ${id} rejected`);
    }
  };

  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>All Reservations</h2>
        </div>
        
        <div className="filter-container">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select 
              id="status" 
              name="status"
              value={filterCriteria.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="role">User Role</label>
            <select 
              id="role" 
              name="role"
              value={filterCriteria.role}
              onChange={handleFilterChange}
            >
              <option value="">All Roles</option>
              <option value="professor">Professor</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="date">Month</label>
            <select 
              id="date" 
              name="date"
              value={filterCriteria.date}
              onChange={handleFilterChange}
            >
              <option value="">All Dates</option>
              <option value="Jan">January</option>
              <option value="Feb">February</option>
              <option value="Mar">March</option>
              <option value="Apr">April</option>
              <option value="May">May</option>
              <option value="Jun">June</option>
              <option value="Jul">July</option>
              <option value="Aug">August</option>
              <option value="Sep">September</option>
              <option value="Oct">October</option>
              <option value="Nov">November</option>
              <option value="Dec">December</option>
            </select>
          </div>
          <button 
            className="btn-primary"
            onClick={applyFilters}
          >
            Apply Filters
          </button>
          <button 
            className="btn-secondary"
            onClick={resetFilters}
          >
            Reset
          </button>
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
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">No reservations found</td>
                </tr>
              ) : (
                filteredReservations.map(reservation => (
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
                        <button 
                          className="btn-table btn-view"
                          onClick={() => viewReservation(reservation.id)}
                        >
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReservationsList;