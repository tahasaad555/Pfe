import React, { useState } from 'react';
import '../../styles/dashboard.css';

const ClassSchedule = ({ classes }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredClasses, setFilteredClasses] = useState(classes || []);
  
  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Mock data for week view
  const weekSchedule = {
    'Monday': [
      { id: 'M1', name: 'PHYS 101: Introduction to Physics', time: '9:00 - 10:30 AM', location: 'Room 101', students: 35 },
      { id: 'M2', name: 'PHYS 301: Advanced Mechanics', time: '2:00 - 3:30 PM', location: 'Room 203', students: 22 }
    ],
    'Tuesday': [
      { id: 'T1', name: 'PHYS 201: Electromagnetism', time: '11:00 AM - 12:30 PM', location: 'Lab 305', students: 28 }
    ],
    'Wednesday': [
      { id: 'W1', name: 'PHYS 101: Introduction to Physics', time: '9:00 - 10:30 AM', location: 'Room 101', students: 35 },
      { id: 'W2', name: 'Faculty Meeting', time: '1:00 - 3:00 PM', location: 'Conference Room 105', info: 'Department Planning' }
    ],
    'Thursday': [
      { id: 'Th1', name: 'PHYS 201: Electromagnetism', time: '11:00 AM - 12:30 PM', location: 'Lab 305', students: 28 },
      { id: 'Th2', name: 'Office Hours', time: '2:00 - 4:00 PM', location: 'Office 240', info: 'Student Consultations' }
    ],
    'Friday': [
      { id: 'F1', name: 'PHYS 301: Advanced Mechanics', time: '2:00 - 3:30 PM', location: 'Room 203', students: 22 },
      { id: 'F2', name: 'Research Group Meeting', time: '4:00 - 5:00 PM', location: 'Lab 310', info: 'Project Updates' }
    ],
    'Saturday': [],
    'Sunday': []
  };
  
  // Filter by date or show week view
  const handleFilterChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    // In a real app, you would fetch data based on the selected date
    // For now, we'll just use our mock data
    if (date) {
      // Convert date to day of week
      const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      setFilteredClasses(weekSchedule[day] || []);
    } else {
      // Reset to default classes (today's classes)
      setFilteredClasses(classes);
    }
  };
  
  // Toggle view between day and week
  const [viewMode, setViewMode] = useState('day');
  
  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>Class Schedule</h2>
          <div className="view-toggles">
            <button 
              className={`btn ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('day')}
            >
              Day View
            </button>
            <button 
              className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('week')}
              style={{ marginLeft: '0.5rem' }}
            >
              Week View
            </button>
          </div>
        </div>
        
        {viewMode === 'day' ? (
          <>
            <div className="filter-container">
              <div className="form-group">
                <label htmlFor="schedule-date">Select Date</label>
                <input 
                  type="date" 
                  id="schedule-date" 
                  value={selectedDate}
                  onChange={handleFilterChange}
                />
              </div>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setSelectedDate('');
                  setFilteredClasses(classes);
                }}
              >
                Reset
              </button>
            </div>
            
            <div className="today-classes">
              {filteredClasses.length === 0 ? (
                <div className="no-results">
                  <p>No classes scheduled for the selected date.</p>
                </div>
              ) : (
                filteredClasses.map(classItem => (
                  <div className="class-card" key={classItem.id}>
                    <div className="class-time">{classItem.time}</div>
                    <div className="class-details">
                      <h3 className="class-name">{classItem.name}</h3>
                      <p className="class-location">
                        <i className="fas fa-map-marker-alt"></i> {classItem.location}
                      </p>
                      {classItem.students && (
                        <p className="class-info">
                          <i className="fas fa-users"></i> {classItem.students} Students
                        </p>
                      )}
                      {classItem.info && (
                        <p className="class-info">
                          <i className="fas fa-clipboard-list"></i> {classItem.info}
                        </p>
                      )}
                    </div>
                    <div className="class-actions">
                      <button className="btn-small">View Details</button>
                      {classItem.students && (
                        <button className="btn-small">Class Materials</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="week-schedule">
            <div className="week-grid">
              {daysOfWeek.map(day => (
                <div className="day-column" key={day}>
                  <div className="day-header">{day}</div>
                  <div className="day-classes">
                    {weekSchedule[day].length === 0 ? (
                      <div className="no-classes">No Classes</div>
                    ) : (
                      weekSchedule[day].map(classItem => (
                        <div className="week-class-card" key={classItem.id}>
                          <div className="class-time">{classItem.time}</div>
                          <div className="class-name">{classItem.name}</div>
                          <div className="class-location">{classItem.location}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassSchedule;