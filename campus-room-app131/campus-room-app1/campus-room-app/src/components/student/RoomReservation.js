import React, { useState, useEffect } from 'react';
import '../../styles/dashboard.css';
import API from '../../api';
import ReservationEmailService from '../../services/ReservationEmailService';
import { useAuth } from '../../contexts/AuthContext'; // Import the auth context

function StudyRoomReservation({ fullPage = false }) {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    notes: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [allStudyRooms, setAllStudyRooms] = useState([]);
  const [selectedStudyRoom, setSelectedStudyRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'search'
  const [fetchError, setFetchError] = useState(null);
  const { currentUser } = useAuth(); // Get current user for authentication status

  // Load all study rooms when component mounts
  useEffect(() => {
    fetchAllStudyRooms();
  }, []);

  // Function to fetch all study rooms using the API service
  const fetchAllStudyRooms = async () => {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      // Try multiple possible endpoints in case one fails
      let response;
      let studyRoomsData = [];
      let error = null;
      
      // First try: studentAPI service
      try {
        response = await API.studentAPI.getStudyRooms();
        studyRoomsData = response.data;
        console.log('Successfully fetched study rooms from student API');
      } catch (err) {
        console.error('Error using student API endpoint:', err);
        error = err;
        
        // Second try: general rooms endpoint
        try {
          response = await API.get('/api/rooms/study-rooms', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          studyRoomsData = response.data;
          console.log('Successfully fetched study rooms from general API');
        } catch (secondErr) {
          console.error('Error using general rooms endpoint:', secondErr);
          error = secondErr;
          
          // Third try: public endpoint as last resort
          try {
            response = await API.get('/api/rooms/public-studyrooms');
            studyRoomsData = response.data;
            console.log('Successfully fetched study rooms from public API');
          } catch (thirdErr) {
            console.error('Error using public endpoint:', thirdErr);
            throw thirdErr; // If all API attempts fail, throw the last error
          }
        }
      }
      
      console.log('Study rooms data fetched:', studyRoomsData);
      
      // If we made it here, we have some data
      if (studyRoomsData && Array.isArray(studyRoomsData)) {
        setAllStudyRooms(studyRoomsData);
        
        if (studyRoomsData.length === 0) {
          setMessage({ 
            text: 'Aucune salle d\'étude n\'est disponible actuellement.',
            type: 'warning' 
          });
        }
      } else {
        // Handle case when the data is not an array
        console.error('Received invalid data format:', studyRoomsData);
        throw new Error('Invalid data format received');
      }
      
    } catch (error) {
      console.error('Error fetching study rooms:', error);
      setFetchError(error.message || 'Une erreur est survenue lors du chargement des salles d\'étude');
      setMessage({ 
        text: 'Une erreur est survenue lors du chargement des salles d\'étude',
        type: 'error' 
      });
      
      // Fall back to mock data if everything fails
      const mockStudyRooms = [
        {
          id: 'SR001',
          name: 'Study Room 101',
          type: 'Group Study',
          capacity: 8,
          features: ['Whiteboard', 'Projector', 'Power Outlets'],
          availableTimes: '8AM - 9PM',
          image: '/images/study-room-default.jpg'
        },
        {
          id: 'SR002',
          name: 'Quiet Room 202',
          type: 'Individual Study',
          capacity: 4,
          features: ['Silent Area', 'Desk Lamps', 'Power Outlets'],
          availableTimes: '8AM - 10PM',
          image: '/images/study-room-default.jpg'
        },
        {
          id: 'SR003',
          name: 'Library Study Space',
          type: 'Open Area',
          capacity: 12,
          features: ['Large Tables', 'Natural Lighting', 'WiFi'],
          availableTimes: '9AM - 8PM',
          image: '/images/study-room-default.jpg'
        }
      ];
      
      setAllStudyRooms(mockStudyRooms);
      console.log('Using mock data due to API failure');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    setSearchResults([]);
    setSelectedStudyRoom(null);
    setSearchPerformed(true);
    setViewMode('search');

    try {
      // Validate inputs
      if (!formData.date || !formData.startTime || !formData.endTime) {
        setMessage({ text: 'Veuillez remplir tous les champs obligatoires', type: 'error' });
        setIsLoading(false);
        return;
      }

      // Create search request object
      const searchRequest = {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime
      };
      
      console.log('Searching available study rooms with request:', searchRequest);
      
      // For demo purposes, we'll filter the already loaded study rooms
      // In a real app, this would be a server-side API call
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter the rooms (in real app, this would be on server)
      const filteredRooms = allStudyRooms.filter(room => {
        // Simple filter - in real app this would be based on actual availability
        return true; // Return all rooms for now
      });
      
      setSearchResults(filteredRooms);
      
      if (filteredRooms.length === 0) {
        setMessage({ text: 'Aucune salle d\'étude disponible ne correspond à vos critères', type: 'warning' });
      } else {
        setMessage({ text: `${filteredRooms.length} salles d'étude disponibles trouvées`, type: 'success' });
      }
    } catch (error) {
      console.error('Error searching study rooms:', error);
      setMessage({ text: 'Une erreur est survenue lors de la recherche: ' + (error.response?.data?.message || error.message), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStudyRoom = (studyRoom) => {
    setSelectedStudyRoom(studyRoom);
  };

  const handleSubmitReservation = async () => {
    if (!selectedStudyRoom) {
      setMessage({ text: 'Veuillez sélectionner une salle d\'étude', type: 'error' });
      return;
    }

    if (!formData.purpose) {
      setMessage({ text: 'Veuillez indiquer le motif de la réservation', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Verify token is present
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setMessage({ text: 'Vous devez être connecté pour effectuer cette action', type: 'error' });
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      // Create the request object in the format expected by the backend
      const requestBody = {
        roomId: selectedStudyRoom.id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        notes: formData.notes || ""
      };

      console.log('Sending study room reservation request:', requestBody);
      
      // Use the API service - now fixed with proper studentAPI implementation
      const response = await API.studentAPI.requestStudyRoomReservation(selectedStudyRoom.id, {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        notes: formData.notes || ""
      });
      
      const data = response.data;
      console.log('Reservation success response:', data);
      
      // Send email notification to admin
      try {
        const reservationData = {
          id: data.id || 'NEW_REQUEST',
          room: selectedStudyRoom.name,
          reservedBy: currentUser?.name || 'Student',
          role: 'STUDENT',
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          purpose: formData.purpose,
          notes: formData.notes || "",
          userEmail: currentUser?.email || ''
        };
        
        await ReservationEmailService.notifyAdminAboutNewRequest(reservationData);
        console.log('Admin notification email sent successfully');
      } catch (emailError) {
        console.error('Error sending admin notification email:', emailError);
        // Continue process even if email fails
      }

      // Reset form and show success message
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        notes: ''
      });
      setSearchResults([]);
      setSelectedStudyRoom(null);
      setSearchPerformed(false);
      setViewMode('all');
      setMessage({ 
        text: 'Votre demande de réservation de salle d\'étude a été soumise avec succès et est en attente d\'approbation. Un email de confirmation vous sera envoyé une fois la demande traitée.',
        type: 'success' 
      });
    } catch (error) {
      console.error('Error submitting reservation:', error);
      
      if (error.response && error.response.status === 401) {
        // The interceptor will handle the redirect
        setMessage({ 
          text: 'Votre session a expiré. Vous allez être redirigé vers la page de connexion...', 
          type: 'error' 
        });
      } else {
        setMessage({ 
          text: error.response?.data?.message || error.message || 'Une erreur est survenue lors de la soumission de la demande',
          type: 'error' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Functions to change view
  const showAllStudyRooms = () => {
    setViewMode('all');
    setSearchPerformed(false);
    setSelectedStudyRoom(null);
  };

  const showSearchForm = () => {
    setViewMode('search');
  };

  // Function to refresh study rooms
  const handleRefresh = () => {
    fetchAllStudyRooms();
  };

  return (
    <div className={fullPage ? "main-content" : "reservation-form-container"}>
      {fullPage && (
        <div className="section-header">
          <h2>Réserver une salle d'étude</h2>
          <p>Recherchez et réservez une salle d'étude adaptée à vos besoins</p>
        </div>
      )}
      
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="view-toggle">
        <button 
          className={`tab-button ${viewMode === 'all' ? 'active' : ''}`}
          onClick={showAllStudyRooms}
        >
          Toutes les salles d'étude
        </button>
        <button 
          className={`tab-button ${viewMode === 'search' ? 'active' : ''}`}
          onClick={showSearchForm}
        >
          Recherche par horaire
        </button>
      </div>
      
      {viewMode === 'search' ? (
        <>
          <form id="reserve-studyroom-form" onSubmit={handleSearch}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reservation-date">Date <span className="required">*</span></label>
                <input 
                  type="date" 
                  id="reservation-date" 
                  name="date" 
                  value={formData.date}
                  onChange={handleChange}
                  required 
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label htmlFor="start-time">Heure de début <span className="required">*</span></label>
                <input 
                  type="time" 
                  id="start-time" 
                  name="startTime" 
                  value={formData.startTime}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="end-time">Heure de fin <span className="required">*</span></label>
                <input 
                  type="time" 
                  id="end-time" 
                  name="endTime" 
                  value={formData.endTime}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Recherche en cours...' : 'Rechercher des salles d\'étude disponibles'}
            </button>
          </form>
          
          {searchPerformed && (
            <div className="search-results-container">
              <h3>Salles d'étude disponibles</h3>
              
              {searchResults.length === 0 ? (
                <p>Aucune salle d'étude disponible ne correspond à vos critères. Veuillez modifier vos critères de recherche.</p>
              ) : (
                <div className="study-room-grid classroom-grid">
                  {searchResults.map(studyRoom => (
                    <div 
                      key={studyRoom.id} 
                      className={`study-room-card ${selectedStudyRoom && selectedStudyRoom.id === studyRoom.id ? 'selected' : ''}`}
                      onClick={() => handleSelectStudyRoom(studyRoom)}
                    >
                      <div className="study-room-image">
                        <img 
                          src={studyRoom.image || '/images/study-room-default.jpg'} 
                          alt={studyRoom.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/study-room-default.jpg';
                          }}
                        />
                      </div>
                      <h4>{studyRoom.name}</h4>
                      <p><strong>Type:</strong> {studyRoom.type}</p>
                      <p><strong>Capacité:</strong> {studyRoom.capacity} personnes</p>
                      {studyRoom.features && studyRoom.features.length > 0 && (
                        <div className="features">
                          <p><strong>Équipements:</strong></p>
                          <ul>
                            {studyRoom.features.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {studyRoom.availableTimes && (
                        <p><strong>Heures d'ouverture:</strong> {studyRoom.availableTimes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="all-study-rooms-container">
          <h3>
            Toutes les salles d'étude disponibles
            <button onClick={handleRefresh} className="refresh-button" disabled={isLoading}>
              {isLoading ? 'Chargement...' : '🔄 Rafraîchir'}
            </button>
          </h3>
          
          {isLoading ? (
            <p>Chargement des salles d'étude...</p>
          ) : allStudyRooms.length === 0 ? (
            <div>
              <p>Aucune salle d'étude disponible actuellement.</p>
              {fetchError && <p style={{color: 'red'}}>Erreur: {fetchError}</p>}
              <button onClick={handleRefresh} className="btn-secondary">Réessayer</button>
            </div>
          ) : (
            <div className="study-room-grid classroom-grid">
              {allStudyRooms.map(studyRoom => (
                <div 
                  key={studyRoom.id} 
                  className={`study-room-card ${selectedStudyRoom && selectedStudyRoom.id === studyRoom.id ? 'selected' : ''}`}
                  onClick={() => handleSelectStudyRoom(studyRoom)}
                >
                  <div className="study-room-image">
                    <img 
                      src={studyRoom.image || '/images/study-room-default.jpg'} 
                      alt={studyRoom.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/study-room-default.jpg';
                      }}
                    />
                  </div>
                  <h4>{studyRoom.name}</h4>
                  <p><strong>Type:</strong> {studyRoom.type}</p>
                  <p><strong>Capacité:</strong> {studyRoom.capacity} personnes</p>
                  {studyRoom.features && studyRoom.features.length > 0 && (
                    <div className="features">
                      <p><strong>Équipements:</strong></p>
                      <ul>
                        {studyRoom.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {studyRoom.availableTimes && (
                    <p><strong>Heures d'ouverture:</strong> {studyRoom.availableTimes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {selectedStudyRoom && (
        <div className="reservation-details-container">
          <h3>Finaliser la réservation</h3>
          <div className="selected-study-room-info">
            <div className="selected-study-room-image">
              <img 
                src={selectedStudyRoom.image || '/images/study-room-default.jpg'} 
                alt={selectedStudyRoom.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/study-room-default.jpg';
                }}
              />
            </div>
            <h4>Salle d'étude sélectionnée: {selectedStudyRoom.name}</h4>
            <p>Type: {selectedStudyRoom.type} | Capacité: {selectedStudyRoom.capacity} personnes</p>
            {selectedStudyRoom.availableTimes && (
              <p>Heures d'ouverture: {selectedStudyRoom.availableTimes}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="reservation-date">Date <span className="required">*</span></label>
            <input 
              type="date" 
              id="reservation-date" 
              name="date" 
              value={formData.date}
              onChange={handleChange}
              required 
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start-time">Heure de début <span className="required">*</span></label>
              <input 
                type="time" 
                id="start-time" 
                name="startTime" 
                value={formData.startTime}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="end-time">Heure de fin <span className="required">*</span></label>
              <input 
                type="time" 
                id="end-time" 
                name="endTime" 
                value={formData.endTime}
                onChange={handleChange}
                required 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="purpose">Motif de la réservation <span className="required">*</span></label>
            <input 
              type="text" 
              id="purpose" 
              name="purpose" 
              placeholder="ex: Étude en groupe, Révisions, Travail personnel..." 
              value={formData.purpose}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="additional-notes">Notes supplémentaires</label>
            <textarea 
              id="additional-notes" 
              name="notes" 
              rows="3"
              placeholder="Informations complémentaires..."
              value={formData.notes}
              onChange={handleChange}
            ></textarea>
          </div>
          
          <div className="form-info-box">
            <p><strong>Note:</strong> Une fois la demande soumise, un administrateur examinera votre demande. 
            Vous recevrez une notification par email dès que votre demande sera approuvée ou refusée.</p>
          </div>
          
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleSubmitReservation}
            disabled={isLoading || !formData.purpose || !formData.date || !formData.startTime || !formData.endTime}
          >
            {isLoading ? 'Soumission en cours...' : 'Soumettre la demande de réservation'}
          </button>
        </div>
      )}
    </div>
  );
}

export default StudyRoomReservation;