package com.campusroom.controller;

import com.campusroom.dto.ClassGroupDTO;
import com.campusroom.dto.TimetableEntryDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.service.ClassGroupService;
import com.campusroom.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/class-groups")
public class ClassGroupController {

    @Autowired
    private ClassGroupService classGroupService;
    
    @Autowired
    private UserManagementService userManagementService;
    
    /**
     * Get all class groups (admin only)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ClassGroupDTO>> getAllClassGroups() {
        return ResponseEntity.ok(classGroupService.getAllClassGroups());
    }
    
    /**
     * Get a specific class group by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<ClassGroupDTO> getClassGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(classGroupService.getClassGroupById(id));
    }
    
    /**
     * Get class groups by professor ID
     */
    @GetMapping("/professor/{professorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<List<ClassGroupDTO>> getClassGroupsByProfessor(@PathVariable Long professorId) {
        return ResponseEntity.ok(classGroupService.getClassGroupsByProfessor(professorId));
    }
    
    /**
     * Get class groups for a student
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR', 'STUDENT')")
    public ResponseEntity<List<ClassGroupDTO>> getClassGroupsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(classGroupService.getClassGroupsByStudent(studentId));
    }
    
    /**
     * Create a new class group (admin only)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassGroupDTO> createClassGroup(@RequestBody ClassGroupDTO classGroupDTO) {
        return ResponseEntity.ok(classGroupService.createClassGroup(classGroupDTO));
    }
    
    /**
     * Update a class group (admin only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassGroupDTO> updateClassGroup(
            @PathVariable Long id, 
            @RequestBody ClassGroupDTO classGroupDTO) {
        return ResponseEntity.ok(classGroupService.updateClassGroup(id, classGroupDTO));
    }
    
    /**
     * Delete a class group (admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> deleteClassGroup(@PathVariable Long id) {
        classGroupService.deleteClassGroup(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
    
    /**
     * Add a student to a class group
     */
    @PostMapping("/{classGroupId}/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassGroupDTO> addStudentToClassGroup(
            @PathVariable Long classGroupId,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(classGroupService.addStudentToClassGroup(classGroupId, studentId));
    }
    
    /**
     * Remove a student from a class group
     */
    @DeleteMapping("/{classGroupId}/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassGroupDTO> removeStudentFromClassGroup(
            @PathVariable Long classGroupId,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(classGroupService.removeStudentFromClassGroup(classGroupId, studentId));
    }
    
    /**
     * Update timetable entries for a class group
     */
    @PutMapping("/{classGroupId}/timetable")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<ClassGroupDTO> updateClassGroupTimetable(
            @PathVariable Long classGroupId,
            @RequestBody List<TimetableEntryDTO> timetableEntries) {
        return ResponseEntity.ok(classGroupService.updateClassGroupTimetable(classGroupId, timetableEntries));
    }
    
    /**
     * Get timetable entries for a student based on their class groups
     */
    @GetMapping("/student/{studentId}/timetable")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR', 'STUDENT')")
    public ResponseEntity<List<TimetableEntryDTO>> getStudentTimetable(@PathVariable Long studentId) {
        return ResponseEntity.ok(classGroupService.getStudentTimetable(studentId));
    }
    
    /**
     * Get available students not in a specific class group
     */
    @GetMapping("/{classGroupId}/available-students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAvailableStudents(@PathVariable Long classGroupId) {
        // Get all students
        List<UserDTO> allStudents = userManagementService.getUsersByRole("STUDENT");
        
        // Get students already in the class group
        ClassGroupDTO classGroup = classGroupService.getClassGroupById(classGroupId);
        List<Long> classStudentIds = classGroup.getStudents().stream()
                .map(UserDTO::getId)
                .toList();
        
        // Filter out students already in the class
        List<UserDTO> availableStudents = allStudents.stream()
                .filter(student -> !classStudentIds.contains(student.getId()))
                .toList();
        
        return ResponseEntity.ok(availableStudents);
    }
    
    /**
     * Get students enrolled in a specific class group
     * This endpoint is added to specifically provide an API for listing 
     * students in a class group, which helps prevent issues with missing students
     */
    @GetMapping("/{classGroupId}/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<List<UserDTO>> getClassGroupStudents(@PathVariable Long classGroupId) {
        // Get the class group with its students
        ClassGroupDTO classGroup = classGroupService.getClassGroupById(classGroupId);
        
        // Return the students list
        return ResponseEntity.ok(classGroup.getStudents());
    }
    
    /**
     * Check for conflicts with a single timetable entry (for real-time conflict checking)
     */
    @PostMapping("/{classGroupId}/check-conflicts")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<Map<String, Object>> checkTimetableConflicts(
            @PathVariable Long classGroupId,
            @RequestBody TimetableEntryDTO entryToCheck) {
        Map<String, List<UserDTO>> conflicts = classGroupService.checkSingleEntryConflicts(classGroupId, entryToCheck);
        
        // Format conflicts in a user-friendly response
        boolean hasConflict = !conflicts.isEmpty();
        StringBuilder messageBuilder = new StringBuilder();
        
        if (hasConflict) {
            messageBuilder.append("This time slot conflicts with existing schedules");
            
            // Count professors and students affected
            long professorCount = conflicts.values().stream()
                    .flatMap(List::stream)
                    .filter(user -> "PROFESSOR".equals(user.getRole()))
                    .count();
            
            long studentCount = conflicts.values().stream()
                    .flatMap(List::stream)
                    .filter(user -> "STUDENT".equals(user.getRole()))
                    .count();
            
            messageBuilder.append(" for ");
            if (professorCount > 0) {
                messageBuilder.append(professorCount).append(" professor(s)");
                if (studentCount > 0) {
                    messageBuilder.append(" and ");
                }
            }
            if (studentCount > 0) {
                messageBuilder.append(studentCount).append(" student(s)");
            }
            messageBuilder.append(".");
        } else {
            messageBuilder.append("No conflicts found.");
        }
        
        // Collect all affected users
        List<UserDTO> affectedUsers = new ArrayList<>();
        for (List<UserDTO> users : conflicts.values()) {
            affectedUsers.addAll(users);
        }
        
        // Create response map
        Map<String, Object> response = new HashMap<>();
        response.put("hasConflict", hasConflict);
        response.put("message", messageBuilder.toString());
        response.put("affectedUsers", affectedUsers);
        
        // Add suggestions for alternative times if there are conflicts
        if (hasConflict) {
            List<Map<String, String>> alternatives = generateAlternatives(entryToCheck);
            response.put("alternatives", alternatives);
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Helper method to generate alternative time suggestions
     */
    private List<Map<String, String>> generateAlternatives(TimetableEntryDTO entry) {
        List<Map<String, String>> alternatives = new ArrayList<>();
        
        // Parse the current time
        String[] startParts = entry.getStartTime().split(":");
        int startHour = Integer.parseInt(startParts[0]);
        int startMinute = Integer.parseInt(startParts[1]);
        
        String[] endParts = entry.getEndTime().split(":");
        int endHour = Integer.parseInt(endParts[0]);
        int endMinute = Integer.parseInt(endParts[1]);
        
        // Calculate duration in minutes
        int duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        
        // Generate alternative times (30 min later, 60 min later, and next day same time)
        
        // 30 minutes later
        Map<String, String> alt1 = generateAlternativeTime(entry.getDay(), startHour, startMinute, duration, 30);
        alternatives.add(alt1);
        
        // 60 minutes later
        Map<String, String> alt2 = generateAlternativeTime(entry.getDay(), startHour, startMinute, duration, 60);
        alternatives.add(alt2);
        
        // Next day same time
        String nextDay = getNextDay(entry.getDay());
        Map<String, String> alt3 = new HashMap<>();
        alt3.put("day", nextDay);
        alt3.put("startTime", entry.getStartTime());
        alt3.put("endTime", entry.getEndTime());
        alt3.put("label", nextDay + " at " + entry.getStartTime());
        alternatives.add(alt3);
        
        return alternatives;
    }
    
    /**
     * Helper method to generate a specific alternative time
     */
    private Map<String, String> generateAlternativeTime(String day, int startHour, int startMinute, int duration, int offsetMinutes) {
        // Calculate new start time
        int newStartMinutes = startHour * 60 + startMinute + offsetMinutes;
        int newStartHour = newStartMinutes / 60;
        int newStartMinute = newStartMinutes % 60;
        
        // Calculate new end time
        int newEndMinutes = newStartMinutes + duration;
        int newEndHour = newEndMinutes / 60;
        int newEndMinute = newEndMinutes % 60;
        
        // Format times
        String newStartTime = String.format("%02d:%02d", newStartHour, newStartMinute);
        String newEndTime = String.format("%02d:%02d", newEndHour, newEndMinute);
        
        // Create result
        Map<String, String> result = new HashMap<>();
        result.put("day", day);
        result.put("startTime", newStartTime);
        result.put("endTime", newEndTime);
        result.put("label", day + " at " + newStartTime);
        
        return result;
    }
    
    /**
     * Helper method to get the next day of the week
     */
    private String getNextDay(String day) {
        List<String> days = List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");
        int currentIndex = days.indexOf(day);
        int nextIndex = (currentIndex + 1) % days.size();
        return days.get(nextIndex);
    }
}