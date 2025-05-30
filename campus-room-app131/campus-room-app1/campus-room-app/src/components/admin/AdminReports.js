import React, { useState, useEffect } from 'react';
import '../../styles/unifié.css';
import SharedDashboardService from '../../services/SharedDashboardService';
import { API } from '../../api'; // Import API from the same source as ClassGroupManagement

const AdminReports = () => {
  // State for REAL data with elegant organization
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    activeReservations: 0,
    pendingDemands: 0,
    totalUsers: 0,
    totalClassGroups: 0,
    classroomDetails: '',
    userDetails: '',
    isLoading: true
  });
  
  const [detailedRoomData, setDetailedRoomData] = useState([]);
  const [detailedUserActivity, setDetailedUserActivity] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [pendingDemands, setPendingDemands] = useState([]);
  const [roomOccupancy, setRoomOccupancy] = useState([]);
  const [branchesData, setBranchesData] = useState([]);
  const [branchStatistics, setBranchStatistics] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  
  useEffect(() => {
    console.log("AdminReports component mounted - using REAL branch data from same API as ClassGroupManagement");
    fetchDetailedReportData();
  }, [refreshTrigger]);
  
  // Fetch and organize REAL detailed data elegantly
  const fetchDetailedReportData = async () => {
    try {
      console.log("⚠️ Fetching REAL detailed data for elegant presentation");
      setLoading(true);
      setError(null);
      
      // Get REAL data from shared service
      const dashboardData = await SharedDashboardService.fetchDashboardData(true);
      console.log("✅ REAL detailed data received:", dashboardData);
      
      await processDetailedRealData(dashboardData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error("❌ Error fetching detailed data:", error);
      setError("Failed to load detailed report data: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };
  
  // Process REAL data into elegant detailed views
  const processDetailedRealData = async (dashboardData) => {
    // Set basic stats
    if (dashboardData.stats) {
      setStats(dashboardData.stats);
    }
    
    // Set REAL reservations data
    if (dashboardData.allReservations) {
      setAllReservations(dashboardData.allReservations);
    }
    
    if (dashboardData.recentReservations) {
      setRecentReservations(dashboardData.recentReservations);
    }
    
    if (dashboardData.pendingDemands) {
      setPendingDemands(dashboardData.pendingDemands);
    }
    
    // Create detailed room data from REAL reservations
    if (dashboardData.allReservations && dashboardData.classrooms) {
      const roomDetails = createDetailedRoomData(dashboardData.allReservations, dashboardData.classrooms);
      setDetailedRoomData(roomDetails);
    }
    
    // Create detailed user activity from REAL reservations
    if (dashboardData.allReservations && dashboardData.users) {
      const userDetails = createDetailedUserData(dashboardData.allReservations, dashboardData.users);
      setDetailedUserActivity(userDetails);
    }
    
    // Create room occupancy from REAL data
    if (dashboardData.allReservations && dashboardData.classrooms) {
      const occupancy = createRoomOccupancyData(dashboardData.allReservations, dashboardData.classrooms);
      setRoomOccupancy(occupancy);
    }
    
    // Fetch and process REAL branch data using the SAME API as ClassGroupManagement
    await fetchRealBranchData();
  };
  
  // Create detailed room data from REAL reservations
  const createDetailedRoomData = (reservations, classrooms) => {
    const roomMap = {};
    
    // Group reservations by room
    reservations.forEach(reservation => {
      const roomName = reservation.classroom || reservation.room || 'Unknown';
      
      if (!roomMap[roomName]) {
        roomMap[roomName] = {
          roomName,
          totalBookings: 0,
          currentBookings: [],
          recentBookings: [],
          bookingsByRole: { professor: 0, student: 0, admin: 0 },
          bookingsByStatus: { approved: 0, pending: 0, cancelled: 0 },
          mostFrequentUsers: {},
          bookingPurposes: {}
        };
      }
      
      const room = roomMap[roomName];
      room.totalBookings++;
      
      // Add to recent bookings (last 10)
      if (room.recentBookings.length < 10) {
        room.recentBookings.push({
          id: reservation.id,
          user: reservation.reservedBy || reservation.requestedBy,
          role: reservation.role,
          date: reservation.date,
          time: reservation.time,
          status: reservation.status,
          purpose: reservation.purpose
        });
      }
      
      // Count by role
      const role = (reservation.role || 'unknown').toLowerCase();
      if (room.bookingsByRole[role] !== undefined) {
        room.bookingsByRole[role]++;
      }
      
      // Count by status
      const status = (reservation.status || 'unknown').toLowerCase();
      if (room.bookingsByStatus[status] !== undefined) {
        room.bookingsByStatus[status]++;
      }
      
      // Track frequent users
      const user = reservation.reservedBy || reservation.requestedBy || 'Unknown';
      room.mostFrequentUsers[user] = (room.mostFrequentUsers[user] || 0) + 1;
      
      // Track purposes
      if (reservation.purpose) {
        room.bookingPurposes[reservation.purpose] = (room.bookingPurposes[reservation.purpose] || 0) + 1;
      }
      
      // Check if currently booked (today's approved reservations)
      const today = new Date().toISOString().split('T')[0];
      if (reservation.date === today && reservation.status?.toLowerCase() === 'approved') {
        room.currentBookings.push({
          user: reservation.reservedBy || reservation.requestedBy,
          time: reservation.time,
          purpose: reservation.purpose,
          role: reservation.role
        });
      }
    });
    
    // Convert to array and sort by total bookings
    return Object.values(roomMap)
      .map(room => ({
        ...room,
        topUser: Object.entries(room.mostFrequentUsers).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
        topPurpose: Object.entries(room.bookingPurposes).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
        usagePercentage: reservations.length > 0 ? ((room.totalBookings / reservations.length) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.totalBookings - a.totalBookings);
  };
  
  // Create detailed user data from REAL reservations
  const createDetailedUserData = (reservations, users) => {
    const userMap = {};
    
    reservations.forEach(reservation => {
      const userName = reservation.reservedBy || reservation.requestedBy || 'Unknown';
      
      if (!userMap[userName]) {
        userMap[userName] = {
          userName,
          totalBookings: 0,
          recentBookings: [],
          role: reservation.role || 'Unknown',
          bookingsByStatus: { approved: 0, pending: 0, cancelled: 0 },
          favoriteRooms: {},
          bookingPurposes: {},
          bookingTimes: {},
          lastBookingDate: null
        };
      }
      
      const user = userMap[userName];
      user.totalBookings++;
      
      // Add to recent bookings (last 5)
      if (user.recentBookings.length < 5) {
        user.recentBookings.push({
          id: reservation.id,
          room: reservation.classroom || reservation.room,
          date: reservation.date,
          time: reservation.time,
          status: reservation.status,
          purpose: reservation.purpose
        });
      }
      
      // Update last booking date
      if (!user.lastBookingDate || reservation.date > user.lastBookingDate) {
        user.lastBookingDate = reservation.date;
      }
      
      // Count by status
      const status = (reservation.status || 'unknown').toLowerCase();
      if (user.bookingsByStatus[status] !== undefined) {
        user.bookingsByStatus[status]++;
      }
      
      // Track favorite rooms
      const room = reservation.classroom || reservation.room || 'Unknown';
      user.favoriteRooms[room] = (user.favoriteRooms[room] || 0) + 1;
      
      // Track purposes
      if (reservation.purpose) {
        user.bookingPurposes[reservation.purpose] = (user.bookingPurposes[reservation.purpose] || 0) + 1;
      }
      
      // Track booking times
      if (reservation.time) {
        const hour = reservation.time.split(':')[0];
        user.bookingTimes[hour] = (user.bookingTimes[hour] || 0) + 1;
      }
    });
    
    // Convert to array and sort by total bookings
    return Object.values(userMap)
      .map(user => ({
        ...user,
        favoriteRoom: Object.entries(user.favoriteRooms).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
        topPurpose: Object.entries(user.bookingPurposes).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
        preferredTime: Object.entries(user.bookingTimes).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
        successRate: user.totalBookings > 0 ? ((user.bookingsByStatus.approved / user.totalBookings) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.totalBookings - a.totalBookings);
  };
  
  // Create room occupancy data from REAL reservations
  const createRoomOccupancyData = (reservations, classrooms) => {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    return classrooms.map(classroom => {
      const roomName = classroom.name || classroom.id;
      
      // Find current reservation
      const currentReservation = reservations.find(r => {
        const reservationHour = parseInt((r.time || '12:00').split(':')[0]);
        return (r.classroom === roomName || r.room === roomName) &&
               r.date === today &&
               r.status?.toLowerCase() === 'approved' &&
               reservationHour <= currentHour &&
               reservationHour + 2 > currentHour; // assuming 2-hour slots
      });
      
      // Find next reservation
      const futureReservations = reservations.filter(r => {
        return (r.classroom === roomName || r.room === roomName) &&
               r.status?.toLowerCase() === 'approved' &&
               (r.date > today || (r.date === today && parseInt((r.time || '12:00').split(':')[0]) > currentHour));
      }).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '').localeCompare(b.time || '');
      });
      
      return {
        roomName,
        isOccupied: !!currentReservation,
        currentReservation: currentReservation ? {
          user: currentReservation.reservedBy || currentReservation.requestedBy,
          role: currentReservation.role,
          purpose: currentReservation.purpose,
          startTime: currentReservation.time,
          endTime: calculateEndTime(currentReservation.time)
        } : null,
        nextReservation: futureReservations[0] ? {
          user: futureReservations[0].reservedBy || futureReservations[0].requestedBy,
          role: futureReservations[0].role,
          date: futureReservations[0].date,
          time: futureReservations[0].time,
          purpose: futureReservations[0].purpose
        } : null,
        todayReservations: reservations.filter(r => 
          (r.classroom === roomName || r.room === roomName) && 
          r.date === today
        ).length
      };
    });
  };
  
  // Helper function to calculate end time
  const calculateEndTime = (startTime) => {
    if (!startTime) return 'Unknown';
    const [hours, minutes] = startTime.split(':');
    const endHour = parseInt(hours) + 2; // assuming 2-hour slots
    return `${endHour.toString().padStart(2, '0')}:${minutes}`;
  };
  
  // Fetch REAL branch data using the SAME APIs as ClassGroupManagement component
  const fetchRealBranchData = async () => {
    try {
      console.log("🏢 Fetching REAL branch data using same API as ClassGroupManagement");
      
      // Use the SAME API endpoint as ClassGroupManagement component
      const branchesResponse = await API.get('/api/branches');
      console.log("✅ Real branches data received:", branchesResponse.data);
      
      if (branchesResponse && branchesResponse.data && branchesResponse.data.length > 0) {
        const processedBranches = await processRealBranchAnalytics(branchesResponse.data);
        setBranchesData(processedBranches);
        
        // Calculate overall branch statistics
        const stats = calculateBranchStatistics(processedBranches);
        setBranchStatistics(stats);
        
        console.log("✅ Processed real branch analytics:", processedBranches);
      } else {
        console.warn("⚠️ No branches data received from API");
        setBranchesData([]);
        setBranchStatistics({
          totalBranches: 0,
          totalStudents: 0,
          totalClassGroups: 0,
          averageStudentsPerBranch: 0,
          averageClassGroupsPerBranch: 0,
          mostPopulated: null,
          leastPopulated: null
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching REAL branch data:', error);
      // Don't fall back to sample data - show error instead
      setError('Failed to load branch data: ' + (error.message || 'Unknown error'));
      setBranchesData([]);
      setBranchStatistics({
        totalBranches: 0,
        totalStudents: 0,
        totalClassGroups: 0,
        averageStudentsPerBranch: 0,
        averageClassGroupsPerBranch: 0,
        mostPopulated: null,
        leastPopulated: null
      });
    }
  };
  
  // Process REAL branch analytics from API data using SAME logic as ClassGroupManagement
  const processRealBranchAnalytics = async (branches) => {
    const processedBranches = [];
    
    for (const branch of branches) {
      try {
        console.log(`Processing branch: ${branch.name} (ID: ${branch.id})`);
        
        // Fetch students for this branch using SAME API as ClassGroupManagement
        let branchStudents = [];
        try {
          const studentsResponse = await API.get(`/api/branches/${branch.id}/students`);
          if (studentsResponse && studentsResponse.data) {
            branchStudents = studentsResponse.data;
            console.log(`✅ Found ${branchStudents.length} students for branch ${branch.name}`);
          }
        } catch (err) {
          console.error(`❌ Error fetching students for branch ${branch.id}:`, err);
        }
        
        // Get class groups from branch data (they should be included in the branch response)
        let branchClassGroups = branch.classGroups || [];
        console.log(`✅ Found ${branchClassGroups.length} class groups for branch ${branch.name}`);
        
        // Calculate branch analytics using REAL data
        const analytics = {
          id: branch.id,
          name: branch.name,
          description: branch.description || 'No description provided',
          totalStudents: branchStudents.length,
          totalClassGroups: branchClassGroups.length,
          students: branchStudents,
          classGroups: branchClassGroups,
          
          // Calculate student analytics from REAL data
          studentsByYear: calculateStudentsByYear(branchStudents),
          studentsByGender: calculateStudentsByGender(branchStudents),
          activeStudents: branchStudents.filter(s => s.status !== 'inactive').length,
          
          // Calculate class group analytics from REAL data
          classGroupsBySemester: calculateClassGroupsBySemester(branchClassGroups),
          totalCourses: branchClassGroups.length,
          activeCourses: branchClassGroups.filter(cg => cg.status !== 'inactive').length,
          
          // Calculate engagement metrics from REAL data
          averageStudentsPerClass: branchClassGroups.length > 0 ? 
            (branchStudents.length / branchClassGroups.length).toFixed(1) : 0,
          
          // Recent activity from REAL data
          recentEnrollments: getRecentEnrollments(branchStudents),
          upcomingClasses: getUpcomingClasses(branchClassGroups)
        };
        
        processedBranches.push(analytics);
        console.log(`✅ Processed analytics for branch ${branch.name}:`, analytics);
        
      } catch (error) {
        console.error(`❌ Error processing branch ${branch.id}:`, error);
        // Still add the branch with basic info even if detailed processing fails
        processedBranches.push({
          id: branch.id,
          name: branch.name,
          description: branch.description || 'No description provided',
          totalStudents: branch.studentsCount || 0,
          totalClassGroups: branch.classGroups ? branch.classGroups.length : 0,
          students: [],
          classGroups: branch.classGroups || [],
          studentsByYear: [],
          studentsByGender: { male: 0, female: 0, other: 0, unspecified: 0 },
          activeStudents: 0,
          classGroupsBySemester: [],
          totalCourses: 0,
          activeCourses: 0,
          averageStudentsPerClass: "0",
          recentEnrollments: [],
          upcomingClasses: []
        });
      }
    }
    
    return processedBranches.sort((a, b) => b.totalStudents - a.totalStudents);
  };
  
  // Helper functions for branch analytics using REAL data
  const calculateStudentsByYear = (students) => {
    const yearCounts = {};
    const currentYear = new Date().getFullYear();
    
    students.forEach(student => {
      // Use enrollmentYear from student data or calculate from createdAt
      const year = student.enrollmentYear || 
        (student.createdAt ? new Date(student.createdAt).getFullYear() : currentYear);
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    return Object.entries(yearCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year);
  };
  
  const calculateStudentsByGender = (students) => {
    const genderCounts = { male: 0, female: 0, other: 0, unspecified: 0 };
    
    students.forEach(student => {
      const gender = (student.gender || 'unspecified').toLowerCase();
      if (genderCounts[gender] !== undefined) {
        genderCounts[gender]++;
      } else {
        genderCounts.unspecified++;
      }
    });
    
    return genderCounts;
  };
  
  const calculateClassGroupsBySemester = (classGroups) => {
    const semesterCounts = {};
    
    classGroups.forEach(cg => {
      const key = `${cg.semester} ${cg.academicYear}`;
      semesterCounts[key] = (semesterCounts[key] || 0) + 1;
    });
    
    return Object.entries(semesterCounts)
      .map(([semester, count]) => ({ semester, count }))
      .sort((a, b) => a.semester.localeCompare(b.semester));
  };
  
  const getRecentEnrollments = (students) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return students.filter(student => {
      const enrollmentDate = new Date(student.createdAt || student.enrollmentDate || new Date());
      return enrollmentDate >= oneMonthAgo;
    }).slice(0, 5); // Get last 5 recent enrollments
  };
  
  const getUpcomingClasses = (classGroups) => {
    // Return actual class group data instead of timetable data
    return classGroups.slice(0, 3).map(cg => ({
      courseCode: cg.courseCode,
      name: cg.name,
      semester: cg.semester,
      academicYear: cg.academicYear,
      professorName: cg.professorName
    }));
  };
  
  const calculateBranchStatistics = (branches) => {
    const totalBranches = branches.length;
    const totalStudents = branches.reduce((sum, branch) => sum + branch.totalStudents, 0);
    const totalClassGroups = branches.reduce((sum, branch) => sum + branch.totalClassGroups, 0);
    const averageStudentsPerBranch = totalBranches > 0 ? (totalStudents / totalBranches).toFixed(1) : 0;
    const averageClassGroupsPerBranch = totalBranches > 0 ? (totalClassGroups / totalBranches).toFixed(1) : 0;
    
    // Find most and least populated branches
    const mostPopulated = branches.length > 0 ? 
      branches.reduce((max, branch) => branch.totalStudents > max.totalStudents ? branch : max) : null;
    const leastPopulated = branches.length > 0 ? 
      branches.reduce((min, branch) => branch.totalStudents < min.totalStudents ? branch : min) : null;
    
    return {
      totalBranches,
      totalStudents,
      totalClassGroups,
      averageStudentsPerBranch,
      averageClassGroupsPerBranch,
      mostPopulated,
      leastPopulated
    };
  };
  

  
 // Replace the existing exportToPDF function with this improved version

const exportToPDF = async () => {
  try {
    setLoading(true);
    setError(null);
    setMessage({ text: '', type: '' });
    
    const currentDate = new Date();
    const reportId = `RPT-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getHours()).padStart(2, '0')}${String(currentDate.getMinutes()).padStart(2, '0')}`;
    
    // Create a new window for PDF with better handling
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    if (!printWindow) {
      throw new Error('Pop-up blocked. Please allow pop-ups for this site to export PDF reports.');
    }
    
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Campus Management System Report - ${reportId}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Reset and Base Styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.4;
            color: #000;
            font-size: 11pt;
            background: white;
          }
          
          .document-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
            min-height: 100vh;
          }
          
          /* Header Styles */
          .official-header {
            text-align: center;
            border: 2px solid #000;
            padding: 20px;
            margin-bottom: 30px;
            background: #f8f9fa;
          }
          
          .government-seal {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            border: 2px solid #000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 24px;
            background: white;
          }
          
          .official-title {
            font-size: 18pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 15px 0;
            letter-spacing: 1px;
          }
          
          .department-info {
            font-size: 12pt;
            margin: 8px 0;
            font-weight: 600;
          }
          
          .classification {
            font-size: 10pt;
            margin-top: 15px;
            font-style: italic;
            color: #666;
          }
          
          /* Document Info Grid */
          .document-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 25px 0;
            border: 1px solid #000;
            padding: 15px;
            background: #fafbfc;
          }
          
          .doc-field {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
          }
          
          .doc-label {
            font-weight: bold;
            display: inline-block;
            width: 130px;
            color: #333;
          }
          
          .doc-value {
            flex: 1;
            font-weight: normal;
          }
          
          /* Section Headers */
          .section-header {
            background: linear-gradient(135deg, #000 0%, #333 100%);
            color: white;
            padding: 12px 20px;
            font-weight: bold;
            font-size: 14pt;
            margin: 30px 0 20px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .subsection-header {
            background: #333;
            color: white;
            padding: 8px 15px;
            font-weight: bold;
            font-size: 12pt;
            margin: 25px 0 15px 0;
            border-left: 4px solid #000;
          }
          
          /* Tables */
          .official-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1px solid #000;
            font-size: 10pt;
          }
          
          .official-table th {
            background: #000;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #000;
            font-size: 9pt;
            text-transform: uppercase;
          }
          
          .official-table td {
            padding: 8px;
            border: 1px solid #ccc;
            vertical-align: top;
            line-height: 1.3;
          }
          
          .official-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          .official-table tr:hover {
            background: #e3f2fd;
          }
          
          /* Stats Grid */
          .stats-section {
            border: 1px solid #000;
            padding: 20px;
            margin: 20px 0;
            background: #f8f9fa;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 15px 0;
          }
          
          .stat-box {
            border: 1px solid #333;
            padding: 15px;
            text-align: center;
            background: white;
            border-radius: 4px;
          }
          
          .stat-number {
            font-size: 24pt;
            font-weight: bold;
            display: block;
            margin-bottom: 8px;
            color: #000;
          }
          
          .stat-label {
            font-size: 9pt;
            text-transform: uppercase;
            font-weight: bold;
            color: #666;
          }
          
          /* Executive Summary */
          .executive-summary {
            border: 1px solid #000;
            padding: 20px;
            margin: 25px 0;
            background: #f8f9fa;
            line-height: 1.6;
          }
          
          .executive-summary h4 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 14pt;
            text-decoration: underline;
          }
          
          .critical-info {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 15px;
            margin: 15px 0;
            font-weight: bold;
            border-radius: 4px;
          }
          
          /* Status Badges */
          .status-approved { 
            color: #28a745; 
            font-weight: bold; 
          }
          
          .status-pending { 
            color: #ffc107; 
            font-weight: bold; 
          }
          
          .status-cancelled { 
            color: #dc3545; 
            font-weight: bold; 
          }
          
          /* Signature Section */
          .signature-section {
            margin-top: 40px;
            border: 1px solid #000;
            padding: 25px;
            background: #fafbfc;
          }
          
          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            margin-top: 40px;
          }
          
          .signature-block {
            text-align: center;
          }
          
          .signature-line {
            border-bottom: 2px solid #000;
            height: 50px;
            margin-bottom: 15px;
          }
          
          .official-seal {
            margin: 20px auto;
            text-align: center;
            border: 2px solid #000;
            padding: 20px;
            background: white;
          }
          
          /* Footer */
          .official-footer {
            margin-top: 40px;
            text-align: center;
            border-top: 2px solid #000;
            padding-top: 20px;
            font-size: 10pt;
            background: #f8f9fa;
            padding: 20px;
          }
          
          /* Print Specific Styles */
          @media print {
            body {
              font-size: 10pt;
              line-height: 1.3;
            }
            
            .document-container {
              padding: 10mm;
              margin: 0;
              max-width: none;
            }
            
            .section-header {
              break-after: avoid;
              page-break-after: avoid;
            }
            
            .official-table {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            
            .stat-box {
              break-inside: avoid;
            }
            
            .signature-section {
              break-before: always;
              page-break-before: always;
            }
            
            .executive-summary {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            
            @page {
              size: A4;
              margin: 15mm;
              @top-right {
                content: "Page " counter(page);
              }
              @bottom-center {
                content: "Report ID: ${reportId}";
              }
            }
          }
          
          /* Screen Preview Styles */
          @media screen {
            body {
              background: #f0f0f0;
              padding: 20px 0;
            }
            
            .document-container {
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              margin: 20px auto;
            }
            
            .print-notice {
              position: fixed;
              top: 10px;
              right: 10px;
              background: #007bff;
              color: white;
              padding: 10px 15px;
              border-radius: 5px;
              font-size: 12pt;
              font-weight: bold;
              z-index: 1000;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            
            .print-controls {
              position: fixed;
              top: 10px;
              left: 10px;
              background: white;
              padding: 15px;
              border-radius: 5px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              z-index: 1000;
            }
            
            .print-btn {
              background: #28a745;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              font-weight: bold;
              cursor: pointer;
              margin-right: 10px;
            }
            
            .print-btn:hover {
              background: #218838;
            }
            
            .close-btn {
              background: #6c757d;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              font-weight: bold;
              cursor: pointer;
            }
            
            .close-btn:hover {
              background: #5a6268;
            }
          }
        </style>
      </head>
      <body>
        <!-- Print Controls (only visible on screen) -->
        <div class="print-controls">
          <button class="print-btn" onclick="window.print()">🖨️ Print/Save as PDF</button>
          <button class="close-btn" onclick="window.close()">❌ Close</button>
        </div>
        
        <div class="print-notice">
          📄 Report Preview - Use Ctrl+P or click Print button to save as PDF
        </div>
        
        <div class="document-container">
          
          <!-- OFFICIAL HEADER -->
          <div class="official-header">
            <div class="government-seal">🏛️</div>
            <div class="official-title">Campus Management System</div>
            <div class="official-title" style="font-size: 16pt;">Official Administrative Report</div>
            <div class="department-info">Facilities Management Department</div>
            <div class="department-info">Room Reservation & Academic Resources System</div>
            <div class="classification">Classification: Internal Use - Administrative Personnel</div>
          </div>
          
          <!-- DOCUMENT IDENTIFICATION -->
          <div class="document-info">
            <div>
              <div class="doc-field">
                <span class="doc-label">Report ID:</span>
                <span class="doc-value">${reportId}</span>
              </div>
              <div class="doc-field">
                <span class="doc-label">Generated:</span>
                <span class="doc-value">${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}</span>
              </div>
              <div class="doc-field">
                <span class="doc-label">Report Period:</span>
                <span class="doc-value">Current System Status</span>
              </div>
              <div class="doc-field">
                <span class="doc-label">Authority:</span>
                <span class="doc-value">System Administrator</span>
              </div>
            </div>
            <div>
              <div class="doc-field">
                <span class="doc-label">Document Type:</span>
                <span class="doc-value">Comprehensive Analysis</span>
              </div>
              <div class="doc-field">
                <span class="doc-label">Scope:</span>
                <span class="doc-value">Campus-wide Operations</span>
              </div>
              <div class="doc-field">
                <span class="doc-label">Version:</span>
                <span class="doc-value">1.0</span>
              </div>
              <div class="doc-field">
                <span class="doc-label">Status:</span>
                <span class="doc-value">OFFICIAL</span>
              </div>
            </div>
          </div>
          
          <!-- EXECUTIVE SUMMARY -->
          <div class="section-header">Executive Summary</div>
          <div class="executive-summary">
            <h4>System Overview</h4>
            <p><strong>This report provides a comprehensive analysis of the Campus Room Management System operational status as of ${currentDate.toLocaleDateString()}.</strong></p>
            
            <div class="critical-info">
              <strong>Key Performance Indicators:</strong><br>
              • ${stats.totalClassrooms || 0} classroom facilities under management<br>
              • ${stats.activeReservations || 0} active reservations currently approved<br>
              • ${stats.totalUsers || 0} registered users across the system<br>
              • ${branchStatistics.totalBranches || 0} academic branches operational<br>
              • ${stats.pendingDemands || 0} requests pending administrative approval
            </div>
            
            <p><strong>Data Integrity:</strong> All information in this report is sourced directly from the live campus management database and represents real-time operational status.</p>
            
            <p><strong>Operational Status:</strong> The system is functioning within normal parameters with ${stats.pendingDemands > 10 ? 'elevated' : 'normal'} approval queue levels.</p>
          </div>
          
          <!-- SYSTEM PERFORMANCE OVERVIEW -->
          <div class="section-header">System Performance Metrics</div>
          
          <div class="stats-section">
            <h4 style="margin-top: 0; text-align: center;">Current Operational Statistics</h4>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-number">${stats.totalClassrooms || 0}</span>
                <span class="stat-label">Total Facilities</span>
              </div>
              <div class="stat-box">
                <span class="stat-number">${stats.activeReservations || 0}</span>
                <span class="stat-label">Active Bookings</span>
              </div>
              <div class="stat-box">
                <span class="stat-number">${stats.pendingDemands || 0}</span>
                <span class="stat-label">Pending Requests</span>
              </div>
              <div class="stat-box">
                <span class="stat-number">${stats.totalUsers || 0}</span>
                <span class="stat-label">System Users</span>
              </div>
              <div class="stat-box">
                <span class="stat-number">${branchStatistics.totalBranches || 0}</span>
                <span class="stat-label">Academic Branches</span>
              </div>
              <div class="stat-box">
                <span class="stat-number">${branchStatistics.totalStudents || 0}</span>
                <span class="stat-label">Total Students</span>
              </div>
            </div>
          </div>
          
          <div class="subsection-header">System Status Summary</div>
          <table class="official-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Current Value</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Classroom Facilities</strong></td>
                <td>${stats.totalClassrooms || 0}</td>
                <td><span class="status-approved">OPERATIONAL</span></td>
                <td>${stats.classroomDetails || 'All facilities available'}</td>
              </tr>
              <tr>
                <td><strong>Active Reservations</strong></td>
                <td>${stats.activeReservations || 0}</td>
                <td><span class="status-approved">${stats.activeReservations > 0 ? 'ACTIVE' : 'NORMAL'}</span></td>
                <td>Currently approved bookings in system</td>
              </tr>
              <tr>
                <td><strong>Pending Approvals</strong></td>
                <td>${stats.pendingDemands || 0}</td>
                <td><span class="${stats.pendingDemands > 10 ? 'status-pending' : 'status-approved'}">${stats.pendingDemands > 10 ? 'ATTENTION NEEDED' : 'NORMAL'}</span></td>
                <td>Requests awaiting administrative review</td>
              </tr>
              <tr>
                <td><strong>Registered Users</strong></td>
                <td>${stats.totalUsers || 0}</td>
                <td><span class="status-approved">ACTIVE</span></td>
                <td>${stats.userDetails || 'Users with system access'}</td>
              </tr>
              <tr>
                <td><strong>Academic Branches</strong></td>
                <td>${branchStatistics.totalBranches || 0}</td>
                <td><span class="status-approved">OPERATIONAL</span></td>
                <td>Active academic departments</td>
              </tr>
            </tbody>
          </table>
          
          <!-- FACILITY UTILIZATION -->
          <div class="section-header">Facility Utilization Analysis</div>
          
          <div class="subsection-header">Room Performance Statistics</div>
          <table class="official-table">
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Total Bookings</th>
                <th>Utilization Rate</th>
                <th>Current Status</th>
                <th>Primary Users</th>
                <th>Most Common Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${detailedRoomData.slice(0, 15).map(room => `
                <tr>
                  <td><strong>${room.roomName}</strong></td>
                  <td>${room.totalBookings}</td>
                  <td>${room.usagePercentage}%</td>
                  <td><span class="${room.currentBookings.length > 0 ? 'status-pending' : 'status-approved'}">${room.currentBookings.length > 0 ? 'OCCUPIED' : 'AVAILABLE'}</span></td>
                  <td>Prof: ${room.bookingsByRole.professor} | Students: ${room.bookingsByRole.student} | Admin: ${room.bookingsByRole.admin}</td>
                  <td>${room.topPurpose[0]} (${room.topPurpose[1]} times)</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- USER ACTIVITY ANALYSIS -->
          <div class="section-header">User Activity Assessment</div>
          
          <div class="subsection-header">Top System Users</div>
          <table class="official-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Role</th>
                <th>Total Bookings</th>
                <th>Success Rate</th>
                <th>Preferred Room</th>
                <th>Last Activity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${detailedUserActivity.slice(0, 20).map(user => `
                <tr>
                  <td><strong>${user.userName}</strong></td>
                  <td>${user.role.toUpperCase()}</td>
                  <td>${user.totalBookings}</td>
                  <td>${user.successRate}%</td>
                  <td>${user.favoriteRoom[0]} (${user.favoriteRoom[1]}x)</td>
                  <td>${user.lastBookingDate || 'N/A'}</td>
                  <td><span class="${user.successRate >= 80 ? 'status-approved' : user.successRate >= 50 ? 'status-pending' : 'status-cancelled'}">${user.successRate >= 80 ? 'ACTIVE' : user.successRate >= 50 ? 'MODERATE' : 'INACTIVE'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- BRANCH OPERATIONS -->
          <div class="section-header">Academic Branch Operations</div>
          
          <div class="subsection-header">Branch Performance Overview</div>
          <table class="official-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Total Students</th>
                <th>Active Students</th>
                <th>Course Offerings</th>
                <th>Avg Students/Course</th>
                <th>Performance Rating</th>
              </tr>
            </thead>
            <tbody>
              ${branchesData.map((branch, index) => `
                <tr>
                  <td><strong>${branch.name}</strong></td>
                  <td>${branch.totalStudents}</td>
                  <td>${branch.activeStudents}</td>
                  <td>${branch.totalCourses}</td>
                  <td>${branch.averageStudentsPerClass}</td>
                  <td><span class="status-approved">${index === 0 ? 'EXCELLENT' : index < 3 ? 'GOOD' : 'SATISFACTORY'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- CURRENT RESERVATIONS -->
          <div class="section-header">Current Reservation Status</div>
          
          <div class="subsection-header">Recent Reservations</div>
          <table class="official-table">
            <thead>
              <tr>
                <th>Reservation ID</th>
                <th>Room</th>
                <th>User</th>
                <th>Role</th>
                <th>Date & Time</th>
                <th>Purpose</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${recentReservations.slice(0, 25).map(reservation => `
                <tr>
                  <td><strong>${reservation.id}</strong></td>
                  <td>${reservation.classroom}</td>
                  <td>${reservation.reservedBy}</td>
                  <td>${reservation.role?.toUpperCase()}</td>
                  <td>${reservation.date} ${reservation.time}</td>
                  <td>${reservation.purpose || 'Standard booking'}</td>
                  <td><span class="status-${reservation.status?.toLowerCase()}">${reservation.status?.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${pendingDemands.length > 0 ? `
          <div class="subsection-header">Pending Approval Requests</div>
          <table class="official-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Room</th>
                <th>Requested By</th>
                <th>Role</th>
                <th>Requested Date/Time</th>
                <th>Purpose</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              ${pendingDemands.map((demand, index) => {
                const submissionDate = new Date(demand.date);
                const daysPending = Math.floor((currentDate - submissionDate) / (1000 * 60 * 60 * 24));
                return `
                  <tr>
                    <td><strong>${demand.id}</strong></td>
                    <td>${demand.classroom}</td>
                    <td>${demand.reservedBy || demand.requestedBy}</td>
                    <td>${demand.role?.toUpperCase()}</td>
                    <td>${demand.date} ${demand.time}</td>
                    <td>${demand.purpose || 'Standard request'}</td>
                    <td><span class="${daysPending > 7 ? 'status-cancelled' : daysPending > 3 ? 'status-pending' : 'status-approved'}">${daysPending > 7 ? 'HIGH' : daysPending > 3 ? 'MEDIUM' : 'NORMAL'}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          ` : ''}
          
          <!-- RECOMMENDATIONS -->
          <div class="section-header">Conclusions and Recommendations</div>
          
          <div class="executive-summary">
            <h4>Operational Assessment</h4>
            
            <p><strong>System Performance:</strong> The Campus Room Management System is operating effectively with ${stats.totalClassrooms || 0} managed facilities and ${stats.activeReservations || 0} active reservations.</p>
            
            <p><strong>Utilization Analysis:</strong> Current facility utilization shows ${roomOccupancy.filter(r => r.isOccupied).length} of ${roomOccupancy.length} rooms currently occupied (${roomOccupancy.length > 0 ? ((roomOccupancy.filter(r => r.isOccupied).length / roomOccupancy.length) * 100).toFixed(1) : 0}% occupancy rate).</p>
            
            <p><strong>Pending Matters:</strong> ${stats.pendingDemands || 0} reservation requests await approval. ${stats.pendingDemands > 10 ? 'Immediate attention recommended to process pending requests.' : 'Current pending volume is manageable.'}</p>
            
            <p><strong>Academic Integration:</strong> ${branchStatistics.totalBranches || 0} academic branches actively use the system with ${branchStatistics.totalStudents || 0} students enrolled across ${branchStatistics.totalClassGroups || 0} courses.</p>
            
            <div class="critical-info">
              <strong>Administrative Recommendations:</strong><br>
              1. ${stats.pendingDemands > 10 ? 'Prioritize processing pending approval requests' : 'Maintain current approval processing schedule'}<br>
              2. Monitor facility utilization trends for capacity planning<br>
              3. Continue regular system maintenance and user training<br>
              4. Consider facility expansion if utilization exceeds 85% consistently
            </div>
          </div>
          
          <!-- SIGNATURE SECTION -->
          <div class="signature-section">
            <h4 style="margin-top: 0;">Document Authentication</h4>
            
            <p>This report has been generated from the live Campus Management System database and represents accurate operational data as of the generation timestamp.</p>
            
            <p><strong>Report Validity:</strong> This document is official for administrative use and may be referenced for operational planning and institutional reporting.</p>
            
            <div class="signature-grid">
              <div class="signature-block">
                <div class="signature-line"></div>
                <strong>System Administrator</strong><br>
                Campus Facilities Management<br>
                Date: ${currentDate.toLocaleDateString()}
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <strong>Department Head</strong><br>
                Academic Operations<br>
                Date: _________________
              </div>
            </div>
            
            <div class="official-seal">
              <strong>🏛️ OFFICIAL DOCUMENT 🏛️</strong><br>
              <strong>Campus Administration</strong><br>
              Report ID: ${reportId}<br>
              Generated: ${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}
            </div>
          </div>
          
          <!-- FOOTER -->
          <div class="official-footer">
            <strong>Campus Facilities Management Department</strong><br>
            Room Reservation & Academic Resources System<br>
            <strong>Report ID:</strong> ${reportId} | <strong>Generated:</strong> ${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}<br>
            <em>This document contains official administrative data - Handle according to institutional policies</em>
            
            <div style="margin-top: 15px; font-weight: bold; font-size: 12pt;">
              === END OF OFFICIAL REPORT ===
            </div>
          </div>
          
        </div>
        
        <script>
          // Auto-focus on print dialog when page loads
          window.onload = function() {
            // Add some delay to ensure styles are loaded
            setTimeout(function() {
              console.log('Report preview loaded successfully');
              // Auto-print can be enabled by uncommenting the next line
              // window.print();
            }, 1000);
          };
          
          // Handle print button click
          function printReport() {
            window.print();
          }
          
          // Handle close button click
          function closeReport() {
            window.close();
          }
          
          // Add keyboard shortcuts
          document.addEventListener('keydown', function(e) {
            // Ctrl+P for print
            if (e.ctrlKey && e.key === 'p') {
              e.preventDefault();
              window.print();
            }
            // Escape to close
            if (e.key === 'Escape') {
              window.close();
            }
          });
        </script>
        
      </body>
      </html>
    `;
    
    // Write content to the new window
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Set focus to the new window
    printWindow.focus();
    
    setMessage({
      text: `Report preview opened successfully! Report ID: ${reportId}. Use Ctrl+P to print/save as PDF or click the Print button.`,
      type: 'success'
    });
    
  } catch (error) {
    console.error('Error exporting report:', error);
    setError('Failed to generate report: ' + (error.message || 'Unknown error'));
  } finally {
    setLoading(false);
  }
};
  // Event handlers
  const handleRefresh = () => {
    console.log("Refreshing REAL detailed reports");
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleRegenerate = async () => {
    try {
      setLoading(true);
      SharedDashboardService.invalidateCache();
      await fetchDetailedReportData();
      console.log("REAL detailed reports regenerated successfully");
    } catch (error) {
      console.error("Error regenerating detailed reports:", error);
      setError("Failed to regenerate reports: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="main-content admin-reports-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading detailed system reports...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="main-content admin-reports-page">
      {/* Elegant Header */}
      <div className="elegant-header">
        <div className="header-content">
          <h1>📊 System Analytics & Detailed Reports</h1>
         
          {lastUpdated && (
            <div className="last-updated-info">
              🕒 Last updated: {lastUpdated.toLocaleString()} 
            </div>
          )}
        </div>
        
        <div className="header-controls">
          <button 
            className="btn-elegant refresh"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh detailed data"
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
         
          <button 
            className="btn-elegant export-pdf"
            onClick={exportToPDF}
            disabled={loading || branchesData.length === 0}
            title="Export branch data to PDF"
          >
            <i className="fas fa-file-pdf"></i> Export PDF
          </button>
        </div>
      </div>
      
      {error && (
        <div className="elegant-alert error">
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <strong>Error Loading Data</strong>
            <p>{error}</p>
          </div>
          <button className="btn-retry" onClick={handleRefresh}>
            <i className="fas fa-sync-alt"></i> Retry
          </button>
        </div>
      )}

      {message.text && (
        <div className={`elegant-alert ${message.type}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}`}></i>
          <div>
            <strong>{message.type === 'success' ? 'Success' : 'Information'}</strong>
            <p>{message.text}</p>
          </div>
          <button className="btn-close-alert" onClick={() => setMessage({ text: '', type: '' })}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Elegant Navigation */}
      <div className="elegant-nav">
        <button 
          className={`nav-item ${selectedView === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedView('overview')}
        >
          <i className="fas fa-chart-pie"></i>
          <span>System Overview</span>
        </button>
        <button 
          className={`nav-item ${selectedView === 'rooms' ? 'active' : ''}`}
          onClick={() => setSelectedView('rooms')}
        >
          <i className="fas fa-door-open"></i>
          <span>Room Details</span>
        </button>
        <button 
          className={`nav-item ${selectedView === 'users' ? 'active' : ''}`}
          onClick={() => setSelectedView('users')}
        >
          <i className="fas fa-users"></i>
          <span>User Activity</span>
        </button>
        <button 
          className={`nav-item ${selectedView === 'branches' ? 'active' : ''}`}
          onClick={() => setSelectedView('branches')}
        >
          <i className="fas fa-sitemap"></i>
          <span>Branches</span>
        </button>
        <button 
          className={`nav-item ${selectedView === 'occupancy' ? 'active' : ''}`}
          onClick={() => setSelectedView('occupancy')}
        >
          <i className="fas fa-clock"></i>
          <span>Live Status</span>
        </button>
        <button 
          className={`nav-item ${selectedView === 'reservations' ? 'active' : ''}`}
          onClick={() => setSelectedView('reservations')}
        >
          <i className="fas fa-calendar-alt"></i>
          <span>All Reservations</span>
        </button>
      </div>

      {/* System Overview */}
      {selectedView === 'overview' && (
        <>
          <div className="elegant-section">
            <h2 className="section-title">📈 System Performance Metrics</h2>
            <div className="stats-grid elegant">
              <div className="stat-card elegant primary">
                <div className="stat-icon">
                  <i className="fas fa-building"></i>
                </div>
                <div className="stat-content">
                  <h3>Total Classrooms</h3>
                  <div className="stat-number">{stats.totalClassrooms || 0}</div>
                  <div className="stat-description">{stats.classroomDetails || 'Available facilities'}</div>
                </div>
              </div>
              
              <div className="stat-card elegant success">
                <div className="stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <h3>Active Reservations</h3>
                  <div className="stat-number">{stats.activeReservations || 0}</div>
                  <div className="stat-description">Currently approved bookings</div>
                </div>
              </div>
              
              <div className="stat-card elegant warning">
                <div className="stat-icon">
                  <i className="fas fa-hourglass-half"></i>
                </div>
                <div className="stat-content">
                  <h3>Pending Approvals</h3>
                  <div className="stat-number">{stats.pendingDemands || 0}</div>
                  <div className="stat-description">Awaiting administrator review</div>
                </div>
              </div>
              
              <div className="stat-card elegant info">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>System Users</h3>
                  <div className="stat-number">{stats.totalUsers || 0}</div>
                  <div className="stat-description">{stats.userDetails || 'Registered users'}</div>
                </div>
              </div>
              
              <div className="stat-card elegant secondary">
                <div className="stat-icon">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <div className="stat-content">
                  <h3>Class Groups</h3>
                  <div className="stat-number">{stats.totalClassGroups || 0}</div>
                  <div className="stat-description">Active academic groups</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detailed Room Information */}
      {selectedView === 'rooms' && (
        <div className="elegant-section">
          <h2 className="section-title">🏢 Detailed Room Analysis</h2>
          <div className="room-cards-grid">
            {detailedRoomData.length === 0 ? (
              <div className="no-data-message elegant">
                <i className="fas fa-info-circle"></i>
                <p>No room data available</p>
              </div>
            ) : (
              detailedRoomData.map((room, index) => (
                <div key={index} className="room-card elegant">
                  <div className="room-header">
                    <h3>{room.roomName}</h3>
                    <div className="room-status">
                      {room.currentBookings.length > 0 ? (
                        <span className="status occupied">🔴 Currently Occupied</span>
                      ) : (
                        <span className="status available">🟢 Available</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="room-stats">
                    <div className="stat-item">
                      <span className="label">Total Bookings:</span>
                      <span className="value">{room.totalBookings}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Usage Rate:</span>
                      <span className="value">{room.usagePercentage}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Most Frequent User:</span>
                      <span className="value">{room.topUser[0]} ({room.topUser[1]} times)</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Common Purpose:</span>
                      <span className="value">{room.topPurpose[0]}</span>
                    </div>
                  </div>
                  
                  {room.currentBookings.length > 0 && (
                    <div className="current-booking">
                      <h4>Current Booking:</h4>
                      {room.currentBookings.map((booking, idx) => (
                        <div key={idx} className="booking-info">
                          <div>👤 {booking.user} ({booking.role})</div>
                          <div>⏰ {booking.time}</div>
                          <div>📝 {booking.purpose}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="role-breakdown">
                    <h4>Bookings by Role:</h4>
                    <div className="role-stats">
                      <div className="role-item">
                        <span>👨‍🏫 Professors:</span>
                        <span>{room.bookingsByRole.professor}</span>
                      </div>
                      <div className="role-item">
                        <span>👨‍🎓 Students:</span>
                        <span>{room.bookingsByRole.student}</span>
                      </div>
                      <div className="role-item">
                        <span>👨‍💼 Admins:</span>
                        <span>{room.bookingsByRole.admin}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="recent-bookings">
                    <h4>Recent Bookings:</h4>
                    <div className="bookings-list">
                      {room.recentBookings.slice(0, 3).map((booking, idx) => (
                        <div key={idx} className="booking-item">
                          <div className="booking-user">👤 {booking.user}</div>
                          <div className="booking-details">
                            📅 {booking.date} ⏰ {booking.time}
                            <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detailed User Activity */}
      {selectedView === 'users' && (
        <div className="elegant-section">
          <h2 className="section-title">👥 User Activity Analysis</h2>
          <div className="user-cards-grid">
            {detailedUserActivity.length === 0 ? (
              <div className="no-data-message elegant">
                <i className="fas fa-info-circle"></i>
                <p>No user activity data available</p>
              </div>
            ) : (
              detailedUserActivity.map((user, index) => (
                <div key={index} className="user-card elegant">
                  <div className="user-header">
                    <div className="user-info">
                      <h3>{user.userName}</h3>
                      <span className={`role-badge ${user.role?.toLowerCase()}`}>
                        {user.role === 'professor' ? '👨‍🏫' : user.role === 'student' ? '👨‍🎓' : '👨‍💼'} {user.role}
                      </span>
                    </div>
                    <div className="user-rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                  </div>
                  
                  <div className="user-stats">
                    <div className="stat-item">
                      <span className="label">Total Bookings:</span>
                      <span className="value">{user.totalBookings}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Success Rate:</span>
                      <span className="value">{user.successRate}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Last Booking:</span>
                      <span className="value">{user.lastBookingDate || 'N/A'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Favorite Room:</span>
                      <span className="value">{user.favoriteRoom[0]} ({user.favoriteRoom[1]} times)</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Common Purpose:</span>
                      <span className="value">{user.topPurpose[0]}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Preferred Time:</span>
                      <span className="value">{user.preferredTime[0]}:00</span>
                    </div>
                  </div>
                  
                  <div className="booking-status-breakdown">
                    <h4>Booking Status:</h4>
                    <div className="status-stats">
                      <div className="status-item approved">
                        <span>✅ Approved:</span>
                        <span>{user.bookingsByStatus.approved}</span>
                      </div>
                      <div className="status-item pending">
                        <span>⏳ Pending:</span>
                        <span>{user.bookingsByStatus.pending}</span>
                      </div>
                      <div className="status-item cancelled">
                        <span>❌ Cancelled:</span>
                        <span>{user.bookingsByStatus.cancelled}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="recent-user-bookings">
                    <h4>Recent Bookings:</h4>
                    <div className="bookings-list">
                      {user.recentBookings.slice(0, 3).map((booking, idx) => (
                        <div key={idx} className="booking-item">
                          <div className="booking-room">🏢 {booking.room}</div>
                          <div className="booking-details">
                            📅 {booking.date} ⏰ {booking.time}
                            <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                              {booking.status}
                            </span>
                          </div>
                          {booking.purpose && (
                            <div className="booking-purpose">📝 {booking.purpose}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* REAL Branch Analytics */}
      {selectedView === 'branches' && (
        <>
          {/* Branch Overview Statistics */}
          <div className="elegant-section">
            <h2 className="section-title">🏛️ Branch Analytics Overview</h2>
            <div className="export-info">
              
            </div>
            <div className="stats-grid elegant">
              <div className="stat-card elegant primary">
                <div className="stat-icon">
                  <i className="fas fa-sitemap"></i>
                </div>
                <div className="stat-content">
                  <h3>Total Branches</h3>
                  <div className="stat-number">{branchStatistics.totalBranches || 0}</div>
                  <div className="stat-description">Academic departments</div>
                </div>
              </div>
              
              <div className="stat-card elegant success">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>Total Students</h3>
                  <div className="stat-number">{branchStatistics.totalStudents || 0}</div>
                  <div className="stat-description">Across all branches</div>
                </div>
              </div>
              
              <div className="stat-card elegant info">
                <div className="stat-icon">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <div className="stat-content">
                  <h3>Total Courses</h3>
                  <div className="stat-number">{branchStatistics.totalClassGroups || 0}</div>
                  <div className="stat-description">Active class groups</div>
                </div>
              </div>
              
              <div className="stat-card elegant warning">
                <div className="stat-icon">
                  <i className="fas fa-chart-bar"></i>
                </div>
                <div className="stat-content">
                  <h3>Avg Students/Branch</h3>
                  <div className="stat-number">{branchStatistics.averageStudentsPerBranch || 0}</div>
                  <div className="stat-description">Average enrollment</div>
                </div>
              </div>
            </div>
            
            {/* Most and Least Populated Branches */}
            {branchStatistics.mostPopulated && branchStatistics.leastPopulated && (
              <div className="branch-highlights">
                <div className="highlight-card most-populated">
                  <div className="highlight-header">
                    <i className="fas fa-trophy"></i>
                    <h4>Most Populated Branch</h4>
                  </div>
                  <div className="highlight-content">
                    <div className="branch-name">{branchStatistics.mostPopulated.name}</div>
                    <div className="branch-stats">
                      {branchStatistics.mostPopulated.totalStudents} students • {branchStatistics.mostPopulated.totalClassGroups} courses
                    </div>
                  </div>
                </div>
                
                <div className="highlight-card least-populated">
                  <div className="highlight-header">
                    <i className="fas fa-seedling"></i>
                    <h4>Growing Branch</h4>
                  </div>
                  <div className="highlight-content">
                    <div className="branch-name">{branchStatistics.leastPopulated.name}</div>
                    <div className="branch-stats">
                      {branchStatistics.leastPopulated.totalStudents} students • {branchStatistics.leastPopulated.totalClassGroups} courses
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Individual Branch Details using REAL DATA */}
          <div className="elegant-section">
            <h2 className="section-title">📚  Branch Information </h2>
           
            <div className="branch-cards-grid">
              {branchesData.length === 0 ? (
                <div className="no-data-message elegant">
                  <i className="fas fa-info-circle"></i>
                  <p>No branch data available from API</p>
                  <p>This could mean:</p>
                  <ul>
                    <li>No branches have been created yet</li>
                    <li>API connection issue</li>
                    <li>Permissions problem</li>
                  </ul>
                </div>
              ) : (
                branchesData.map((branch, index) => (
                  <div key={branch.id} className="branch-card elegant real-data">
                    <div className="branch-header">
                      <div className="branch-title">
                        <h3>{branch.name}</h3>
                        <div className="branch-rank">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                      </div>
                      <p className="branch-description">{branch.description}</p>
                      <div className="data-freshness">
                        <i className="fas fa-sync-alt"></i>
                        <span>Real-time data from API</span>
                      </div>
                    </div>
                    
                    {/* Main Statistics from REAL data */}
                    <div className="branch-main-stats">
                      <div className="main-stat">
                        <div className="stat-number">{branch.totalStudents}</div>
                        <div className="stat-label">Students</div>
                      </div>
                      <div className="main-stat">
                        <div className="stat-number">{branch.totalClassGroups}</div>
                        <div className="stat-label">Courses</div>
                      </div>
                      <div className="main-stat">
                        <div className="stat-number">{branch.averageStudentsPerClass}</div>
                        <div className="stat-label">Avg/Class</div>
                      </div>
                    </div>
                    
                    {/* Student Demographics from REAL data */}
                    <div className="branch-demographics">
                      <h4>👥 Student Demographics (Real Data)</h4>
                      <div className="demographic-item">
                        <span className="demo-label">Active Students:</span>
                        <span className="demo-value">{branch.activeStudents} / {branch.totalStudents}</span>
                      </div>
                      {branch.studentsByGender && (
                        <div className="demographic-breakdown">
                          <div className="gender-stats">
                            <div className="gender-item">
                              <span>👨 Male: {branch.studentsByGender.male}</span>
                            </div>
                            <div className="gender-item">
                              <span>👩 Female: {branch.studentsByGender.female}</span>
                            </div>
                            {branch.studentsByGender.other > 0 && (
                              <div className="gender-item">
                                <span>🤝 Other: {branch.studentsByGender.other}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Students by Year from REAL data */}
                    {branch.studentsByYear && branch.studentsByYear.length > 0 && (
                      <div className="branch-year-distribution">
                        <h4>📅 Students by Enrollment Year (Real Data)</h4>
                        <div className="year-bars">
                          {branch.studentsByYear.map(yearData => (
                            <div key={yearData.year} className="year-bar">
                              <div className="year-label">{yearData.year}</div>
                              <div className="year-count">{yearData.count}</div>
                              <div 
                                className="year-progress"
                                style={{
                                  width: `${branch.totalStudents > 0 ? (yearData.count / branch.totalStudents) * 100 : 0}%`
                                }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Course Distribution from REAL data */}
                    <div className="branch-courses">
                      <h4>📚 Course Distribution (Real Data)</h4>
                      <div className="course-stats">
                        <div className="course-item">
                          <span>📊 Total Courses:</span>
                          <span>{branch.totalCourses}</span>
                        </div>
                        <div className="course-item">
                          <span>✅ Active:</span>
                          <span>{branch.activeCourses}</span>
                        </div>
                      </div>
                      
                      {branch.classGroupsBySemester && branch.classGroupsBySemester.length > 0 && (
                        <div className="semester-breakdown">
                          <h5>By Semester:</h5>
                          {branch.classGroupsBySemester.map(semesterData => (
                            <div key={semesterData.semester} className="semester-item">
                              <span>{semesterData.semester}:</span>
                              <span>{semesterData.count} courses</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Recent Activity from REAL data */}
                    <div className="branch-recent-activity">
                      <h4>🔄 Recent Activity (Real Data)</h4>
                      {branch.recentEnrollments && branch.recentEnrollments.length > 0 ? (
                        <div className="recent-enrollments">
                          <h5>New Students (Last Month):</h5>
                          <div className="enrollment-list">
                            {branch.recentEnrollments.slice(0, 3).map(student => (
                              <div key={student.id} className="enrollment-item">
                                <span>👤 {student.firstName} {student.lastName}</span>
                                <span className="enrollment-date">
                                  {new Date(student.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="no-recent-activity">No recent enrollments</p>
                      )}
                    </div>
                    
                    {/* Current Classes from REAL data */}
                    {branch.upcomingClasses && branch.upcomingClasses.length > 0 && (
                      <div className="branch-upcoming">
                        <h4>📅 Current Courses (Real Data)</h4>
                        <div className="upcoming-list">
                          {branch.upcomingClasses.map(course => (
                            <div key={course.courseCode} className="upcoming-course">
                              <div className="course-code">{course.courseCode}</div>
                              <div className="course-name">{course.name}</div>
                              <div className="course-semester">{course.semester} {course.academicYear}</div>
                              {course.professorName && (
                                <div className="course-professor">👨‍🏫 {course.professorName}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Live Room Occupancy */}
      {selectedView === 'occupancy' && (
        <div className="elegant-section">
          <h2 className="section-title">🔴 Real-Time Room Status</h2>
          <div className="occupancy-grid elegant">
            {roomOccupancy.length === 0 ? (
              <div className="no-data-message elegant">
                <i className="fas fa-info-circle"></i>
                <p>No occupancy data available</p>
              </div>
            ) : (
              roomOccupancy.map((room, index) => (
                <div key={index} className={`occupancy-card elegant ${room.isOccupied ? 'occupied' : 'available'}`}>
                  <div className="room-name">
                    <h3>{room.roomName}</h3>
                    <span className={`status-indicator ${room.isOccupied ? 'occupied' : 'available'}`}>
                      {room.isOccupied ? '🔴 Occupied' : '🟢 Available'}
                    </span>
                  </div>
                  
                  {room.isOccupied && room.currentReservation && (
                    <div className="current-occupancy">
                      <h4>Current Occupant:</h4>
                      <div className="occupant-info">
                        <div>👤 {room.currentReservation.user}</div>
                        <div>🎭 {room.currentReservation.role}</div>
                        <div>⏰ {room.currentReservation.startTime} - {room.currentReservation.endTime}</div>
                        {room.currentReservation.purpose && (
                          <div>📝 {room.currentReservation.purpose}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {room.nextReservation && (
                    <div className="next-booking">
                      <h4>Next Booking:</h4>
                      <div className="next-info">
                        <div>👤 {room.nextReservation.user}</div>
                        <div>📅 {room.nextReservation.date}</div>
                        <div>⏰ {room.nextReservation.time}</div>
                        {room.nextReservation.purpose && (
                          <div>📝 {room.nextReservation.purpose}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="today-summary">
                    <div className="summary-item">
                      <span>📊 Today's Bookings:</span>
                      <span>{room.todayReservations}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* All Reservations */}
      {selectedView === 'reservations' && (
        <div className="elegant-section">
          <h2 className="section-title">📅 Complete Reservation History</h2>
          
          {/* Recent Reservations */}
          <div className="subsection">
            <h3>Recent Reservations</h3>
            <div className="elegant-table-container">
              <table className="elegant-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Room</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Date & Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReservations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">No recent reservations</td>
                    </tr>
                  ) : (
                    recentReservations.map((reservation, index) => (
                      <tr key={index}>
                        <td><strong>{reservation.id}</strong></td>
                        <td>🏢 {reservation.classroom}</td>
                        <td>👤 {reservation.reservedBy}</td>
                        <td>
                          <span className={`role-badge table ${reservation.role?.toLowerCase()}`}>
                            {reservation.role}
                          </span>
                        </td>
                        <td>
                          <div>📅 {reservation.date}</div>
                          <div>⏰ {reservation.time}</div>
                        </td>
                        <td>{reservation.purpose || '-'}</td>
                        <td>
                          <span className={`status-badge ${reservation.status?.toLowerCase()}`}>
                            {reservation.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pending Demands */}
          <div className="subsection">
            <h3>Pending Approval Requests</h3>
            <div className="elegant-table-container">
              <table className="elegant-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Room</th>
                    <th>Requested By</th>
                    <th>Role</th>
                    <th>Date & Time</th>
                    <th>Purpose</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDemands.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">No pending requests</td>
                    </tr>
                  ) : (
                    pendingDemands.map((demand, index) => (
                      <tr key={index} className="pending-row">
                        <td><strong>{demand.id}</strong></td>
                        <td>🏢 {demand.classroom}</td>
                        <td>👤 {demand.reservedBy || demand.requestedBy}</td>
                        <td>
                          <span className={`role-badge table ${demand.role?.toLowerCase()}`}>
                            {demand.role}
                          </span>
                        </td>
                        <td>
                          <div>📅 {demand.date}</div>
                          <div>⏰ {demand.time}</div>
                        </td>
                        <td>{demand.purpose || '-'}</td>
                        <td>
                          <span className="priority-badge normal">
                            ⏳ Normal
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;