import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/dashboard.css';

const ClassSchedule = ({ classes }) => {
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState('all');
  const [viewMode, setViewMode] = useState('week');
  
  // Days of the week
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Get current day index (0 = Monday, 6 = Sunday)
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7; // Convert Sunday=0 to Sunday=6
  
  // Mock class schedule data - in a real app, this would come from an API
  useEffect(() => {
    // If classes are provided as props, use them
    if (classes && classes.length > 0) {
      setSchedule(classes);
    } else {
      // Otherwise use default mock data
      const mockSchedule = [
        {
          id: 'CL001',
          name: 'CS 101: Intro to Programming',
          day: 'Monday',
          time: '9:00 - 10:30 AM',
          location: 'Room 101',
          instructor: 'Professor Johnson',
          color: 'blue'
        },
        {
          id: 'CL002',
          name: 'MATH 201: Calculus II',
          day: 'Monday',
          time: '1:00 - 2:30 PM',
          location: 'Room 203',
          instructor: 'Professor Wilson',
          color: 'green'
        },
        {
          id: 'CL003',
          name: 'ENG 105: Composition',
          day: 'Tuesday',
          time: '11:00 AM - 12:30 PM',
          location: 'Room 302',
          instructor: 'Professor Miller',
          color: 'purple'
        },
        {
          id: 'CL004',
          name: 'PHYS 102: Physics I',
          day: 'Wednesday',
          time: '10:00 - 11:30 AM',
          location: 'Lab 205',
          instructor: 'Professor Smith',
          color: 'orange'
        },
        {
          id: 'CL005',
          name: 'CS 202: Data Structures',
          day: 'Wednesday',
          time: '2:00 - 3:30 PM',
          location: 'Computer Lab 105',
          instructor: 'Professor Johnson',
          color: 'blue'
        },
        {
          id: 'CL006',
          name: 'MATH 201: Calculus II',
          day: 'Thursday',
          time: '1:00 - 2:30 PM',
          location: 'Room 203',
          instructor: 'Professor Wilson',
          color: 'green'
        },
        {
          id: 'CL007',
          name: 'Study Group: Programming',
          day: 'Friday',
          time: '3:30 - 4:30 PM',
          location: 'Library',
          participants: 5,
          color: 'teal'
        }
      ];
      setSchedule(mockSchedule);
    }
  }, [classes]);
  
  // Filter schedule based on selected day
  const filteredSchedule = selectedDay === 'all' 
    ? schedule 
    : schedule.filter(item => item.day === selectedDay);
  
  // Function to get date for a specific day in current week
  const getDateForDay = (dayIndex) => {
    const date = new Date();
    const diff = (dayIndex - currentDayIndex) + (currentWeek * 7);
    date.setDate(date.getDate() + diff);
    return date;
  };
  
  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day);
  };
  
  // Navigate to previous week
  const previousWeek = () => {
    setCurrentWeek(currentWeek - 1);
  };
  
  // Navigate to next week
  const nextWeek = () => {
    setCurrentWeek(currentWeek + 1);
  };
  
  // Reset to current week
  const goToCurrentWeek = () => {
    setCurrentWeek(0);
    setSelectedDay('all');
  };
  
  // Toggle between week and day view
  const toggleViewMode = () => {
    setViewMode(viewMode === 'week' ? 'day' : 'week');
  };
  
  return (
    <div className="main-content">
      <div className="section-header">
        <h1>Class Schedule</h1>
        <p>View and manage your academic schedule</p>
      </div>
      
      {/* Schedule Controls */}
      <div className="schedule-controls">
        <div className="week-navigation">
          <button className="btn-nav" onClick={previousWeek}>
            <i className="fas fa-chevron-left"></i> Previous Week
          </button>
          <button className="btn-nav active" onClick={goToCurrentWeek}>
            Current Week
          </button>
          <button className="btn-nav" onClick={nextWeek}>
            Next Week <i className="fas fa-chevron-right"></i>
          </button>
        </div>
        
        <div className="view-toggle">
          <button 
            className={`btn-toggle ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            <i className="fas fa-calendar-week"></i> Week View
          </button>
          <button 
            className={`btn-toggle ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            <i className="fas fa-calendar-day"></i> Day View
          </button>
        </div>
      </div>
      
      {/* Day Selection Tabs */}
      <div className="day-tabs">
        <button 
          className={`day-tab ${selectedDay === 'all' ? 'active' : ''}`}
          onClick={() => handleDaySelect('all')}
        >
          All
        </button>
        {weekdays.map((day, index) => (
          <button 
            key={day}
            className={`day-tab ${selectedDay === day ? 'active' : ''} ${index === currentDayIndex && currentWeek === 0 ? 'today' : ''}`}
            onClick={() => handleDaySelect(day)}
          >
            <span className="day-name">{day.substring(0, 3)}</span>
            <span className="day-date">{formatDate(getDateForDay(index))}</span>
          </button>
        ))}
      </div>
      
      {viewMode === 'week' ? (
        /* Week View */
        <div className="week-schedule">
          {filteredSchedule.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-calendar-times no-results-icon"></i>
              <h3>No Classes Found</h3>
              <p>
                {selectedDay === 'all' 
                  ? "You don't have any classes scheduled for this week." 
                  : `You don't have any classes scheduled for ${selectedDay}.`}
              </p>
            </div>
          ) : (
            <div className="class-list">
              {filteredSchedule.map(classItem => (
                <div 
                  className="class-card" 
                  key={classItem.id}
                  style={{borderLeftColor: classItem.color || '#4a90e2'}}
                >
                  <div className="class-day-time">
                    <div className="class-day">{classItem.day}</div>
                    <div className="class-time">{classItem.time}</div>
                  </div>
                  <div className="class-details">
                    <h3 className="class-name">{classItem.name}</h3>
                    <p className="class-location">
                      <i className="fas fa-map-marker-alt"></i> {classItem.location}
                    </p>
                    {classItem.instructor && (
                      <p className="class-instructor">
                        <i className="fas fa-user"></i> {classItem.instructor}
                      </p>
                    )}
                    {classItem.participants && (
                      <p className="class-participants">
                        <i className="fas fa-users"></i> {classItem.participants} Participants
                      </p>
                    )}
                  </div>
                  <div className="class-actions">
                    <button className="btn-small">
                      <i className="fas fa-info-circle"></i> Details
                    </button>
                    <button className="btn-small">
                      <i className="fas fa-book"></i> Materials
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Day View - Calendar Style */
        <div className="day-schedule">
          <div className="time-slots">
            {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
              '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map(time => (
              <div className="time-slot" key={time}>
                <div className="time-label">{time}</div>
                <div className="time-content">
                  {filteredSchedule
                    .filter(classItem => classItem.time.includes(time))
                    .map(classItem => (
                      <div 
                        className="class-block"
                        key={classItem.id}
                        style={{backgroundColor: classItem.color || '#4a90e2'}}
                      >
                        <h4>{classItem.name}</h4>
                        <p>{classItem.location}</p>
                        <p>{classItem.time}</p>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Export/Print Options */}
      <div className="schedule-actions">
        <button className="btn-secondary">
          <i className="fas fa-download"></i> Export Schedule
        </button>
        <button className="btn-secondary">
          <i className="fas fa-print"></i> Print Schedule
        </button>
        <button className="btn-secondary">
          <i className="fas fa-sync-alt"></i> Sync with Calendar
        </button>
      </div>
    </div>
  );
};

export default ClassSchedule;