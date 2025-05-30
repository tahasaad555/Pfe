package com.campusroom.controller;

import com.campusroom.dto.AuthResponse;
import com.campusroom.dto.TimetableEntryDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.service.AuthService;
import com.campusroom.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    @Autowired
    private UserManagementService userService;
    
    @Autowired
    private AuthService authService;
    
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<UserDTO>> getUsersByStatus(@PathVariable String status) {
        return ResponseEntity.ok(userService.getUsersByStatus(status));
    }
    
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody Map<String, Object> userMap) {
        // Prevent creating admin users
        String role = (String) userMap.get("role");
        if ("admin".equalsIgnoreCase(role)) {
            return ResponseEntity.badRequest().body(null); // or throw exception
        }
        
        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName((String) userMap.get("firstName"));
        userDTO.setLastName((String) userMap.get("lastName"));
        userDTO.setEmail((String) userMap.get("email"));
        userDTO.setRole((String) userMap.get("role"));
        userDTO.setStatus((String) userMap.get("status"));
        
        // Note: Timetable entries are now managed through class groups, not individual users
        // Individual timetable entries are deprecated for students and professors
        
        String password = (String) userMap.get("password");
        
        return ResponseEntity.ok(userService.createUser(userDTO, password));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> userMap) {
        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName((String) userMap.get("firstName"));
        userDTO.setLastName((String) userMap.get("lastName"));
        userDTO.setEmail((String) userMap.get("email"));
        userDTO.setRole((String) userMap.get("role"));
        userDTO.setStatus((String) userMap.get("status"));
        
        // Note: Timetable entries are now managed through class groups, not individual users
        // Individual timetable entries are deprecated for students and professors
        
        return ResponseEntity.ok(userService.updateUser(id, userDTO));
    }
    
    // Update the changeUserStatus method in UserController.java:
    @PutMapping("/{id}/status")
    public ResponseEntity<AuthResponse> changeUserStatus(@PathVariable Long id, @RequestBody Map<String, String> statusMap) {
        try {
            // Check if user exists and get user details
            UserDTO user = userService.getUserById(id);
            if (user == null) {
                return ResponseEntity.badRequest().body(
                    AuthResponse.builder()
                        .success(false)
                        .message("User not found with ID: " + id)
                        .build()
                );
            }
            
            // Check if user is admin before changing status
            if ("admin".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.badRequest().body(
                    AuthResponse.builder()
                        .success(false)
                        .message("Cannot change status of administrator users.")
                        .build()
                );
            }
            
            String status = statusMap.get("status");
            
            // Validate status value
            if (status == null || (!status.equals("active") && !status.equals("inactive"))) {
                return ResponseEntity.badRequest().body(
                    AuthResponse.builder()
                        .success(false)
                        .message("Invalid status value. Use 'active' or 'inactive'.")
                        .build()
                );
            }
            
            // Log the status change attempt
            System.out.println("Changing status of user " + id + " from " + user.getStatus() + " to " + status);
            
            // Call the service to update the user status
            AuthResponse response = authService.changeUserStatus(id, status);
            
            // Log the result
            if (response.isSuccess()) {
                System.out.println("Successfully changed user " + id + " status to " + status);
            } else {
                System.err.println("Failed to change user " + id + " status: " + response.getMessage());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error changing user status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                AuthResponse.builder()
                    .success(false)
                    .message("Internal server error: " + e.getMessage())
                    .build()
            );
        }
    }
    
    @PutMapping("/{id}/password")
    public ResponseEntity<Map<String, Boolean>> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> passwordMap) {
        String password = passwordMap.get("password");
        userService.resetPassword(id, password);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    /**
     * Get user timetable - now dynamically loaded from class groups
     */
    @GetMapping("/{id}/timetable")
    public ResponseEntity<List<TimetableEntryDTO>> getUserTimetable(@PathVariable Long id) {
        try {
            // Get the user first to check their role
            UserDTO user = userService.getUserById(id);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("Getting timetable for user " + id + " (" + user.getRole() + ")");
            
            // The timetable is now included in the UserDTO from the service
            // which dynamically loads it from class groups
            List<TimetableEntryDTO> timetable = user.getTimetableEntries();
            
            if (timetable == null) {
                timetable = new ArrayList<>();
            }
            
            System.out.println("Returning " + timetable.size() + " timetable entries for user " + id);
            
            return ResponseEntity.ok(timetable);
        } catch (Exception e) {
            System.err.println("Error getting user timetable: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }
    
    /**
     * Update user timetable - DEPRECATED: Use class group management instead
     */
    @PutMapping("/{id}/timetable")
    @Deprecated
    public ResponseEntity<Map<String, String>> updateTimetable(@PathVariable Long id, @RequestBody List<Map<String, Object>> timetableEntriesMap) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", "Direct timetable updates are no longer supported",
            "message", "Please use Class Group Management to update timetables for students and professors. " +
                       "Timetables are now automatically generated from class group enrollments and assignments.",
            "suggestion", "To update timetables: " +
                         "1. For students: Add them to branches and enroll in class groups " +
                         "2. For professors: Assign them to class groups as instructors " +
                         "3. Update timetable entries through the Class Group Management interface"
        ));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        try {
            // Check if user exists and get user details first
            UserDTO user;
            try {
                user = userService.getUserById(id);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "deleted", false,
                    "success", false,
                    "message", "User not found with ID: " + id
                ));
            }
            
            // Check if user is admin before deleting
            if ("admin".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "deleted", false,
                    "success", false,
                    "message", "Cannot delete administrator users."
                ));
            }
            
            // Log deletion attempt
            System.out.println("Attempting to delete user: " + id + " (" + user.getFirstName() + " " + user.getLastName() + ")");
            
            // Perform the deletion
            userService.deleteUser(id);
            
            System.out.println("Successfully deleted user: " + id);
            
            return ResponseEntity.ok(Map.of(
                "deleted", true,
                "success", true,
                "message", "User deleted successfully"
            ));
        } catch (Exception e) {
            System.err.println("Error deleting user " + id + ": " + e.getMessage());
            e.printStackTrace();
            
            // Return appropriate error response
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "deleted", false,
                "success", false,
                "message", "Failed to delete user: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get user statistics including timetable summary
     */
    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable Long id) {
        try {
            UserDTO user = userService.getUserById(id);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("userId", user.getId());
            stats.put("fullName", user.getFirstName() + " " + user.getLastName());
            stats.put("role", user.getRole());
            stats.put("status", user.getStatus());
            
            // Timetable statistics
            List<TimetableEntryDTO> timetable = user.getTimetableEntries();
            if (timetable != null) {
                stats.put("totalClasses", timetable.size());
                
                // Group by day
                Map<String, Long> classesByDay = timetable.stream()
                    .collect(Collectors.groupingBy(
                        TimetableEntryDTO::getDay,
                        Collectors.counting()
                    ));
                stats.put("classesByDay", classesByDay);
                
                // Get unique locations
                Set<String> locations = timetable.stream()
                    .map(TimetableEntryDTO::getLocation)
                    .filter(loc -> loc != null && !loc.isEmpty())
                    .collect(Collectors.toSet());
                stats.put("uniqueLocations", locations.size());
                stats.put("locations", locations);
            } else {
                stats.put("totalClasses", 0);
                stats.put("classesByDay", new HashMap<>());
                stats.put("uniqueLocations", 0);
                stats.put("locations", new HashSet<>());
            }
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("Error getting user stats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to get user statistics: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get users by multiple criteria
     */
    @PostMapping("/search")
    public ResponseEntity<List<UserDTO>> searchUsers(@RequestBody Map<String, Object> searchCriteria) {
        try {
            String role = (String) searchCriteria.get("role");
            String status = (String) searchCriteria.get("status");
            String searchTerm = (String) searchCriteria.get("searchTerm");
            
            List<UserDTO> users = userService.getAllUsers();
            
            // Apply filters
            if (role != null && !role.isEmpty()) {
                users = users.stream()
                    .filter(user -> role.equalsIgnoreCase(user.getRole()))
                    .collect(Collectors.toList());
            }
            
            if (status != null && !status.isEmpty()) {
                users = users.stream()
                    .filter(user -> status.equalsIgnoreCase(user.getStatus()))
                    .collect(Collectors.toList());
            }
            
            if (searchTerm != null && !searchTerm.isEmpty()) {
                String term = searchTerm.toLowerCase();
                users = users.stream()
                    .filter(user -> 
                        (user.getFirstName() != null && user.getFirstName().toLowerCase().contains(term)) ||
                        (user.getLastName() != null && user.getLastName().toLowerCase().contains(term)) ||
                        (user.getEmail() != null && user.getEmail().toLowerCase().contains(term))
                    )
                    .collect(Collectors.toList());
            }
            
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.err.println("Error searching users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }
    
    /**
     * Get timetable conflicts for a specific user
     * This can help identify scheduling issues
     */
    @GetMapping("/{id}/timetable/conflicts")
    public ResponseEntity<Map<String, Object>> getUserTimetableConflicts(@PathVariable Long id) {
        try {
            UserDTO user = userService.getUserById(id);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            List<TimetableEntryDTO> timetable = user.getTimetableEntries();
            Map<String, Object> result = new HashMap<>();
            result.put("userId", id);
            result.put("hasConflicts", false);
            result.put("conflicts", new ArrayList<>());
            
            if (timetable == null || timetable.size() < 2) {
                return ResponseEntity.ok(result);
            }
            
            // Check for time conflicts within the user's own timetable
            List<Map<String, Object>> conflicts = new ArrayList<>();
            
            for (int i = 0; i < timetable.size(); i++) {
                for (int j = i + 1; j < timetable.size(); j++) {
                    TimetableEntryDTO entry1 = timetable.get(i);
                    TimetableEntryDTO entry2 = timetable.get(j);
                    
                    if (hasTimeOverlap(entry1, entry2)) {
                        Map<String, Object> conflict = new HashMap<>();
                        conflict.put("entry1", entry1);
                        conflict.put("entry2", entry2);
                        conflict.put("day", entry1.getDay());
                        conflict.put("conflictType", "TIME_OVERLAP");
                        conflicts.add(conflict);
                    }
                }
            }
            
            result.put("hasConflicts", !conflicts.isEmpty());
            result.put("conflicts", conflicts);
            result.put("conflictCount", conflicts.size());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error checking user timetable conflicts: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to check timetable conflicts: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Helper method to check if two timetable entries overlap
     */
    private boolean hasTimeOverlap(TimetableEntryDTO entry1, TimetableEntryDTO entry2) {
        // Check if they're on the same day
        if (!entry1.getDay().equals(entry2.getDay())) {
            return false;
        }
        
        // Convert times to minutes for comparison
        int start1 = convertTimeToMinutes(entry1.getStartTime());
        int end1 = convertTimeToMinutes(entry1.getEndTime());
        int start2 = convertTimeToMinutes(entry2.getStartTime());
        int end2 = convertTimeToMinutes(entry2.getEndTime());
        
        // Check for overlap
        return !(end1 <= start2 || end2 <= start1);
    }
    
    /**
     * Helper method to convert time string to minutes
     */
    private int convertTimeToMinutes(String time) {
        if (time == null || time.isEmpty()) {
            return 0;
        }
        
        try {
            String[] parts = time.split(":");
            int hours = Integer.parseInt(parts[0]);
            int minutes = Integer.parseInt(parts[1]);
            return hours * 60 + minutes;
        } catch (Exception e) {
            return 0;
        }
    }
}