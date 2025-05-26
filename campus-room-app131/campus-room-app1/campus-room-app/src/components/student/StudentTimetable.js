import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../api';
import '../../styles/timetable.css';

const StudentTimetable = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [timetableData, setTimetableData] = useState({});
  const [classGroups, setClassGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Time slots
  const timeSlots = [
    '8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
    '16:00 - 17:00', '17:00 - 18:00'
  ];
  
  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Update the useEffect hook that fetches timetable data
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        // Add this at the start of fetchTimetable function
        console.log('Auth token:', localStorage.getItem('token'));
        console.log('Current user:', localStorage.getItem('user'));
        setLoading(true);
        setError(null);
        
        // First check if user is authenticated
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        
        console.log('Fetching timetable data from API for user:', currentUser.email);
        
        // Make API call to get the timetable data
        // Now using classGroup-based timetable
        const response = await API.timetableAPI.getMyTimetable();
        console.log('Timetable API response:', response);
        
        if (response && response.data) {
          // Process the timetable entries
          const processedData = processTimetableData(response.data);
          setTimetableData(processedData);
          console.log('Timetable data processed successfully');
          
          // Also fetch the user's class groups for display
          fetchClassGroups();
        } else {
          throw new Error('No data received from timetable API');
        }
      } catch (err) {
        console.error('Error fetching timetable:', err);
        
        // Provide specific error message to help debug the issue
        if (err.response) {
          // Server responded with an error status
          if (err.response.status === 401) {
            setError('Authentication error. Please log in again.');
            // Redirect to login page or handle auth error
            navigate('/');
          } else {
            setError(`Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
          }
        } else if (err.request) {
          // Request was made but no response received
          setError('No response from server. Please check your connection.');
        } else {
          // Something else went wrong
          setError(`Error: ${err.message}`);
        }
        
        // Only use mock data in development environment
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using mock data as fallback during development');
          setTimetableData(getMockTimetableData());
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimetable();
  }, [currentUser, navigate]);
  
  // Fetch the user's class groups
  const fetchClassGroups = async () => {
    try {
      // Only proceed if user is authenticated and is a student
      if (!currentUser || currentUser.role !== 'STUDENT') {
        return;
      }
      
      const response = await API.classGroupAPI.getClassGroupsByStudent(currentUser.id);
      
      if (response && response.data) {
        setClassGroups(response.data);
        console.log('Fetched class groups:', response.data);
      }
    } catch (err) {
      console.error('Error fetching class groups:', err);
      // Don't set error - we still have the timetable data
    }
  };

  // Process timetable data
  const processTimetableData = (timetableEntries) => {
    const processedData = {};
    
    // Initialize empty arrays for each day
    daysOfWeek.forEach(day => {
      processedData[day] = [];
    });
    
    // Check if timetableEntries is an array
    if (Array.isArray(timetableEntries)) {
      console.log(`Processing ${timetableEntries.length} timetable entries`);
      
      // Process each entry
      timetableEntries.forEach(entry => {
        const day = entry.day;
        
        // Log entry for debugging
        console.log('Processing entry:', entry);
        
        if (daysOfWeek.includes(day)) {
          // Ensure both startTime and endTime have a consistent format (HH:MM)
          const startTime = formatTimeString(entry.startTime);
          const endTime = formatTimeString(entry.endTime);
          
          processedData[day].push({
            id: entry.id,
            name: entry.name || 'Unnamed Course',
            instructor: entry.instructor || 'No instructor assigned',
            location: entry.location || 'TBD',
            startTime: startTime,
            endTime: endTime,
            color: entry.color || '#6366f1',
            type: entry.type || 'Lecture'
          });
          console.log(`Added entry to ${day}:`, entry.name, `with time ${startTime} - ${endTime}`);
        } else {
          console.warn(`Skipping entry with invalid day: ${day}`, entry);
        }
      });
    } else {
      // Handle different response formats
      if (timetableEntries && typeof timetableEntries === 'object') {
        console.log('Timetable data is an object, trying to extract entries...');
        
        // Some APIs might return { data: [...entries] } or another nested structure
        const extractedEntries = timetableEntries.timetableEntries || 
                              timetableEntries.entries || 
                              timetableEntries.data || 
                              [];
        
        if (Array.isArray(extractedEntries)) {
          console.log(`Processing ${extractedEntries.length} extracted timetable entries`);
          
          extractedEntries.forEach(entry => {
            const day = entry.day;
            
            if (daysOfWeek.includes(day)) {
              // Ensure consistent time format
              const startTime = formatTimeString(entry.startTime);
              const endTime = formatTimeString(entry.endTime);
              
              processedData[day].push({
                id: entry.id,
                name: entry.name || 'Unnamed Course',
                instructor: entry.instructor || 'No instructor assigned',
                location: entry.location || 'TBD',
                startTime: startTime,
                endTime: endTime,
                color: entry.color || '#6366f1',
                type: entry.type || 'Lecture'
              });
            }
          });
        } else {
          console.error('Could not extract timetable entries from:', timetableEntries);
        }
      } else {
        console.error('Timetable entries is not an array or object:', timetableEntries);
      }
    }
    
    // Log the final processed data structure
    console.log('Final processed timetable data:', processedData);
    
    return processedData;
  };

  // Helper function to ensure consistent time format (HH:MM)
  const formatTimeString = (timeString) => {
    if (!timeString) return '00:00';
    
    // Handle different time formats that might come from the API
    if (typeof timeString === 'string') {
      // If in format HH:MM, return as is
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        return timeString.padStart(5, '0'); // Ensure HH:MM (e.g., "9:00" -> "09:00")
      }
      
      // If in format HH:MM:SS, remove seconds
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeString)) {
        return timeString.split(':').slice(0, 2).join(':').padStart(5, '0');
      }
      
      // Try to parse time from string (in case of ISO format or other)
      try {
        const date = new Date(timeString);
        if (!isNaN(date)) {
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
      } catch (e) {
        console.warn('Could not parse time from string:', timeString);
      }
    }
    
    // If all else fails, try to convert to string and take first 5 chars
    return String(timeString).padStart(5, '0');
  };
  
  // Fallback mock data in case the API fails
  const getMockTimetableData = () => {
    return {
      'Monday': [
        { id: 'C1', name: 'CS 101: Intro to Programming', instructor: 'Professor Johnson', location: 'Room 101', startTime: '9:00', endTime: '10:30', color: '#6366f1', type: 'Lecture' },
        { id: 'C2', name: 'MATH 201: Calculus II', instructor: 'Professor Wilson', location: 'Room 203', startTime: '13:00', endTime: '14:30', color: '#10b981', type: 'Lecture' }
      ],
      'Tuesday': [
        { id: 'C3', name: 'PHYS 101: Physics I', instructor: 'Professor Smith', location: 'Lab 305', startTime: '11:00', endTime: '12:30', color: '#0ea5e9', type: 'Lab' }
      ],
      'Wednesday': [
        { id: 'C4', name: 'CS 101: Intro to Programming', instructor: 'Professor Johnson', location: 'Room 101', startTime: '9:00', endTime: '10:30', color: '#6366f1', type: 'Lecture' },
        { id:'C5', name: 'Study Group', instructor: null, location: 'Library', startTime: '15:30', endTime: '16:30', color: '#f59e0b', type: 'Study Group', participants: 5 }
      ],
      'Thursday': [
        { id: 'C6', name: 'PHYS 101: Physics I', instructor: 'Professor Smith', location: 'Lab 305', startTime: '11:00', endTime: '12:30', color: '#0ea5e9', type: 'Lab' }
      ],
      'Friday': [
        { id: 'C7', name: 'MATH 201: Calculus II', instructor: 'Professor Wilson', location: 'Room 203', startTime: '13:00', endTime: '14:30', color: '#10b981', type: 'Lecture' }
      ]
    };
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
      if (timetableData[day]) {
        timetableData[day].forEach(course => {
          if (course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()))) {
            results.push({...course, day});
          }
        });
      }
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
  
  // Function to export schedule as PDF
  const exportSchedulePDF = async () => {
    try {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        alert('Please allow popups to download the PDF');
        return;
      }

      // Generate HTML content for PDF
      const htmlContent = generatePDFContent();
      
      // Write HTML to the new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Generate HTML content for PDF - STUDENT VERSION
  const generatePDFContent = () => {
    const weekDatesForPDF = getWeekDates();
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // College logo as base64 (you can replace this with your actual logo)
    const collegeLogo = `data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#1e40af" stroke="#fff" stroke-width="2"/>
        <text x="50" y="35" text-anchor="middle" fill="white" font-family="serif" font-size="20" font-weight="bold">EDU</text>
        <text x="50" y="55" text-anchor="middle" fill="white" font-family="serif" font-size="12">COLLEGE</text>
        <path d="M20 65 L50 75 L80 65" stroke="white" stroke-width="2" fill="none"/>
      </svg>
    `)}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Student Timetable - ${currentDate}</title>
        <style>
            @page {
                size: A4 landscape;
                margin: 0.2in;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                color: #333;
                background: white;
                line-height: 1.2;
                font-size: 12px;
                page-break-inside: avoid;
            }
            
            .pdf-container {
                width: 100%;
                height: 100vh;
                display: flex;
                flex-direction: column;
                page-break-inside: avoid;
            }
            
            .pdf-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
                padding-bottom: 5px;
                border-bottom: 2px solid #1e40af;
                flex-shrink: 0;
            }
            
            .college-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .college-logo {
                width: 35px;
                height: 35px;
            }
            
            .college-details h1 {
                color: #1e40af;
                font-size: 16px;
                margin-bottom: 1px;
            }
            
            .college-details p {
                color: #666;
                font-size: 9px;
                line-height: 1.1;
            }
            
            .document-info {
                text-align: right;
            }
            
            .document-info h2 {
                color: #1e40af;
                font-size: 14px;
                margin-bottom: 2px;
            }
            
            .document-info p {
                color: #666;
                font-size: 8px;
                line-height: 1.1;
            }
            
            .student-info {
                background: #f8fafc;
                padding: 4px 8px;
                border-radius: 4px;
                margin-bottom: 6px;
                border-left: 3px solid #1e40af;
                flex-shrink: 0;
            }
            
            .student-info h3 {
                color: #1e40af;
                margin-bottom: 1px;
                font-size: 11px;
            }
            
            .student-info p {
                font-size: 8px;
            }
            
            .week-info {
                text-align: center;
                margin-bottom: 8px;
                padding: 4px;
                background: #e0f2fe;
                border-radius: 4px;
                flex-shrink: 0;
            }
            
            .week-info h3 {
                color: #0369a1;
                margin-bottom: 2px;
                font-size: 11px;
            }
            
            .week-info p {
                font-size: 8px;
            }
            
            .timetable-container {
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            
            .timetable-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9px;
                height: 100%;
                table-layout: fixed;
            }
            
            .timetable-table th {
                background: #1e40af;
                color: white;
                padding: 3px 2px;
                text-align: center;
                font-weight: bold;
                border: 1px solid #1e3a8a;
                font-size: 9px;
                height: 35px;
            }
            
            .timetable-table td {
                padding: 1px;
                border: 1px solid #d1d5db;
                text-align: center;
                vertical-align: middle;
                height: 25px;
                position: relative;
                font-size: 8px;
            }
            
            .time-slot {
                background: #f1f5f9;
                font-weight: bold;
                color: #475569;
                width: 60px;
                font-size: 8px;
                padding: 2px 1px;
            }
            
            .course-block {
                background: var(--course-color, #6366f1);
                color: white;
                padding: 4px 6px;
                border-radius: 3px;
                margin: 1px;
                font-size: 8px;
                text-align: center;
                width: calc(100% - 2px);
                height: calc(100% - 2px);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                box-sizing: border-box;
                min-height: 20px;
            }
            
            .course-name {
                font-weight: bold;
                margin-bottom: 2px;
                font-size: 9px;
                line-height: 1.1;
                text-align: center;
            }
            
            .course-details {
                font-size: 7px;
                opacity: 0.9;
                line-height: 1.0;
                text-align: center;
            }
            
            .empty-slot {
                background: #f9fafb;
                color: #9ca3af;
                font-style: italic;
                font-size: 7px;
            }

            .course-cell {
                padding: 2px;
                border: 1px solid #d1d5db;
                text-align: center;
                vertical-align: middle;
                position: relative;
                background: white;
            }
            
            .footer {
                margin-top: 4px;
                padding-top: 3px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 6px;
                color: #666;
                flex-shrink: 0;
            }
            
            .footer-left {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .generated-info {
                text-align: right;
                font-size: 6px;
            }
            
            /* Ensure no page breaks */
            .pdf-container, .timetable-container, .timetable-table {
                page-break-inside: avoid;
                break-inside: avoid;
            }
        </style>
    </head>
    <body>
        <div class="pdf-container">
            <div class="pdf-header">
                <div class="college-info">
                    <img src="${collegeLogo}" alt="College Logo" class="college-logo">
                    <div class="college-details">
                        <h1>University College</h1>
                        <p>Department of Computer Science</p>
                        <p>Academic Timetable System</p>
                    </div>
                </div>
                <div class="document-info">
                    <h2>Student Timetable</h2>
                    <p>Generated: ${currentDate}</p>
                    <p>Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}</p>
                </div>
            </div>

            <div class="student-info">
                <h3>Student: ${currentUser?.displayName || currentUser?.email || 'Unknown Student'}</h3>
                <p>Email: ${currentUser?.email || 'N/A'} | Student ID: ${currentUser?.studentId || 'N/A'}</p>
            </div>

            <div class="week-info">
                <h3>Week: ${formatDate(weekDatesForPDF[0])} - ${formatDate(weekDatesForPDF[4])}</h3>
                <p>${currentWeek === 0 ? 'Current Week' : (currentWeek > 0 ? `${currentWeek} Week${currentWeek !== 1 ? 's' : ''} Ahead` : `${Math.abs(currentWeek)} Week${Math.abs(currentWeek) !== 1 ? 's' : ''} Ago`)}</p>
            </div>

            <div class="timetable-container">
                <table class="timetable-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            ${daysOfWeek.map((day, index) => 
                              `<th>${day}<br><small>${formatDate(weekDatesForPDF[index])}</small></th>`
                            ).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${timeSlots.map((slot, slotIndex) => {
                          const slotStartHour = parseInt(slot.split(':')[0]);
                          return `
                            <tr>
                                <td class="time-slot">${slot.split(' - ')[0]}</td>
                                ${daysOfWeek.map(day => {
                                  // Check if this cell should be skipped (part of a rowspan from previous row)
                                  const isPartOfRowspan = timetableData[day]?.some(course => {
                                    const courseStartHour = parseInt(course.startTime.split(':')[0]);
                                    const courseEndHour = parseInt(course.endTime.split(':')[0]);
                                    const courseEndMin = parseInt(course.endTime.split(':')[1] || 0);
                                    
                                    // Calculate end hour considering minutes
                                    const actualEndHour = courseEndMin > 0 ? courseEndHour + 1 : courseEndHour;
                                    
                                    // This slot is part of a rowspan if course started before this hour and ends after
                                    return courseStartHour < slotStartHour && actualEndHour > slotStartHour;
                                  });
                                  
                                  if (isPartOfRowspan) {
                                    return ''; // Skip this cell - it's part of a rowspan
                                  }
                                  
                                  // Find courses that start in this time slot
                                  const coursesInSlot = timetableData[day]?.filter(course => {
                                    const courseStartHour = parseInt(course.startTime.split(':')[0]);
                                    return courseStartHour === slotStartHour;
                                  }) || [];
                                  
                                  if (coursesInSlot.length === 0) {
                                    return '<td class="empty-slot">-</td>';
                                  }
                                  
                                  return coursesInSlot.map(course => {
                                    // Calculate rowspan for multi-hour courses
                                    const courseStartHour = parseInt(course.startTime.split(':')[0]);
                                    const courseEndHour = parseInt(course.endTime.split(':')[0]);
                                    const courseEndMin = parseInt(course.endTime.split(':')[1] || 0);
                                    
                                    // Calculate how many hour slots this course spans
                                    let rowspan = courseEndHour - courseStartHour;
                                    if (courseEndMin > 0) rowspan += 1;
                                    
                                    const rowspanAttr = rowspan > 1 ? `rowspan="${rowspan}"` : '';
                                    
                                    return `<td class="course-cell" ${rowspanAttr}>
                                      <div class="course-block" style="--course-color: ${course.color};">
                                        <div class="course-name">${course.name}</div>
                                        <div class="course-details">
                                          ${course.startTime}-${course.endTime}<br/>${course.location}
                                        </div>
                                      </div>
                                    </td>`;
                                  }).join('');
                                }).join('')}
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <div class="footer-left">
                    <img src="${collegeLogo}" alt="Logo" style="width: 15px; height: 15px; opacity: 0.7;">
                    <span>University College - Official Document</span>
                </div>
                <div class="generated-info">
                    <div>Generated by Campus Timetable System | ID: ST-${Date.now()}</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  };
  
  // Function to export schedule as iCal (.ics) file
  const exportSchedule = async () => {
    try {
      // Use API to get ICS file
      const response = await API.timetableAPI.exportTimetable('ics');
      
      // Create blob from response data
      const blob = new Blob([response.data], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.download = 'class_schedule.ics';
      link.href = url;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting schedule:', error);
      alert('Failed to export schedule. Please try again later.');
      
      // Fallback to client-side generation if API fails
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
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="timetable-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your timetable...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="timetable-page">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="timetable-page">
      <div className="timetable-header">
        <div className="timetable-title">
          <h1>Class Timetable</h1>
          <p>Your weekly academic schedule</p>
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
          
          <div className="export-buttons">
            <button className="btn btn-secondary" onClick={exportSchedule}>
              <i className="fas fa-calendar-alt"></i> Export iCal
            </button>
            
            <button className="btn btn-success" onClick={exportSchedulePDF}>
              <i className="fas fa-file-pdf"></i> Download PDF
            </button>
          </div>
        </div>
      </div>
      
      {/* Class Groups Section */}
      {classGroups.length > 0 && (
        <div className="enrolled-classes-section">
          <h2>Your Enrolled Classes</h2>
          <div className="class-groups-grid">
            {classGroups.map(classGroup => (
              <div key={classGroup.id} className="class-group-card">
                <div className="class-group-header">
                  <h3>{classGroup.courseCode}</h3>
                  <span className="semester-badge">{classGroup.semester} {classGroup.academicYear}</span>
                </div>
                <h4>{classGroup.name}</h4>
                {classGroup.professorName && (
                  <p className="professor-name">
                    <i className="fas fa-user-tie"></i> Prof. {classGroup.professorName}
                  </p>
                )}
                {classGroup.description && (
                  <p className="class-description">{classGroup.description}</p>
                )}
                <div className="class-meta">
                  <span className="student-count">
                    <i className="fas fa-users"></i> {classGroup.studentCount || 0} students
                  </span>
                  <span className="updated-at">
                    <i className="fas fa-clock"></i> Updated: {classGroup.lastUpdated || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
                    const slotStartHour = parseInt(slot.split(':')[0]);
                    
                    // Get courses that occur during this time slot
                    const coursesInSlot = timetableData[day]?.filter(course => {
                      const courseStartHour = parseInt(course.startTime.split(':')[0]);
                      const courseStartMin = parseInt(course.startTime.split(':')[1] || 0);
                      const courseEndHour = parseInt(course.endTime.split(':')[0]);
                      const courseEndMin = parseInt(course.endTime.split(':')[1] || 0);
                      
                      // A course is in this slot if:
                      // 1. It starts during this hour, OR
                      // 2. It started before and ends after this hour
                      return (courseStartHour === slotStartHour) || 
                             (courseStartHour < slotStartHour && courseEndHour > slotStartHour);
                    });
                    
                    return (
                      <div key={`${day}-${slot}`} className="timetable-grid-slot">
                        {coursesInSlot && coursesInSlot.map((course) => {
                          const startHour = parseInt(course.startTime.split(':')[0]);
                          const startMin = parseInt(course.startTime.split(':')[1] || 0);
                          
                          // Only render if this is the starting slot for this course
                          if (startHour === slotStartHour) {
                            const endHour = parseInt(course.endTime.split(':')[0]);
                            const endMin = parseInt(course.endTime.split(':')[1] || 0);
                            
                            // Calculate duration in hours (including partial hours)
                            const durationHours = (endHour + endMin/60) - (startHour + startMin/60);
                            
                            return (
                              <div 
                                key={course.id}
                                className="timetable-course"
                                style={{ 
                                  backgroundColor: course.color,
                                  height: `${durationHours * 100}%`,
                                  top: `${(startMin/60) * 100}%`,
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