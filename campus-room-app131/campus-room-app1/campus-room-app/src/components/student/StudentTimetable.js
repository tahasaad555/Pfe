import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/timetable.css';

const StudentTimetable = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  
  // Time slots
  const timeSlots = [
    '8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
    '16:00 - 17:00', '17:00 - 18:00'
  ];
  
  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Mock data for timetable
  const timetableData = {
    'Monday': [
      { id: 'C1', name: 'CS 101: Intro to Programming', instructor: 'Professor Johnson', location: 'Room 101', startTime: '9:00', endTime: '10:30', color: '#6366f1', type: 'Lecture' },
      { id: 'C2', name: 'MATH 201: Calculus II', instructor: 'Professor Wilson', location: 'Room 203', startTime: '13:00', endTime: '14:30', color: '#10b981', type: 'Lecture' }
    ],
    'Tuesday': [
      { id: 'C3', name: 'PHYS 101: Physics I', instructor: 'Professor Smith', location: 'Lab 305', startTime: '11:00', endTime: '12:30', color: '#0ea5e9', type: 'Lab' }
    ],
    'Wednesday': [
      { id: 'C4', name: 'CS 101: Intro to Programming', instructor: 'Professor Johnson', location: 'Room 101', startTime: '9:00', endTime: '10:30', color: '#6366f1', type: 'Lecture' },
      { id: 'C5', name: 'Study Group', instructor: null, location: 'Library', startTime: '15:30', endTime: '16:30', color: '#f59e0b', type: 'Study Group', participants: 5 }
    ],
    'Thursday': [
      { id: 'C6', name: 'PHYS 101: Physics I', instructor: 'Professor Smith', location: 'Lab 305', startTime: '11:00', endTime: '12:30', color: '#0ea5e9', type: 'Lab' }
    ],
    'Friday': [
      { id: 'C7', name: 'MATH 201: Calculus II', instructor: 'Professor Wilson', location: 'Room 203', startTime: '13:00', endTime: '14:30', color: '#10b981', type: 'Lecture' }
    ]
  };
  
  // Current day
  const getCurrentDay = () => {
    const date = new Date();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    return daysOfWeek.includes(day) ? day : 'Monday';
  };
  
  // Course search filter
  const filteredCourses = () => {
    if (!searchTerm) return [];
    
    const results = [];
    daysOfWeek.forEach(day => {
      timetableData[day].forEach(course => {
        if (course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()))) {
          results.push({...course, day});
        }
      });
    });
    
    return results;
  };
  
  // Time to row index mapping
  const getRowIndex = (time) => {
    const hour = parseInt(time.split(':')[0]);
    return hour - 8; // 8:00 is the first slot (index 0)
  };
  
  // View course details
  const viewCourse = (course, day) => {
    setSelectedCourse({...course, day});
    setShowCourseModal(true);
  };
  
  // Get upcoming classes
  const getUpcomingClasses = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = getCurrentDay();
    
    let upcoming = [];
    
    // Get all courses for today that haven't started yet
    if (timetableData[currentDay]) {
      upcoming = timetableData[currentDay].filter(course => {
        const startHour = parseInt(course.startTime.split(':')[0]);
        return startHour > currentHour;
      });
    }
    
    // If less than 3 upcoming courses today, get courses for tomorrow
    if (upcoming.length < 3) {
      const tomorrow = daysOfWeek[(daysOfWeek.indexOf(currentDay) + 1) % 5];
      if (timetableData[tomorrow]) {
        const tomorrowCourses = timetableData[tomorrow].map(course => ({
          ...course,
          day: tomorrow
        }));
        upcoming = [...upcoming, ...tomorrowCourses].slice(0, 3);
      }
    }
    
    return upcoming;
  };
  
  // Calculate week dates
  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday as first day
    
    startOfWeek.setDate(today.getDate() - diff + (currentWeek * 7));
    
    return daysOfWeek.map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  };
  
  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Week dates
  const weekDates = getWeekDates();
  
  // Function to export schedule as iCal (.ics) file
  const exportSchedule = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CampusRoom//Timetable//EN'
    ];
    
    // Add each class as an event
    daysOfWeek.forEach((day, dayIndex) => {
      if (timetableData[day]) {
        timetableData[day].forEach(course => {
          const eventDate = new Date(weekDates[dayIndex]);
          const startTime = course.startTime.split(':');
          const endTime = course.endTime.split(':');
          
          const startDateTime = new Date(eventDate);
          startDateTime.setHours(parseInt(startTime[0]), parseInt(startTime[1] || 0), 0);
          
          const endDateTime = new Date(eventDate);
          endDateTime.setHours(parseInt(endTime[0]), parseInt(endTime[1] || 0), 0);
          
          // Format dates for iCal (YYYYMMDDTHHmmss)
          const formatDateForICS = (d) => {
            return d.getFullYear() + 
                   ('0' + (d.getMonth() + 1)).slice(-2) + 
                   ('0' + d.getDate()).slice(-2) + 'T' + 
                   ('0' + d.getHours()).slice(-2) + 
                   ('0' + d.getMinutes()).slice(-2) + 
                   ('0' + d.getSeconds()).slice(-2);
          };
          
          icsContent = [
            ...icsContent,
            'BEGIN:VEVENT',
            `UID:${course.id}@campusroom.edu`,
            `DTSTAMP:${formatDateForICS(new Date())}`,
            `DTSTART:${formatDateForICS(startDateTime)}`,
            `DTEND:${formatDateForICS(endDateTime)}`,
            `SUMMARY:${course.name}`,
            `LOCATION:${course.location}`,
            `DESCRIPTION:${course.type} with ${course.instructor || 'n/a'}`,
            'END:VEVENT'
          ];
        });
      }
    });
    
    icsContent.push('END:VCALENDAR');
    
    // Create download
    const blob = new Blob([icsContent.join('\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'class_schedule.ics';
    link.href = url;
    link.click();
  };
  
  return (
    <div className="timetable-page">
      <div className="timetable-header">
        <div className="timetable-title">
          <h1>Class Timetable</h1>
          <p>Manage your weekly academic schedule</p>
        </div>
        
        <div className="timetable-actions">
          <div className="view-toggles">
            <button 
              className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="fas fa-th"></i> Grid View
            </button>
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <i className="fas fa-list"></i> List View
            </button>
          </div>
          
          <button className="btn btn-secondary" onClick={exportSchedule}>
            <i className="fas fa-download"></i> Export Schedule
          </button>
        </div>
      </div>
      
      <div className="timetable-controls">
        <div className="week-navigation">
          <button 
            className="btn btn-icon" 
            onClick={() => setCurrentWeek(currentWeek - 1)}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="current-week">
            <span className="week-label">{currentWeek === 0 ? 'Current Week' : (currentWeek > 0 ? `${currentWeek} Week${currentWeek !== 1 ? 's' : ''} Ahead` : `${Math.abs(currentWeek)} Week${Math.abs(currentWeek) !== 1 ? 's' : ''} Ago`)}</span>
            <span className="week-dates">{formatDate(weekDates[0])} - {formatDate(weekDates[4])}</span>
          </div>
          
          <button 
            className="btn btn-icon"
            onClick={() => setCurrentWeek(currentWeek + 1)}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          
          {currentWeek !== 0 && (
            <button 
              className="btn btn-secondary btn-today"
              onClick={() => setCurrentWeek(0)}
            >
              Today
            </button>
          )}
        </div>
        
        <div className="search-container">
          <i className="fas fa-search search-icon"></i>
          <input 
            type="text"
            placeholder="Search courses or instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="search-clear"
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>
      
      {searchTerm && (
        <div className="search-results">
          <h3>Search Results</h3>
          {filteredCourses().length === 0 ? (
            <p className="no-results">No courses matching "{searchTerm}"</p>
          ) : (
            <ul className="course-list">
              {filteredCourses().map((course) => (
                <li 
                  key={`${course.id}-${course.day}`}
                  className="course-item"
                  onClick={() => viewCourse(course, course.day)}
                >
                  <div className="course-color" style={{ backgroundColor: course.color }}></div>
                  <div className="course-info">
                    <h4>{course.name}</h4>
                    <p>{course.day}, {course.startTime} - {course.endTime} | {course.location}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {viewMode === 'grid' ? (
        // Grid View
        <div className="timetable-grid">
          <div className="timetable-grid-header">
            <div className="timetable-grid-times">
              <div className="timetable-grid-time-label"></div>
              {timeSlots.map((slot) => (
                <div key={slot} className="timetable-grid-time">
                  {slot.split(' - ')[0]}
                </div>
              ))}
            </div>
            
            {daysOfWeek.map((day, index) => (
              <div key={day} className={`timetable-grid-day ${day === getCurrentDay() && currentWeek === 0 ? 'current-day' : ''}`}>
                <div className="timetable-day-header">
                  <span className="day-name">{day}</span>
                  <span className="day-date">{formatDate(weekDates[index])}</span>
                </div>
                <div className="timetable-grid-slots">
                  {timeSlots.map((slot) => {
                    const hourStart = parseInt(slot.split(':')[0]);
                    const courses = timetableData[day]?.filter(course => {
                      const courseStart = parseInt(course.startTime.split(':')[0]);
                      const courseEnd = parseInt(course.endTime.split(':')[0]);
                      return courseStart <= hourStart && courseEnd > hourStart;
                    });
                    
                    return (
                      <div key={`${day}-${slot}`} className="timetable-grid-slot">
                        {courses.map((course) => {
                          const startHour = parseInt(course.startTime.split(':')[0]);
                          const startMin = parseInt(course.startTime.split(':')[1] || 0);
                          const endHour = parseInt(course.endTime.split(':')[0]);
                          const endMin = parseInt(course.endTime.split(':')[1] || 0);
                          
                          // Only render if this is the first slot for this course
                          if (startHour === hourStart) {
                            const durationHours = (endHour + endMin/60) - (startHour + startMin/60);
                            const heightSpan = durationHours;
                            
                            return (
                              <div 
                                key={course.id}
                                className="timetable-course"
                                style={{ 
                                  backgroundColor: course.color,
                                  height: `${heightSpan * 100}%`,
                                  opacity: 0.9
                                }}
                                onClick={() => viewCourse(course, day)}
                              >
                                <h4 className="course-name">{course.name}</h4>
                                <p className="course-time">{course.startTime} - {course.endTime}</p>
                                <p className="course-location">{course.location}</p>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // List View
        <div className="timetable-list">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="timetable-list-day">
              <div className={`timetable-list-day-header ${day === getCurrentDay() && currentWeek === 0 ? 'current-day' : ''}`}>
                <h3>{day}</h3>
                <span className="day-date">{formatDate(weekDates[index])}</span>
              </div>
              
              {timetableData[day] && timetableData[day].length > 0 ? (
                <div className="timetable-list-courses">
                  {timetableData[day].map((course) => (
                    <div 
                      key={course.id}
                      className="timetable-list-course"
                      onClick={() => viewCourse(course, day)}
                    >
                      <div className="course-time-block">
                        <span className="course-time-start">{course.startTime}</span>
                        <span className="course-time-separator"></span>
                        <span className="course-time-end">{course.endTime}</span>
                      </div>
                      
                      <div className="course-content" style={{ borderLeftColor: course.color }}>
                        <h4 className="course-name">{course.name}</h4>
                        <div className="course-details">
                          <span className="course-type">{course.type}</span>
                          <span className="course-location">
                            <i className="fas fa-map-marker-alt"></i> {course.location}
                          </span>
                          {course.instructor && (
                            <span className="course-instructor">
                              <i className="fas fa-user"></i> {course.instructor}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="course-actions">
                        <button className="btn-icon" title="Course materials">
                          <i className="fas fa-book"></i>
                        </button>
                        <button className="btn-icon" title="Add to calendar">
                          <i className="fas fa-calendar-plus"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-courses">
                  <p>No classes scheduled for this day</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="upcoming-section">
        <h3>Upcoming Classes</h3>
        <div className="upcoming-classes">
          {getUpcomingClasses().length > 0 ? (
            getUpcomingClasses().map((course, index) => (
              <div 
                key={`upcoming-${course.id}-${index}`}
                className="upcoming-class"
                style={{ borderLeftColor: course.color }}
              >
                <div className="upcoming-class-day">{course.day}</div>
                <div className="upcoming-class-time">{course.startTime} - {course.endTime}</div>
                <div className="upcoming-class-name">{course.name}</div>
                <div className="upcoming-class-location">{course.location}</div>
              </div>
            ))
          ) : (
            <p className="no-upcoming">No upcoming classes today or tomorrow</p>
          )}
        </div>
      </div>
      
      {/* Course Modal */}
      {showCourseModal && selectedCourse && (
        <div className="course-modal-backdrop" onClick={() => setShowCourseModal(false)}>
          <div className="course-modal" onClick={(e) => e.stopPropagation()}>
            <div className="course-modal-header" style={{ backgroundColor: selectedCourse.color }}>
              <h3>{selectedCourse.name}</h3>
              <button className="modal-close" onClick={() => setShowCourseModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="course-modal-content">
              <div className="course-details-grid">
                <div className="course-detail">
                  <div className="detail-label">
                    <i className="fas fa-clock"></i> Time
                  </div>
                  <div className="detail-value">
                    {selectedCourse.startTime} - {selectedCourse.endTime}
                  </div>
                </div>
                
                <div className="course-detail">
                  <div className="detail-label">
                    <i className="fas fa-calendar-day"></i> Day
                  </div>
                  <div className="detail-value">
                    {selectedCourse.day}
                  </div>
                </div>
                
                <div className="course-detail">
                  <div className="detail-label">
                    <i className="fas fa-map-marker-alt"></i> Location
                  </div>
                  <div className="detail-value">
                    {selectedCourse.location}
                  </div>
                </div>
                
                <div className="course-detail">
                  <div className="detail-label">
                    <i className="fas fa-chalkboard-teacher"></i> Type
                  </div>
                  <div className="detail-value">
                    {selectedCourse.type}
                  </div>
                </div>
                
                {selectedCourse.instructor && (
                  <div className="course-detail">
                    <div className="detail-label">
                      <i className="fas fa-user"></i> Instructor
                    </div>
                    <div className="detail-value">
                      {selectedCourse.instructor}
                    </div>
                  </div>
                )}
                
                {selectedCourse.participants && (
                  <div className="course-detail">
                    <div className="detail-label">
                      <i className="fas fa-users"></i> Participants
                    </div>
                    <div className="detail-value">
                      {selectedCourse.participants}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="course-materials">
                <h4>Course Materials</h4>
                <ul className="materials-list">
                  <li>
                    <i className="fas fa-file-pdf"></i>
                    <span>Course Syllabus</span>
                    <button className="btn-icon">
                      <i className="fas fa-download"></i>
                    </button>
                  </li>
                  <li>
                    <i className="fas fa-file-powerpoint"></i>
                    <span>Lecture Slides Week {currentWeek + 10}</span>
                    <button className="btn-icon">
                      <i className="fas fa-download"></i>
                    </button>
                  </li>
                  <li>
                    <i className="fas fa-file-alt"></i>
                    <span>Assignment Details</span>
                    <button className="btn-icon">
                      <i className="fas fa-download"></i>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="course-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>
                Close
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-video"></i> Join Online Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;