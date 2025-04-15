import React, { useState, useEffect } from 'react';
import '../../styles/dashboard.css';
import API from '../../api';

const ClassroomReservation = ({ fullPage = false }) => {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    classType: '',
    capacity: '',
    purpose: '',
    notes: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [allClassrooms, setAllClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all' ou 'search'
  const [fetchError, setFetchError] = useState(null);

  // Charger toutes les salles au chargement du composant
  useEffect(() => {
    fetchAllClassrooms();
  }, []);

  // Fonction pour récupérer toutes les salles - utilisant l'API service
  const fetchAllClassrooms = async () => {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      // Try multiple possible endpoints in case one fails
      let response;
      try {
        // Primary endpoint
        response = await API.roomAPI.getAllClassrooms();
      } catch (err) {
        console.error('Error using primary endpoint:', err);
        // Direct fallback with fetch
        const fetchResponse = await fetch('/api/classrooms');
        
        if (!fetchResponse.ok) {
          throw new Error(`Failed to fetch from direct endpoint: ${fetchResponse.status}`);
        }
        
        response = { 
          data: await fetchResponse.json() 
        };
      }
      
      const data = response.data;
      console.log('Classrooms data fetched:', data);
      setAllClassrooms(data);
      
      if (data.length === 0) {
        setMessage({ 
          text: 'Aucune salle n\'est disponible actuellement.', 
          type: 'warning' 
        });
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      setFetchError(error.message || 'Une erreur est survenue lors du chargement des salles');
      setMessage({ 
        text: 'Une erreur est survenue lors du chargement des salles', 
        type: 'error' 
      });
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
    setSelectedClassroom(null);
    setSearchPerformed(true);
    setViewMode('search');

    try {
      // Valider les entrées
      if (!formData.date || !formData.startTime || !formData.endTime || !formData.capacity) {
        setMessage({ text: 'Veuillez remplir tous les champs obligatoires', type: 'error' });
        setIsLoading(false);
        return;
      }

      // Convertir la capacité en nombre
      const capacityNum = parseInt(formData.capacity, 10);
      if (isNaN(capacityNum) || capacityNum <= 0) {
        setMessage({ text: 'La capacité doit être un nombre positif', type: 'error' });
        setIsLoading(false);
        return;
      }

      // Créer un objet de requête pour la recherche
      const searchRequest = {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        classType: formData.classType || '',
        capacity: capacityNum
      };
      
      console.log('Searching available classrooms with request:', searchRequest);
      
      // Use the API service with fallback
      let response;
      try {
        response = await API.professorAPI.searchAvailableClassrooms(searchRequest);
      } catch (err) {
        console.error('Error using API service for search:', err);
        
        // If it's an authentication error, let the interceptor handle it
        if (err.response && err.response.status === 401) {
          throw err;
        }
        
        // Direct fallback with fetch
        const fetchResponse = await fetch('/api/professor/reservations/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(searchRequest)
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`Failed to search classrooms: ${fetchResponse.status}`);
        }
        
        response = { 
          data: await fetchResponse.json() 
        };
      }
      
      const data = response.data;
      console.log('Search results:', data);
      
      setSearchResults(data);
      
      if (data.length === 0) {
        setMessage({ text: 'Aucune salle disponible ne correspond à vos critères', type: 'warning' });
      } else {
        setMessage({ text: `${data.length} salles disponibles trouvées`, type: 'success' });
      }
    } catch (error) {
      console.error('Error searching classrooms:', error);
      setMessage({ text: 'Une erreur est survenue lors de la recherche: ' + (error.response?.data?.message || error.message), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClassroom = (classroom) => {
    setSelectedClassroom(classroom);
  };

  const handleSubmitReservation = async () => {
    if (!selectedClassroom) {
      setMessage({ text: 'Veuillez sélectionner une salle', type: 'error' });
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

      // Créer l'objet de requête dans le format attendu par le backend
      const requestBody = {
        classroomId: selectedClassroom.id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        notes: formData.notes || "", // Utilisez une chaîne vide si notes est null/undefined
        classType: formData.classType || selectedClassroom.type,
        capacity: parseInt(formData.capacity, 10) || selectedClassroom.capacity
      };

      console.log('Sending reservation request:', requestBody);
      
      // Use the API service
      const response = await API.professorAPI.requestReservation(requestBody);
      
      const data = response.data;
      console.log('Reservation success response:', data);

      // Réinitialiser le formulaire et afficher un message de succès
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        classType: '',
        capacity: '',
        purpose: '',
        notes: ''
      });
      setSearchResults([]);
      setSelectedClassroom(null);
      setSearchPerformed(false);
      setViewMode('all');
      setMessage({ 
        text: 'Votre demande de réservation a été soumise avec succès et est en attente d\'approbation. Un email de confirmation vous sera envoyé une fois la demande traitée.', 
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

  // Fonctions pour changer la vue
  const showAllClassrooms = () => {
    setViewMode('all');
    setSearchPerformed(false);
    setSelectedClassroom(null);
  };

  const showSearchForm = () => {
    setViewMode('search');
  };

  // Fonction pour rafraîchir les salles
  const handleRefresh = () => {
    fetchAllClassrooms();
  };

  // Rendu du formulaire de recherche
  const renderSearchForm = () => {
    return (
      <form id="reserve-classroom-form" onSubmit={handleSearch}>
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
              min={new Date().toISOString().split('T')[0]} // Empêcher les dates passées
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
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="class-type">Type de salle</label>
            <select 
              id="class-type" 
              name="classType" 
              value={formData.classType}
              onChange={handleChange}
            >
              <option value="">Tous les types</option>
              <option value="Lecture Hall">Amphithéâtre</option>
              <option value="Classroom">Salle de classe</option>
              <option value="Computer Lab">Salle informatique</option>
              <option value="Conference Room">Salle de conférence</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="capacity-needed">Capacité minimale <span className="required">*</span></label>
            <input 
              type="number" 
              id="capacity-needed" 
              name="capacity" 
              min="1" 
              value={formData.capacity}
              onChange={handleChange}
              required 
            />
          </div>
        </div>
        
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Recherche en cours...' : 'Rechercher des salles disponibles'}
        </button>
      </form>
    );
  };

  const renderSearchResults = () => {
    if (!searchPerformed) return null;
    
    return (
      <div className="search-results-container">
        <h3>Salles disponibles</h3>
        
        {searchResults.length === 0 ? (
          <p>Aucune salle disponible ne correspond à vos critères. Veuillez modifier vos critères de recherche.</p>
        ) : (
          <div className="classroom-grid">
            {searchResults.map(classroom => (
              <div 
                key={classroom.id} 
                className={`classroom-card ${selectedClassroom && selectedClassroom.id === classroom.id ? 'selected' : ''}`}
                onClick={() => handleSelectClassroom(classroom)}
              >
                {/* Ajout de l'image de la salle */}
                <div className="classroom-image">
                  <img 
                    src={classroom.image || '/images/classroom-default.jpg'} 
                    alt={classroom.roomNumber}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/classroom-default.jpg';
                    }}
                  />
                </div>
                <h4>{classroom.roomNumber}</h4>
                <p><strong>Type:</strong> {classroom.type}</p>
                <p><strong>Capacité:</strong> {classroom.capacity} personnes</p>
                {classroom.features && classroom.features.length > 0 && (
                  <div className="features">
                    <p><strong>Équipements:</strong></p>
                    <ul>
                      {classroom.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAllClassrooms = () => {
    return (
      <div className="all-classrooms-container">
        <h3>
          Toutes les salles disponibles
          <button onClick={handleRefresh} className="refresh-button" disabled={isLoading}>
            {isLoading ? 'Chargement...' : '🔄 Rafraîchir'}
          </button>
        </h3>
        
        {isLoading ? (
          <p>Chargement des salles...</p>
        ) : allClassrooms.length === 0 ? (
          <div>
            <p>Aucune salle disponible actuellement.</p>
            {fetchError && <p style={{color: 'red'}}>Erreur: {fetchError}</p>}
            <button onClick={handleRefresh} className="btn-secondary">Réessayer</button>
          </div>
        ) : (
          <div className="classroom-grid">
            {allClassrooms.map(classroom => (
              <div 
                key={classroom.id} 
                className={`classroom-card ${selectedClassroom && selectedClassroom.id === classroom.id ? 'selected' : ''}`}
                onClick={() => handleSelectClassroom(classroom)}
              >
                {/* Ajout de l'image de la salle */}
                <div className="classroom-image">
                  <img 
                    src={classroom.image || '/images/classroom-default.jpg'} 
                    alt={classroom.roomNumber}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/classroom-default.jpg';
                    }}
                  />
                </div>
                <h4>{classroom.roomNumber}</h4>
                <p><strong>Type:</strong> {classroom.type}</p>
                <p><strong>Capacité:</strong> {classroom.capacity} personnes</p>
                {classroom.features && classroom.features.length > 0 && (
                  <div className="features">
                    <p><strong>Équipements:</strong></p>
                    <ul>
                      {classroom.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderReservationForm = () => {
    if (!selectedClassroom) return null;
    
    return (
      <div className="reservation-details-container">
        <h3>Finaliser la réservation</h3>
        <div className="selected-classroom-info">
          {/* Ajout de l'image de la salle sélectionnée */}
          <div className="selected-classroom-image">
            <img 
              src={selectedClassroom.image || '/images/classroom-default.jpg'} 
              alt={selectedClassroom.roomNumber}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/classroom-default.jpg';
              }}
            />
          </div>
          <h4>Salle sélectionnée: {selectedClassroom.roomNumber}</h4>
          <p>Type: {selectedClassroom.type} | Capacité: {selectedClassroom.capacity} personnes</p>
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
            min={new Date().toISOString().split('T')[0]} // Empêcher les dates passées
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
            placeholder="ex: Cours, TP, Réunion, Examen..." 
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
    );
  };

  return (
    <div className={fullPage ? "main-content" : "reservation-form-container"}>
      {fullPage && (
        <div className="section-header">
          <h2>Réserver une salle</h2>
          <p>Recherchez et réservez une salle de classe adaptée à vos besoins</p>
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
          onClick={showAllClassrooms}
        >
          Toutes les salles
        </button>
        <button 
          className={`tab-button ${viewMode === 'search' ? 'active' : ''}`} 
          onClick={showSearchForm}
        >
          Recherche par critères
        </button>
      </div>
      
      {viewMode === 'search' ? (
        <>
          {renderSearchForm()}
          {renderSearchResults()}
        </>
      ) : (
        renderAllClassrooms()
      )}
      
      {selectedClassroom && renderReservationForm()}
    </div>
  );
};

export default ClassroomReservation;