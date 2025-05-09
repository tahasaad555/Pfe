import React, { useState, useEffect } from 'react';
import { API } from '../../api';
import '../../styles/dashboard.css';

const ClassGroupManagement = () => {
  // States
  const [branches, setBranches] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedClassGroup, setSelectedClassGroup] = useState(null);
  const [expandedBranches, setExpandedBranches] = useState({});
  
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [professors, setProfessors] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  
  // Conflict checking states
  const [isPotentialConflictChecking, setIsPotentialConflictChecking] = useState(false);
  const [potentialConflict, setPotentialConflict] = useState(null);
  const [conflictCheckTimeout, setConflictCheckTimeout] = useState(null);
  const [alternativeSuggestions, setAlternativeSuggestions] = useState([]);
  
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    description: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    courseCode: '',
    description: '',
    academicYear: '',
    semester: '',
    professorId: '',
    branchId: ''
  });
  
  // Timetable states
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [newTimetableEntry, setNewTimetableEntry] = useState({
    day: 'Monday',
    name: '',
    instructor: '',
    location: '',
    startTime: '',
    endTime: '',
    color: '#6366f1',
    type: 'Lecture'
  });
  
  // Days of the week for timetable
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Class types
  const classTypes = ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Workshop'];
  
  // Available colors
  const availableColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Green', value: '#10b981' },
    { name: 'Blue', value: '#0ea5e9' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Pink', value: '#ec4899' }
  ];
  
  // Academic years (current year - 1 to current year + 3)
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let i = -1; i <= 3; i++) {
    const startYear = currentYear + i;
    academicYears.push(`${startYear}-${startYear + 1}`);
  }
  
  // Semesters
  const semesters = ['Fall', 'Spring', 'Summer'];

  // Add some additional CSS for the collapsible branches and centered text
  React.useEffect(() => {
    // Add these styles to the existing dashboard.css
    const style = document.createElement('style');
    style.textContent = `
      .branch-header.collapsible {
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .branch-header.collapsible:hover {
        background-color: rgba(0, 0, 0, 0.03);
      }
      
      .branch-header-content {
        display: flex;
        align-items: center;
      }
      
      .branch-class-count {
        margin-left: 10px;
        font-size: 0.9rem;
        color: #666;
      }
      
      .text-center {
        text-align: center;
      }
      
      .mr-2 {
        margin-right: 8px;
      }

      .btn-retry {
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 5px 10px;
        margin-left: 10px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .btn-retry:hover {
        background-color: #e5e7eb;
      }

      .btn-retry i {
        font-size: 14px;
      }

      .alert-error {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .timetable-info {
        background-color: #e0f2fe;
        border-left: 4px solid #0ea5e9;
        padding: 12px 16px;
        margin: 16px 0;
        border-radius: 4px;
      }
      
      .affected-users {
        background-color: #f0fdf4;
        border-left: 4px solid #10b981;
        padding: 12px 16px;
        margin: 16px 0;
        border-radius: 4px;
      }
      
      .timetable-visualization {
        margin-top: 20px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .timetable-header {
        display: flex;
        width: 100%;
      }
      
      .time-column {
        width: 80px;
        border-right: 1px solid #e5e7eb;
      }
      
      .time-header, .day-header {
        padding: 10px;
        background-color: #f9fafb;
        font-weight: bold;
        text-align: center;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .day-column {
        flex: 1;
        border-right: 1px solid #e5e7eb;
        position: relative;
      }
      
      .day-column:last-child {
        border-right: none;
      }
      
      .time-slot {
        height: 60px;
        padding: 5px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 0.75rem;
        text-align: center;
      }
      
      .day-content {
        position: relative;
        height: 600px; /* 10 time slots of 60px each */
      }
      
      .timetable-entry {
        position: absolute;
        width: 90%;
        left: 5%;
        border-radius: 4px;
        color: white;
        padding: 5px;
        font-size: 0.75rem;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      
      .entry-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      
      .entry-name {
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .entry-time {
        font-size: 0.7rem;
      }
      
      .timetable-visualization-container {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }

      /* Conflict-related styles */
      .conflict-warning {
        background-color: #fff5f5;
        border-left: 4px solid #f56565;
        padding: 12px 16px;
        margin: 12px 0;
        border-radius: 4px;
        display: flex;
        align-items: flex-start;
      }
      
      .conflict-warning i {
        color: #e53e3e;
        margin-right: 8px;
        margin-top: 2px;
      }
      
      .conflict-warning span {
        flex: 1;
      }
      
      .affected-users-list {
        margin-top: 8px;
        color: #718096;
      }
      
      .checking-conflicts {
        display: flex;
        align-items: center;
        color: #3182ce;
        margin: 12px 0;
        font-size: 0.9rem;
      }
      
      .checking-conflicts i {
        margin-right: 8px;
      }
      
      .conflict-button-info {
        margin-top: 8px;
        color: #718096;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
      }
      
      .conflict-button-info i {
        margin-right: 6px;
        color: #f56565;
      }
      
      .timetable-conflicts {
        background-color: #fff5f5;
        border: 1px solid #feb2b2;
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 16px;
      }
      
      .timetable-conflicts ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      
      .timetable-conflicts li {
        margin-bottom: 6px;
      }
      
      /* New styles for alternative suggestions */
      .alternatives-container {
        margin-top: 16px;
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 12px;
      }
      
      .alternatives-title {
        font-weight: 600;
        margin-bottom: 8px;
        color: #4a5568;
        display: flex;
        align-items: center;
      }
      
      .alternatives-title i {
        margin-right: 6px;
        color: #3182ce;
      }
      
      .alternatives-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      
      .alternative-button {
        background-color: #ebf5ff;
        border: 1px solid #bee3f8;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 0.9rem;
        color: #2c5282;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
      }
      
      .alternative-button:hover {
        background-color: #bee3f8;
      }
      
      .alternative-button i {
        margin-right: 6px;
        font-size: 0.8rem;
      }
      
      .timetable-entry.has-conflict {
        box-shadow: 0 0 0 2px #f56565;
        animation: pulse-conflict 2s infinite;
      }
      
      @keyframes pulse-conflict {
        0% {
          box-shadow: 0 0 0 0 rgba(245, 101, 101, 0.7);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(245, 101, 101, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(245, 101, 101, 0);
        }
      }
      
      .conflict-indicator {
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: #f56565;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(style);
    
    // Clean up
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch branches and class groups on component mount
  useEffect(() => {
    fetchBranches();
    fetchClassGroups();
    fetchProfessors();
  }, []);
  
  // Conflict Warning component with enhanced information
  const ConflictWarning = ({ conflict }) => {
    if (!conflict || !conflict.hasConflict) return null;
    
    return (
      <div className="conflict-warning">
        <i className="fas fa-exclamation-triangle"></i>
        <div>
          <span>{conflict.message}</span>
          {conflict.affectedUsers && (
            <div className="affected-users-list">
              <small>
                Affected users: 
                {conflict.affectedUsers.map((user, index) => (
                  <span key={user.id}>
                    {index > 0 ? ', ' : ' '}
                    {user.role === 'PROFESSOR' ? 'Prof. ' : ''}{user.firstName} {user.lastName}
                  </span>
                ))}
              </small>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Alternative Time Suggestions component
  const AlternativeSuggestions = ({ alternatives, onSelectAlternative }) => {
    if (!alternatives || alternatives.length === 0) return null;
    
    return (
      <div className="alternatives-container">
        <div className="alternatives-title">
          <i className="fas fa-lightbulb"></i>
          Suggested alternatives to avoid conflicts:
        </div>
        <div className="alternatives-list">
          {alternatives.map((alt, index) => (
            <button 
              key={index} 
              className="alternative-button"
              onClick={() => onSelectAlternative(alt)}
            >
              <i className="fas fa-clock"></i>
              {alt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Helper function to convert time to minutes for comparison
  const convertTimeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Check for potential conflicts before adding a timetable entry
  const checkForPotentialConflicts = async (newEntry) => {
    if (!selectedClassGroup || !newEntry.day || !newEntry.startTime || !newEntry.endTime) {
      return null; // Not enough info to check
    }
    
    try {
      // Check if the entry conflicts with any existing entries in the current timetable
      const localConflict = timetableEntries.some(entry => 
        entry.day === newEntry.day &&
        ((convertTimeToMinutes(entry.startTime) < convertTimeToMinutes(newEntry.endTime) &&
          convertTimeToMinutes(entry.endTime) > convertTimeToMinutes(newEntry.startTime)))
      );
      
      if (localConflict) {
        return {
          hasConflict: true,
          message: "This time slot conflicts with another entry in the current timetable."
        };
      }
      
      // Make an API call to check if this time would create conflicts with students or professor
      const response = await API.post(`/api/class-groups/${selectedClassGroup.id}/check-conflicts`, {
        day: newEntry.day,
        startTime: newEntry.startTime,
        endTime: newEntry.endTime
      });
      
      // Process alternative suggestions if they exist
      if (response.data.hasConflict && response.data.alternatives) {
        setAlternativeSuggestions(response.data.alternatives);
      } else {
        setAlternativeSuggestions([]);
      }
      
      return response.data;
    } catch (err) {
      console.error('Error checking for conflicts:', err);
      return null;
    }
  };
  
  // Apply an alternative suggestion
  const applyAlternativeSuggestion = (alternative) => {
    setNewTimetableEntry({
      ...newTimetableEntry,
      day: alternative.day,
      startTime: alternative.startTime,
      endTime: alternative.endTime
    });
    
    // Clear conflict after applying alternative
    setPotentialConflict(null);
    setAlternativeSuggestions([]);
  };
  
  // Fetch branches
  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await API.get('/api/branches');
      setBranches(response.data);
      
      // Initialize expanded state for each branch
      const expandedState = {};
      response.data.forEach(branch => {
        expandedState[branch.id] = false;
      });
      setExpandedBranches(expandedState);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch class groups
  const fetchClassGroups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await API.get('/api/class-groups');
      setClassGroups(response.data);
    } catch (err) {
      console.error('Error fetching class groups:', err);
      setError('Failed to load class groups. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch professors for dropdown
  const fetchProfessors = async () => {
    try {
      const response = await API.userAPI.getUsersByRole('PROFESSOR');
      setProfessors(response.data);
    } catch (err) {
      console.error('Error fetching professors:', err);
    }
  };
  
  // Fetch available students for a class group with better error handling
  const fetchAvailableStudents = async (classGroupId) => {
    try {
      const response = await API.get(`/api/class-groups/${classGroupId}/available-students`);
      setAvailableStudents(response.data || []);
      return true;
    } catch (err) {
      console.error('Error fetching available students:', err);
      // Don't set error here, let the caller handle it
      return false;
    }
  };

  // Toggle branch expansion
  const toggleBranchExpansion = (branchId) => {
    setExpandedBranches({
      ...expandedBranches,
      [branchId]: !expandedBranches[branchId]
    });
  };

  // Handle branch form change
  const handleBranchFormChange = (e) => {
    const { name, value } = e.target;
    setBranchFormData({
      ...branchFormData,
      [name]: value
    });
  };
  
  // Handle class group form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle timetable entry change with conflict checking
  const handleTimetableEntryChange = async (e) => {
    const { name, value } = e.target;
    const updatedEntry = {
      ...newTimetableEntry,
      [name]: value
    };
    
    // Clear alternative suggestions when entry changes
    setAlternativeSuggestions([]);
    
    setNewTimetableEntry(updatedEntry);
    
    // If we have enough data to check for conflicts
    if (updatedEntry.day && updatedEntry.startTime && updatedEntry.endTime && 
        updatedEntry.startTime !== updatedEntry.endTime) {
      
      // Show checking indicator
      setIsPotentialConflictChecking(true);
      
      // Debounce the conflict check to avoid too many API calls
      if (conflictCheckTimeout) {
        clearTimeout(conflictCheckTimeout);
      }
      
      setConflictCheckTimeout(setTimeout(async () => {
        const conflictResult = await checkForPotentialConflicts(updatedEntry);
        setPotentialConflict(conflictResult);
        setIsPotentialConflictChecking(false);
      }, 500));
    } else {
      // Clear potential conflict if we don't have enough data
      setPotentialConflict(null);
    }
  };
  
  // Select a branch
  const selectBranch = (branch) => {
    setSelectedBranch(branch);
  };
  
  // Select a class group with improved error handling and better timetable handling
  const selectClassGroup = async (classGroup) => {
    // Set the selected class group immediately for UI responsiveness
    setSelectedClassGroup(classGroup);
    
    // Load timetable entries for this class group
    if (classGroup.timetableEntries && classGroup.timetableEntries.length > 0) {
      setTimetableEntries(classGroup.timetableEntries);
      console.log('Loaded timetable entries from class group:', classGroup.timetableEntries);
    } else {
      // If no timetable entries in the provided class group, try to get from API
      try {
        const response = await API.get(`/api/class-groups/${classGroup.id}`);
        if (response.data && response.data.timetableEntries) {
          setTimetableEntries(response.data.timetableEntries);
          console.log('Loaded timetable entries from API:', response.data.timetableEntries);
        } else {
          console.log('No timetable entries found in API response');
          setTimetableEntries([]);
        }
      } catch (err) {
        console.error('Error fetching class group details for timetable:', err);
        setTimetableEntries([]);
      }
    }
    
    // First try to load available students
    const studentsLoaded = await fetchAvailableStudents(classGroup.id);
    if (!studentsLoaded) {
      console.warn('Failed to load available students for class group');
    }
    
    // Then try to load enrolled students with better error handling
    try {
      // Fetch complete student data for this class group
      const response = await API.get(`/api/class-groups/${classGroup.id}/students`);
      
      if (!response || !response.data) {
        throw new Error('No data received from students API');
      }
      
      setSelectedStudents(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching students for class group:', err);
      
      // Fallback to the students property if API call fails
      if (classGroup.students && Array.isArray(classGroup.students) && classGroup.students.length > 0) {
        setSelectedStudents(classGroup.students);
      } else {
        setSelectedStudents([]);
      }
    }
  };
  
  // Retry loading students function
  const retryLoadStudents = async () => {
    if (!selectedClassGroup) return;
    
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    
    try {
      // Try with increased timeout for this retry
      const studentsResponse = await API.get(`/api/class-groups/${selectedClassGroup.id}/students`, { 
        timeout: 10000 // Increased timeout for retry
      });
      
      if (!studentsResponse || !studentsResponse.data) {
        throw new Error('No data received from students API');
      }
      
      setSelectedStudents(studentsResponse.data || []);
      
      // Also retry fetching available students
      await fetchAvailableStudents(selectedClassGroup.id);
      
      setMessage({
        text: 'Student data loaded successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error reloading student data:', err);
      setError('Failed to load student data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Open add branch modal
  const openAddBranchModal = () => {
    setBranchFormData({
      name: '',
      description: ''
    });
    setShowAddBranchModal(true);
  };
  
  // Open edit branch modal
  const openEditBranchModal = (branch) => {
    setBranchFormData({
      name: branch.name,
      description: branch.description || ''
    });
    setSelectedBranch(branch);
    setShowEditBranchModal(true);
  };
  
  // Open add class group modal
  const openAddModal = (branch = null) => {
    setFormData({
      name: '',
      courseCode: '',
      description: '',
      academicYear: academicYears[1], // Default to current academic year
      semester: 'Summer', // Default to Summer as requested
      professorId: '',
      branchId: branch ? branch.id : ''
    });
    if (branch) {
      setSelectedBranch(branch);
    }
    setShowAddModal(true);
  };
  
  // Open edit class group modal
  const openEditModal = (classGroup) => {
    setFormData({
      name: classGroup.name,
      courseCode: classGroup.courseCode,
      description: classGroup.description || '',
      academicYear: classGroup.academicYear,
      semester: classGroup.semester,
      professorId: classGroup.professorId || '',
      branchId: classGroup.branchId || ''
    });
    setSelectedClassGroup(classGroup);
    setShowEditModal(true);
  };
  
  // Open students modal with improved error handling
  const openStudentsModal = async (classGroup) => {
    setLoading(true);
    setError(null); // Clear any previous errors
    setRetryCount(0); // Reset retry count
    
    try {
      // First select the class group to load basic data
      await selectClassGroup(classGroup);
      
      // Try to load latest students data
      try {
        const studentsResponse = await API.get(`/api/class-groups/${classGroup.id}/students`);
        if (studentsResponse && studentsResponse.data) {
          setSelectedStudents(studentsResponse.data);
        } else {
          console.warn('No students data received');
          // We'll rely on selectClassGroup's fallback
        }
      } catch (studentErr) {
        console.error('Error fetching latest students:', studentErr);
        // We'll show an error but still open the modal
        setError('Failed to load student data. Please try again.');
      }
      
      // Always show the modal, even if there were errors loading students
      setShowStudentsModal(true);
    } catch (err) {
      console.error('Error opening students modal:', err);
      setError('Failed to load student data. Please try again.');
      // Still open the modal to allow user to see the error and retry
      setShowStudentsModal(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Open timetable modal with enhanced timetable loading
  const openTimetableModal = async (classGroup) => {
    setLoading(true);
    
    try {
      // Try to get the most up-to-date class group data from the API
      const response = await API.get(`/api/class-groups/${classGroup.id}`);
      let updatedClassGroup = response.data;
      
      // If API doesn't return timetable entries or they're empty, try to get them from our state
      if (!updatedClassGroup.timetableEntries || updatedClassGroup.timetableEntries.length === 0) {
        const existingClassGroup = classGroups.find(cg => cg.id === classGroup.id);
        
        if (existingClassGroup && existingClassGroup.timetableEntries && existingClassGroup.timetableEntries.length > 0) {
          console.log('Using timetable entries from state:', existingClassGroup.timetableEntries);
          updatedClassGroup.timetableEntries = existingClassGroup.timetableEntries;
        } else if (classGroup.timetableEntries && classGroup.timetableEntries.length > 0) {
          console.log('Using timetable entries from passed class group:', classGroup.timetableEntries);
          updatedClassGroup.timetableEntries = classGroup.timetableEntries;
        }
      } else {
        console.log('Using timetable entries from API response:', updatedClassGroup.timetableEntries);
      }
      
      // Set the selected class group
      setSelectedClassGroup(updatedClassGroup);
      
      // Set timetable entries explicitly
      if (updatedClassGroup.timetableEntries && updatedClassGroup.timetableEntries.length > 0) {
        setTimetableEntries(updatedClassGroup.timetableEntries);
      } else {
        console.warn('No timetable entries found for class group');
        setTimetableEntries([]);
      }
      
      // Reset timetable entry form and potential conflicts
      setNewTimetableEntry({
        day: 'Monday',
        name: '',
        instructor: '',
        location: '',
        startTime: '',
        endTime: '',
        color: '#6366f1',
        type: 'Lecture'
      });
      setPotentialConflict(null);
      setAlternativeSuggestions([]);
      
      // Show the modal
      setShowTimetableModal(true);
    } catch (err) {
      console.error('Error opening timetable modal:', err);
      setError('Failed to load class group timetable. Please try again.');
      
      // Fallback to using the provided class group
      setSelectedClassGroup(classGroup);
      if (classGroup.timetableEntries && classGroup.timetableEntries.length > 0) {
        setTimetableEntries(classGroup.timetableEntries);
      } else {
        setTimetableEntries([]);
      }
      
      // Still show the modal even if there was an error
      setShowTimetableModal(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a branch
  const addBranch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await API.post('/api/branches', branchFormData);
      
      // Add to state
      const newBranch = response.data;
      setBranches([...branches, newBranch]);
      
      // Set expansion state for the new branch
      setExpandedBranches({
        ...expandedBranches,
        [newBranch.id]: false
      });
      
      // Close modal and reset form
      setShowAddBranchModal(false);
      setBranchFormData({
        name: '',
        description: ''
      });
      
      setMessage({
        text: 'Branch created successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error creating branch:', err);
      setError('Failed to create branch: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Update a branch
  const updateBranch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await API.put(`/api/branches/${selectedBranch.id}`, branchFormData);
      
      // Update in state
      setBranches(branches.map(b => 
        b.id === selectedBranch.id ? response.data : b
      ));
      
      // Close modal and reset form
      setShowEditBranchModal(false);
      
      setMessage({
        text: 'Branch updated successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error updating branch:', err);
      setError('Failed to update branch: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a branch
  const deleteBranch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch? This will not delete the class groups inside it.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage({ text: '', type: '' });
    
    try {
      await API.delete(`/api/branches/${id}`);
      
      // Remove from state
      setBranches(branches.filter(b => b.id !== id));
      
      // Update class groups to remove branch reference
      await fetchClassGroups();
      
      setMessage({
        text: 'Branch deleted successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting branch:', err);
      setError('Failed to delete branch: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Add a class group
  const addClassGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await API.post('/api/class-groups', formData);
      
      // Add to state
      setClassGroups([...classGroups, response.data]);
      
      // Close modal and reset form
      setShowAddModal(false);
      setFormData({
        name: '',
        courseCode: '',
        description: '',
        academicYear: '',
        semester: '',
        professorId: '',
        branchId: ''
      });
      
      // Refresh branches to update the class group lists
      if (formData.branchId) {
        await fetchBranches();
      }
      
      setMessage({
        text: 'Class group created successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error creating class group:', err);
      setError('Failed to create class group: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Update a class group
  const updateClassGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await API.put(`/api/class-groups/${selectedClassGroup.id}`, formData);
      
      // Update in state
      setClassGroups(classGroups.map(cg => 
        cg.id === selectedClassGroup.id ? response.data : cg
      ));
      
      // Close modal and reset form
      setShowEditModal(false);
      
      // Refresh branches to update the class group lists
      await fetchBranches();
      
      setMessage({
        text: 'Class group updated successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error updating class group:', err);
      setError('Failed to update class group: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a class group
  const deleteClassGroup = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class group?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage({ text: '', type: '' });
    
    try {
      await API.delete(`/api/class-groups/${id}`);
      
      // Remove from state
      setClassGroups(classGroups.filter(cg => cg.id !== id));
      
      // Refresh branches to update the class group lists
      await fetchBranches();
      
      setMessage({
        text: 'Class group deleted successfully',
        type: 'success'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Add student to class group with optimistic updates
  const addStudentToClass = async (studentId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Optimistically update UI first for instant feedback
      const studentToAdd = availableStudents.find(s => s.id === studentId);
      
      if (studentToAdd) {
        // Add to selected students immediately
        setSelectedStudents(prev => [...prev, studentToAdd]);
        
        // Remove from available students immediately
        setAvailableStudents(prev => prev.filter(s => s.id !== studentId));
        
        // Update selected class group with new student count
        setSelectedClassGroup(prev => ({
          ...prev,
          studentCount: (prev.studentCount || 0) + 1
        }));
        
        // Update class groups list with the updated student count
        setClassGroups(prevClassGroups => 
          prevClassGroups.map(cg => 
            cg.id === selectedClassGroup.id 
              ? { ...cg, studentCount: (cg.studentCount || 0) + 1 }
              : cg
          )
        );
        
        // Update branches state to reflect the updated student count
        setBranches(prevBranches => 
          prevBranches.map(branch => {
            if (!branch.classGroups) return branch;
            
            const updatedClassGroups = branch.classGroups.map(cg => 
              cg.id === selectedClassGroup.id 
                ? { ...cg, studentCount: (cg.studentCount || 0) + 1 } 
                : cg
            );
            
            return { ...branch, classGroups: updatedClassGroups };
          })
        );
      }
      
      // Then make the actual API call
      const response = await API.post(`/api/class-groups/${selectedClassGroup.id}/students/${studentId}`);
      
      // Validate the response
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Update with server data (to ensure consistency)
      setSelectedClassGroup(response.data);
      
      // Check if students data is included in response, otherwise don't update
      if (response.data.students && Array.isArray(response.data.students)) {
        setSelectedStudents(response.data.students);
      }
      
      // Refresh available students
      await fetchAvailableStudents(selectedClassGroup.id);
      
      setMessage({
        text: 'Student added to class successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error adding student to class:', err);
      setError('Failed to add student: ' + (err.response?.data?.message || 'Unknown error'));
      
      // Revert optimistic updates on error
      try {
        await fetchAvailableStudents(selectedClassGroup.id);
        
        const response = await API.get(`/api/class-groups/${selectedClassGroup.id}`);
        setSelectedClassGroup(response.data);
        
        if (response.data.students) {
          setSelectedStudents(response.data.students);
        } else {
          // If no students in response, fetch them separately
          const studentsResponse = await API.get(`/api/class-groups/${selectedClassGroup.id}/students`);
          if (studentsResponse && studentsResponse.data) {
            setSelectedStudents(studentsResponse.data);
          }
        }
      } catch (fetchErr) {
        console.error('Error fetching class group data after failed add:', fetchErr);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Remove student from class group
  const removeStudentFromClass = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Store the student being removed for optimistic UI update
      const studentToRemove = selectedStudents.find(s => s.id === studentId);
      
      if (studentToRemove) {
        // Remove from selected students immediately
        setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
        
        // Update selected class group with new student count
        setSelectedClassGroup(prev => ({
          ...prev,
          studentCount: Math.max((prev.studentCount || 0) - 1, 0)
        }));
        
        // Update class groups list with the updated student count
        setClassGroups(prevClassGroups => 
          prevClassGroups.map(cg => 
            cg.id === selectedClassGroup.id 
              ? { ...cg, studentCount: Math.max((cg.studentCount || 0) - 1, 0) }
              : cg
          )
        );
        
        // Update branches state to reflect the updated student count
        setBranches(prevBranches => 
          prevBranches.map(branch => {
            if (!branch.classGroups) return branch;
            
            const updatedClassGroups = branch.classGroups.map(cg => 
              cg.id === selectedClassGroup.id 
                ? { ...cg, studentCount: Math.max((cg.studentCount || 0) - 1, 0) } 
                : cg
            );
            
            return { ...branch, classGroups: updatedClassGroups };
          })
        );
        
        // Add the removed student to the available students list
        setAvailableStudents(prev => [...prev, studentToRemove]);
      }
      
      // Then make the actual API call
      const response = await API.delete(`/api/class-groups/${selectedClassGroup.id}/students/${studentId}`);
      
      // Validate the response
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Update with server data (to ensure consistency)
      setSelectedClassGroup(response.data);
      
      // Check if students data is included in response, otherwise don't update
      if (response.data.students && Array.isArray(response.data.students)) {
        setSelectedStudents(response.data.students);
      }
      
      // Refresh available students
      await fetchAvailableStudents(selectedClassGroup.id);
      
      setMessage({
        text: 'Student removed from class successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error removing student from class:', err);
      setError('Failed to remove student: ' + (err.response?.data?.message || 'Unknown error'));
      
      // Revert optimistic updates on error
      try {
        await fetchAvailableStudents(selectedClassGroup.id);
        
        const response = await API.get(`/api/class-groups/${selectedClassGroup.id}`);
        setSelectedClassGroup(response.data);
        
        if (response.data.students) {
          setSelectedStudents(response.data.students);
        } else {
          // If no students in response, fetch them separately
          const studentsResponse = await API.get(`/api/class-groups/${selectedClassGroup.id}/students`);
          if (studentsResponse && studentsResponse.data) {
            setSelectedStudents(studentsResponse.data);
          }
        }
      } catch (fetchErr) {
        console.error('Error fetching class group data after failed remove:', fetchErr);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Add timetable entry
  const addTimetableEntry = () => {
    // Validate form
    if (!newTimetableEntry.name || !newTimetableEntry.startTime || !newTimetableEntry.endTime) {
      setError('Please fill in all required fields for the timetable entry');
      return;
    }
    
    // Don't add if there's a conflict
    if (potentialConflict && potentialConflict.hasConflict) {
      setError('Please resolve the time conflict before adding this entry');
      return;
    }
    
    // Add entry to list
    setTimetableEntries([...timetableEntries, { ...newTimetableEntry }]);
    
    // Clear form
    setNewTimetableEntry({
      day: 'Monday',
      name: '',
      instructor: '',
      location: '',
      startTime: '',
      endTime: '',
      color: '#6366f1',
      type: 'Lecture'
    });
    
    // Clear conflict check state
    setPotentialConflict(null);
    setAlternativeSuggestions([]);
  };
  
  // Component to show current time usage with conflict highlighting
  const TimetableVisualization = ({ classGroup, timetableEntries, currentTimeSlot }) => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [];
    
    // Generate time slots from 8:00 to 18:00
    for (let hour = 8; hour < 18; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    // Organize timetable entries by day
    const entriesByDay = {};
    daysOfWeek.forEach(day => {
      entriesByDay[day] = [];
    });
    
    if (timetableEntries && timetableEntries.length > 0) {
      timetableEntries.forEach(entry => {
        if (entriesByDay[entry.day]) {
          entriesByDay[entry.day].push(entry);
        }
      });
    }
    
    // Helper function to check if a time slot has a conflict with the current time slot
    const hasConflict = (entry) => {
      if (!currentTimeSlot || !currentTimeSlot.day || !currentTimeSlot.startTime || !currentTimeSlot.endTime) {
        return false;
      }
      
      if (entry.day !== currentTimeSlot.day) {
        return false;
      }
      
      const entryStart = convertTimeToMinutes(entry.startTime);
      const entryEnd = convertTimeToMinutes(entry.endTime);
      const currentStart = convertTimeToMinutes(currentTimeSlot.startTime);
      const currentEnd = convertTimeToMinutes(currentTimeSlot.endTime);
      
      return !(entryEnd <= currentStart || currentEnd <= entryStart);
    };
    
    // Helper function to calculate position and height based on time
    const getEntryStyle = (entry) => {
      const startParts = entry.startTime.split(':');
      const endParts = entry.endTime.split(':');
      
      const startHour = parseInt(startParts[0]);
      const startMinute = parseInt(startParts[1]);
      const endHour = parseInt(endParts[0]);
      const endMinute = parseInt(endParts[1]);
      
      const startPosition = (startHour - 8) * 60 + startMinute;
      const duration = (endHour - startHour) * 60 + (endMinute - startMinute);
      
      const isInConflict = hasConflict(entry);
      
      const baseStyle = {
        top: `${startPosition / 10}px`,
        height: `${duration / 10}px`,
        backgroundColor: entry.color || '#6366f1',
      };
      
      // Add visual indicators for conflicts
      if (isInConflict) {
        return {
          ...baseStyle,
          boxShadow: '0 0 0 2px #f56565, 0 0 8px rgba(239, 68, 68, 0.5)',
          animation: 'pulse-conflict 2s infinite'
        };
      }
      
      return baseStyle;
    };
    
    return (
      <div className="timetable-visualization">
        <div className="timetable-header">
          <div className="time-column">
            <div className="time-header">Time</div>
            {timeSlots.map(time => (
              <div key={time} className="time-slot">{time}</div>
            ))}
          </div>
          
          {daysOfWeek.map(day => (
            <div key={day} className="day-column">
              <div className="day-header">{day}</div>
              <div className="day-content">
                {entriesByDay[day].map((entry, index) => (
                  <div
                    key={index}
                    className={`timetable-entry ${hasConflict(entry) ? 'has-conflict' : ''}`}
                    style={getEntryStyle(entry)}
                  >
                    {hasConflict(entry) && (
                      <div className="conflict-indicator">
                        <i className="fas fa-exclamation"></i>
                      </div>
                    )}
                    <div className="entry-content">
                      <div className="entry-name">{entry.name}</div>
                      <div className="entry-time">
                        {entry.startTime} - {entry.endTime}
                      </div>
                      {entry.location && (
                        <div className="entry-location">{entry.location}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Remove timetable entry
  const removeTimetableEntry = (index) => {
    setTimetableEntries(timetableEntries.filter((_, i) => i !== index));
  };
  
  // Format conflict errors for better display
  const formatTimetableConflictError = (errorMessage) => {
    const conflictPrefix = 'Timetable conflicts detected: ';
    
    if (errorMessage.startsWith(conflictPrefix)) {
      // Extract the conflict details
      const conflictDetails = errorMessage.substring(conflictPrefix.length);
      
      // Format the HTML for the error message
      return (
        <div className="timetable-conflicts">
          <p><strong>Cannot save timetable due to scheduling conflicts:</strong></p>
          <ul>
            {conflictDetails.split('\n').filter(line => line.trim().length > 0).map((line, index) => (
              <li key={index}>{line.startsWith('- ') ? line.substring(2) : line}</li>
            ))}
          </ul>
          <p>Please adjust the timetable to resolve these conflicts.</p>
        </div>
      );
    }
    
    // If it's not in the expected format, return the original message
    return errorMessage;
  };
  
  // Save timetable changes with improved state management for persistence and conflict handling
  const saveTimetable = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await API.put(
        `/api/class-groups/${selectedClassGroup.id}/timetable`, 
        timetableEntries
      );
      
      // Get the updated class group from the response
      const updatedClassGroup = response.data;
      
      // Make sure the timetable entries are preserved
      if (!updatedClassGroup.timetableEntries || updatedClassGroup.timetableEntries.length === 0) {
        // If API response doesn't include timetable entries, add them from our current state
        updatedClassGroup.timetableEntries = [...timetableEntries];
      }
      
      // Update the class group in the classGroups state with preserved timetable entries
      setClassGroups(classGroups.map(cg => 
        cg.id === selectedClassGroup.id ? {
          ...updatedClassGroup,
          timetableEntries: updatedClassGroup.timetableEntries || timetableEntries
        } : cg
      ));
      
      // Update selected class group with the updated data including timetable entries
      setSelectedClassGroup({
        ...updatedClassGroup,
        timetableEntries: updatedClassGroup.timetableEntries || timetableEntries
      });
      
      // Ensure branches are updated with the latest class group data
      fetchBranches();
      
      // Close modal after successful update
      setShowTimetableModal(false);
      
      setMessage({
        text: 'Class timetable updated successfully',
        type: 'success'
      });
      
      console.log('Timetable saved successfully. Entries:', timetableEntries);
    } catch (err) {
      console.error('Error updating timetable:', err);
      
      // Check if the error contains a conflict message
      const errorMessage = err.response?.data?.message || 'Failed to update timetable';
      
      // If the error message contains conflict information, format it for better display
      if (errorMessage.includes('Timetable conflicts detected')) {
        setError(formatTimetableConflictError(errorMessage));
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading && branches.length === 0 && classGroups.length === 0) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>Branches and Class Groups Management</h2>
          <button 
            className="btn-primary"
            onClick={openAddBranchModal}
            disabled={loading}
            >
            <i className="fas fa-plus"></i> Create New Branch
          </button>
        </div>
        
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}
        
        {error && !showStudentsModal && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {/* Branches and Classes Structure */}
        <div className="branches-container">
          {branches.length === 0 ? (
            <div className="no-data-message">
              <p>No branches found. Create a branch to organize your class groups.</p>
            </div>
          ) : (
            branches.map(branch => (
              <div key={branch.id} className="branch-card">
                <div 
                  className="branch-header collapsible"
                  onClick={() => toggleBranchExpansion(branch.id)}
                >
                  <div className="branch-header-content">
                    <i className={`fas fa-chevron-${expandedBranches[branch.id] ? 'down' : 'right'} mr-2`}></i>
                    <h3>{branch.name}</h3>
                    <span className="branch-class-count">
                      ({branch.classGroups ? branch.classGroups.length : 0} classes)
                    </span>
                  </div>
                  <div className="branch-actions">
                    <button 
                      className="btn-table btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditBranchModal(branch);
                      }}
                      disabled={loading}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-table btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBranch(branch.id);
                      }}
                      disabled={loading}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    <button 
                      className="btn-table btn-add"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddModal(branch);
                      }}
                      disabled={loading}
                    >
                      <i className="fas fa-plus"></i> Add Class
                    </button>
                  </div>
                </div>
                <p className="branch-description">{branch.description || 'No description provided.'}</p>
                
                {expandedBranches[branch.id] && (
                  <div className="branch-classes">
                    {branch.classGroups && branch.classGroups.length > 0 ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Course Code</th>
                            <th>Name</th>
                            <th>Semester</th>
                            <th>Professor</th>
                            <th>Students</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branch.classGroups.map(classGroup => (
                            <tr key={classGroup.id}>
                              <td>{classGroup.courseCode}</td>
                              <td>{classGroup.name}</td>
                              <td>{classGroup.semester} {classGroup.academicYear}</td>
                              <td>{classGroup.professorName || 'Not assigned'}</td>
                              <td>{classGroup.studentCount || 0}</td>
                              <td>
                                <div className="table-actions">
                                  <button 
                                    className="btn-table btn-view"
                                    onClick={() => selectClassGroup(classGroup)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-eye"></i>
                                  </button>
                                  <button 
                                    className="btn-table btn-edit"
                                    onClick={() => openEditModal(classGroup)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button 
                                    className="btn-table btn-view"
                                    onClick={() => openStudentsModal(classGroup)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-users"></i>
                                  </button>
                                  <button 
                                    className="btn-table btn-view"
                                    onClick={() => openTimetableModal(classGroup)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-calendar"></i>
                                  </button>
                                  <button 
                                    className="btn-table btn-delete"
                                    onClick={() => deleteClassGroup(classGroup.id)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="no-classes-message">No class groups in this branch. Add a class group to get started.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Branch</h2>
              <span 
                className="close-modal"
                onClick={() => !loading && setShowAddBranchModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={addBranch}>
                <div className="form-group">
                  <label htmlFor="name">Branch Name *</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={branchFormData.name}
                    onChange={handleBranchFormChange}
                    required 
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea 
                    id="description" 
                    name="description"
                    value={branchFormData.description}
                    onChange={handleBranchFormChange}
                    disabled={loading}
                    rows={3}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Branch'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Branch Modal */}
      {showEditBranchModal && selectedBranch && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Branch</h2>
              <span 
                className="close-modal"
                onClick={() => !loading && setShowEditBranchModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={updateBranch}>
                <div className="form-group">
                  <label htmlFor="name">Branch Name *</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={branchFormData.name}
                    onChange={handleBranchFormChange}
                    required 
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea 
                    id="description" 
                    name="description"
                    value={branchFormData.description}
                    onChange={handleBranchFormChange}
                    disabled={loading}
                    rows={3}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Branch'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Class Group Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Class Group{selectedBranch ? ` in ${selectedBranch.name}` : ''}</h2>
              <span 
                className="close-modal"
                onClick={() => !loading && setShowAddModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={addClassGroup}>
                <div className="form-group">
                  <label htmlFor="courseCode">Course Code *</label>
                  <input 
                    type="text" 
                    id="courseCode" 
                    name="courseCode"
                    value={formData.courseCode}
                    onChange={handleFormChange}
                    required 
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="name">Class Name *</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required 
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea 
                    id="description" 
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    disabled={loading}
                    rows={3}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="academicYear">Academic Year *</label>
                    <select 
                      id="academicYear" 
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleFormChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Academic Year</option>
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="semester">Semester *</label>
                    <select 
                      id="semester" 
                      name="semester"
                      value={formData.semester}
                      onChange={handleFormChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(semester => (
                        <option key={semester} value={semester}>{semester}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="professorId">Professor</label>
                  <select 
                    id="professorId" 
                    name="professorId"
                    value={formData.professorId}
                    onChange={handleFormChange}
                    disabled={loading}
                  >
                    <option value="">Select Professor</option>
                    {professors.map(professor => (
                      <option key={professor.id} value={professor.id}>
                        {professor.firstName} {professor.lastName}
                      </option>
                    ))}
                  </select>
                  <div className="timetable-info">
                    <p><strong>Note:</strong> Assigning a professor to this class group will automatically update the professor's timetable with this class's schedule.</p>
                  </div>
                </div>
                
                {!selectedBranch && (
                  <div className="form-group">
                    <label htmlFor="branchId">Branch</label>
                    <select 
                      id="branchId" 
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleFormChange}
                      disabled={loading}
                    >
                      <option value="">Unassigned</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Class Group'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Class Group Modal */}
      {showEditModal && selectedClassGroup && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Class Group</h2>
              <span 
                className="close-modal"
                onClick={() => !loading && setShowEditModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={updateClassGroup}>
                <div className="form-group">
                  <label htmlFor="courseCode">Course Code *</label>
                  <input 
                    type="text" 
                    id="courseCode" 
                    name="courseCode"
                    value={formData.courseCode}
                    onChange={handleFormChange}
                    required 
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="name">Class Name *</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required 
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea 
                    id="description" 
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    disabled={loading}
                    rows={3}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="academicYear">Academic Year *</label>
                    <select 
                      id="academicYear" 
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleFormChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Academic Year</option>
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="semester">Semester *</label>
                    <select 
                      id="semester" 
                      name="semester"
                      value={formData.semester}
                      onChange={handleFormChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(semester => (
                        <option key={semester} value={semester}>{semester}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="professorId">Professor</label>
                  <select 
                    id="professorId" 
                    name="professorId"
                    value={formData.professorId}
                    onChange={handleFormChange}
                    disabled={loading}
                  >
                    <option value="">Select Professor</option>
                    {professors.map(professor => (
                      <option key={professor.id} value={professor.id}>
                        {professor.firstName} {professor.lastName}
                      </option>
                    ))}
                  </select>
                  <div className="timetable-info">
                    <p><strong>Note:</strong> Changing the professor assignment will automatically update both the previous and new professor's timetables.</p>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="branchId">Branch</label>
                  <select 
                    id="branchId" 
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleFormChange}
                    disabled={loading}
                  >
                    <option value="">Unassigned</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Class Group'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Manage Students Modal */}
      {showStudentsModal && selectedClassGroup && (
        <div className="modal">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Manage Students - {selectedClassGroup.courseCode}: {selectedClassGroup.name}</h2>
              <span 
                className="close-modal"
                onClick={() => !loading && setShowStudentsModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              {/* Show error with retry button */}
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                  <button 
                    className="btn-retry"
                    onClick={retryLoadStudents}
                    disabled={loading}
                  >
                    <i className="fas fa-sync-alt"></i> Retry
                  </button>
                </div>
              )}
              
              <div className="student-management-container">
                <div className="student-list-section">
                  <h3>Current Students ({selectedStudents.length})</h3>
                  {loading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Loading students...</p>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudents.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center">
                              {error ? 'Could not load students' : 'No students in this class yet'}
                            </td>
                          </tr>
                        ) : (
                          selectedStudents.map(student => (
                            <tr key={student.id}>
                              <td>{student.id}</td>
                              <td>{student.firstName} {student.lastName}</td>
                              <td>{student.email}</td>
                              <td>
                                <button 
                                  className="btn-table btn-delete"
                                  onClick={() => removeStudentFromClass(student.id)}
                                  disabled={loading}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                
                <div className="available-students-section">
                  <h3>Available Students ({availableStudents.length})</h3>
                  {loading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Loading available students...</p>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableStudents.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center">
                              {error ? 'Could not load available students' : 'No more students available to add'}
                            </td>
                          </tr>
                        ) : (
                          availableStudents.map(student => (
                            <tr key={student.id}>
                              <td>{student.id}</td>
                              <td>{student.firstName} {student.lastName}</td>
                              <td>{student.email}</td>
                              <td>
                                <button 
                                  className="btn-table btn-edit"
                                  onClick={() => addStudentToClass(student.id)}
                                  disabled={loading}
                                >
                                  Add to Class
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              
              <div className="affected-users">
                <h4>Timetable Impact</h4>
                <p>
                  <strong>Note:</strong> When you add or remove students from this class, their timetables are automatically updated to include or exclude this class's schedule.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowStudentsModal(false)}
                disabled={loading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Manage Timetable Modal */}
      {showTimetableModal && selectedClassGroup && (
        <div className="modal">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Manage Class Timetable - {selectedClassGroup.courseCode}: {selectedClassGroup.name}</h2>
              <span 
                className="close-modal"
                onClick={() => !loading && setShowTimetableModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <div className="affected-users">
                <h4>Timetable will auto-update for:</h4>
                <ul>{selectedClassGroup.professorName && (
                    <li><strong>Professor:</strong> {selectedClassGroup.professorName}</li>
                  )}
                  <li><strong>Students:</strong> {selectedClassGroup.studentCount || 0} enrolled students</li>
                </ul>
                <p>
                  All changes made to this timetable will be automatically reflected in the schedules 
                  of all associated users.
                </p>
              </div>

              <div className="timetable-section">
                <h3>Add Timetable Entry</h3>
                <div className="timetable-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="day">Day</label>
                      <select
                        id="day"
                        name="day"
                        value={newTimetableEntry.day}
                        onChange={handleTimetableEntryChange}
                        disabled={loading}
                      >
                        {daysOfWeek.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="type">Type</label>
                      <select
                        id="type"
                        name="type"
                        value={newTimetableEntry.type}
                        onChange={handleTimetableEntryChange}
                        disabled={loading}
                      >
                        {classTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="color">Color</label>
                      <select
                        id="color"
                        name="color"
                        value={newTimetableEntry.color}
                        onChange={handleTimetableEntryChange}
                        disabled={loading}
                        style={{ backgroundColor: newTimetableEntry.color, color: '#fff' }}
                      >
                        {availableColors.map(color => (
                          <option 
                            key={color.value} 
                            value={color.value}
                            style={{ backgroundColor: color.value, color: '#fff' }}
                          >
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="name">Activity Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="e.g. Introduction to Programming"
                      value={newTimetableEntry.name}
                      onChange={handleTimetableEntryChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="instructor">Instructor</label>
                      <input
                        type="text"
                        id="instructor"
                        name="instructor"
                        placeholder="e.g. Professor Johnson"
                        value={newTimetableEntry.instructor}
                        onChange={handleTimetableEntryChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="location">Location</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        placeholder="e.g. Room 101"
                        value={newTimetableEntry.location}
                        onChange={handleTimetableEntryChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="startTime">Start Time *</label>
                      <input
                        type="time"
                        id="startTime"
                        name="startTime"
                        value={newTimetableEntry.startTime}
                        onChange={handleTimetableEntryChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="endTime">End Time *</label>
                      <input
                        type="time"
                        id="endTime"
                        name="endTime"
                        value={newTimetableEntry.endTime}
                        onChange={handleTimetableEntryChange}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Show conflict checking status or warnings */}
                  {isPotentialConflictChecking && (
                    <div className="checking-conflicts">
                      <i className="fas fa-sync fa-spin"></i> Checking for scheduling conflicts...
                    </div>
                  )}
                  
                  {/* Show conflict warning if detected */}
                  <ConflictWarning conflict={potentialConflict} />
                  
                  {/* Show alternative time suggestions */}
                  <AlternativeSuggestions 
                    alternatives={alternativeSuggestions} 
                    onSelectAlternative={applyAlternativeSuggestion} 
                  />
                  
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={addTimetableEntry}
                    disabled={loading || (potentialConflict && potentialConflict.hasConflict)}
                  >
                    <i className="fas fa-plus"></i> Add Timetable Entry
                  </button>
                  
                  {potentialConflict && potentialConflict.hasConflict && (
                    <div className="conflict-button-info">
                      <i className="fas fa-info-circle"></i> Please adjust the time or select an alternative to resolve conflicts before adding
                    </div>
                  )}
                </div>
                
                <h3>Current Timetable</h3>
                {timetableEntries.length === 0 ? (
                  <p>No timetable entries yet</p>
                ) : (
                  <div>
                    {/* Live timetable visualization */}
                    <div className="timetable-visualization-container">
                      <h4>Timetable Visualization</h4>
                      <TimetableVisualization 
                        classGroup={selectedClassGroup} 
                        timetableEntries={timetableEntries}
                        currentTimeSlot={newTimetableEntry.startTime && newTimetableEntry.endTime ? newTimetableEntry : null}
                      />
                    </div>
                    
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Time</th>
                          <th>Activity</th>
                          <th>Type</th>
                          <th>Location</th>
                          <th>Instructor</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetableEntries.map((entry, index) => (
                          <tr key={index} style={{ borderLeft: `4px solid ${entry.color}` }}>
                            <td>{entry.day}</td>
                            <td>{entry.startTime} - {entry.endTime}</td>
                            <td>{entry.name}</td>
                            <td>{entry.type}</td>
                            <td>{entry.location || 'N/A'}</td>
                            <td>{entry.instructor || 'N/A'}</td>
                            <td>
                              <button 
                                className="btn-table btn-delete"
                                onClick={() => removeTimetableEntry(index)}
                                disabled={loading}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowTimetableModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={saveTimetable}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Timetable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassGroupManagement;