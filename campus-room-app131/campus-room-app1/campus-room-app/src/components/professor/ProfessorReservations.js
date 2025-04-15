import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Table from '../common/Table';
import Modal from '../common/Modal';
import '../../styles/dashboard.css';

const ProfessorReservations = () => {
  const { currentUser } = useAuth();
  const [myReservations, setMyReservations] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  
  // Load reservations from localStorage on component mount
  useEffect(() => {
    const loadReservations = () => {
      const storedReservations = localStorage.getItem('professorReservations');
      if (storedReservations) {
        const reservations = JSON.parse(storedReservations);
        // Filter for current user if needed
        const userReservations = currentUser 
          ? reservations.filter(r => r.userId === currentUser.email)
          : reservations;
        
        setMyReservations(userReservations);
      }
    };
    
    loadReservations();
  }, [currentUser]);
  
  // Handle view reservation details
  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };
  
  // Handle cancel reservation
  const handleCancelReservation = (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      // Filter out the cancelled reservation
      const updatedReservations = myReservations.filter(r => r.id !== id);
      setMyReservations(updatedReservations);
      
      // Update localStorage
      const allReservations = JSON.parse(localStorage.getItem('professorReservations') || '[]');
      const filteredReservations = allReservations.filter(r => r.id !== id);
      localStorage.setItem('professorReservations', JSON.stringify(filteredReservations));
      
      alert('Reservation cancelled successfully.');
    }
  };
  
  // Define table columns
  const columns = [
    { header: 'Classroom', key: 'classroom' },
    { header: 'Date', key: 'date' },
    { header: 'Time', key: 'time' },
    { header: 'Purpose', key: 'purpose' },
    { 
      header: 'Status', 
      key: 'status',
      render: (status) => (
        <span className={`status-badge status-${status.toLowerCase()}`}>
          {status}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (id, reservation) => (
        <div className="table-actions">
          <button 
            className="btn-table btn-view"
            onClick={() => handleViewReservation(reservation)}
          >
            View
          </button>
          <button 
            className="btn-table btn-delete"
            onClick={() => handleCancelReservation(id)}
          >
            Cancel
          </button>
        </div>
      )
    }
  ];
  
  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>My Reservations</h2>
        </div>
        
        <Table 
          columns={columns}
          data={myReservations}
          emptyMessage="You don't have any reservations yet"
        />
      </div>
      
      {/* Reservation Detail Modal */}
      <Modal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Reservation Details"
      >
        {selectedReservation && (
          <div className="reservation-details">
            <div className="detail-item">
              <span className="detail-label">Reservation ID</span>
              <span className="detail-value">{selectedReservation.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Classroom</span>
              <span className="detail-value">{selectedReservation.classroom}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">{selectedReservation.date}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time</span>
              <span className="detail-value">{selectedReservation.time}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Purpose</span>
              <span className="detail-value">{selectedReservation.purpose}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value">
                <span className={`status-badge status-${selectedReservation.status.toLowerCase()}`}>
                  {selectedReservation.status}
                </span>
              </span>
            </div>
            
            {selectedReservation.status === 'Pending' && (
              <div className="detail-note">
                <p>This reservation is waiting for approval from the administrator.</p>
              </div>
            )}
            
            {selectedReservation.status === 'Approved' && (
              <div className="detail-instructions">
                <h4>Instructions:</h4>
                <ol>
                  <li>Arrive 10 minutes before your scheduled time</li>
                  <li>Use your ID card to access the room</li>
                  <li>Report any issues to facility management</li>
                  <li>Leave the room in a clean condition</li>
                </ol>
              </div>
            )}
            
            <div className="modal-actions">
              {selectedReservation.status !== 'Cancelled' && (
                <button 
                  className="btn-danger"
                  onClick={() => {
                    handleCancelReservation(selectedReservation.id);
                    setShowDetailModal(false);
                  }}
                >
                  Cancel Reservation
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProfessorReservations;