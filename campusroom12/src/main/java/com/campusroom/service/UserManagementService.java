package com.campusroom.service;

import com.campusroom.dto.TimetableEntryDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.model.Branch;
import com.campusroom.model.ClassGroup;
import com.campusroom.model.Notification;
import com.campusroom.model.Reservation;
import com.campusroom.model.TimetableEntry;
import com.campusroom.model.User;
import com.campusroom.repository.BranchRepository;
import com.campusroom.repository.ClassGroupRepository;
import com.campusroom.repository.NotificationRepository;
import com.campusroom.repository.ReservationRepository;
import com.campusroom.repository.TimetableEntryRepository;
import com.campusroom.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class UserManagementService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TimetableEntryRepository timetableEntryRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private EntityManager entityManager;
    
    @Autowired
    private ReservationRepository reservationRepository;
    
    @Autowired
    private BranchRepository branchRepository;
    
    @Autowired
    private ClassGroupRepository classGroupRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Get all users
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToUserDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get users by role
     */
    public List<UserDTO> getUsersByRole(String role) {
        User.Role userRole = User.Role.valueOf(role.toUpperCase());
        return userRepository.findByRole(userRole).stream()
                .map(this::convertToUserDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get users by status
     */
    public List<UserDTO> getUsersByStatus(String status) {
        return userRepository.findByStatus(status).stream()
                .map(this::convertToUserDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get user by ID with timetable entries from class groups
     */
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        return convertToUserDTO(user);
    }
    
    /**
     * Get timetable entries for a student from their enrolled class groups
     */
    private List<TimetableEntryDTO> getStudentTimetableFromClassGroups(Long userId) {
        List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
        
        try {
            // Find all branches where this student is enrolled
            List<Branch> branches = branchRepository.findAll().stream()
                .filter(branch -> branch.getStudents() != null && 
                        branch.getStudents().stream().anyMatch(s -> s.getId().equals(userId)))
                .collect(Collectors.toList());
            
            System.out.println("Found " + branches.size() + " branches for student " + userId);
            
            // For each branch, get all class groups and their timetable entries
            for (Branch branch : branches) {
                if (branch.getClassGroups() != null) {
                    for (ClassGroup classGroup : branch.getClassGroups()) {
                        if (classGroup.getTimetableEntries() != null) {
                            for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                                TimetableEntryDTO entryDTO = convertToTimetableEntryDTO(entry);
                                // Add class info to entry name for display
                                entryDTO.setName(classGroup.getCourseCode() + ": " + entryDTO.getName());
                                timetableEntries.add(entryDTO);
                            }
                        }
                    }
                }
            }
            
            System.out.println("Retrieved " + timetableEntries.size() + " timetable entries for student " + userId);
            
        } catch (Exception e) {
            System.err.println("Error getting student timetable from class groups: " + e.getMessage());
            e.printStackTrace();
        }
        
        return timetableEntries;
    }
    
    /**
     * Get timetable entries for a professor from their assigned class groups
     */
    private List<TimetableEntryDTO> getProfessorTimetableFromClassGroups(Long userId) {
        List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
        
        try {
            // Find all class groups where this professor is assigned
            List<ClassGroup> classGroups = classGroupRepository.findByProfessorId(userId);
            
            System.out.println("Found " + classGroups.size() + " class groups for professor " + userId);
            
            for (ClassGroup classGroup : classGroups) {
                if (classGroup.getTimetableEntries() != null) {
                    for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                        TimetableEntryDTO entryDTO = convertToTimetableEntryDTO(entry);
                        // Add class info to entry name for display
                        entryDTO.setName(classGroup.getCourseCode() + ": " + entryDTO.getName());
                        timetableEntries.add(entryDTO);
                    }
                }
            }
            
            System.out.println("Retrieved " + timetableEntries.size() + " timetable entries for professor " + userId);
            
        } catch (Exception e) {
            System.err.println("Error getting professor timetable from class groups: " + e.getMessage());
            e.printStackTrace();
        }
        
        return timetableEntries;
    }
    
    /**
     * Create a new user
     */
    @Transactional
    public UserDTO createUser(UserDTO userDTO, String password) {
        // Prevent creating admin users
        if ("ADMIN".equalsIgnoreCase(userDTO.getRole())) {
            throw new RuntimeException("Cannot create administrator users");
        }
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email is already taken");
        }
        
        User user = new User();
        user.setFirstName(userDTO.getFirstName());
        user.setLastName(userDTO.getLastName());
        user.setEmail(userDTO.getEmail());
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(User.Role.valueOf(userDTO.getRole().toUpperCase()));
        user.setStatus(userDTO.getStatus());
        
        // Save the user - no need to handle timetable entries here as they come from class groups
        User savedUser = userRepository.save(user);
        
        System.out.println("Created new user " + savedUser.getId() + " (" + userDTO.getRole() + ")");
        
        return convertToUserDTO(savedUser);
    }
    
    /**
     * Update an existing user
     */
    @Transactional
    public UserDTO updateUser(Long id, UserDTO userDTO) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setFirstName(userDTO.getFirstName());
                    user.setLastName(userDTO.getLastName());
                    
                    // Check if email is already taken by another user
                    if (!user.getEmail().equals(userDTO.getEmail()) && 
                            userRepository.existsByEmail(userDTO.getEmail())) {
                        throw new RuntimeException("Email is already taken");
                    }
                    user.setEmail(userDTO.getEmail());
                    
                    user.setRole(User.Role.valueOf(userDTO.getRole().toUpperCase()));
                    user.setStatus(userDTO.getStatus());
                    
                    // Don't update timetable entries here - they come from class groups
                    
                    User updatedUser = userRepository.save(user);
                    return convertToUserDTO(updatedUser);
                })
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
    
    /**
     * Change user status - FIXED version that doesn't touch timetable entries
     */
    @Transactional
    public UserDTO changeUserStatus(Long id, String status) {
        return userRepository.findById(id)
                .map(user -> {
                    // Prevent changing admin status
                    if (user.getRole() == User.Role.ADMIN) {
                        throw new RuntimeException("Cannot change administrator status");
                    }
                    
                    String oldStatus = user.getStatus();
                    user.setStatus(status);
                    
                    // Save without touching timetable entries
                    User updatedUser = userRepository.save(user);
                    
                    System.out.println("Changed user " + id + " status from " + oldStatus + " to " + status);
                    
                    return convertToUserDTO(updatedUser);
                })
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    /**
     * Delete a user and their associated data
     */
    @Transactional
    public void deleteUser(Long id) {
        try {
            // Verify if the user exists
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
            
            // Prevent deleting admin users
            if (user.getRole() == User.Role.ADMIN) {
                throw new RuntimeException("Cannot delete administrator users");
            }
            
            System.out.println("Starting deletion process for user: " + user.getEmail() + " (ID: " + id + ")");
            
            // 1. Delete all reservations associated with the user
            System.out.println("Deleting reservations for user with ID " + id);
            List<Reservation> userReservations = reservationRepository.findByUser(user);
            if (userReservations != null && !userReservations.isEmpty()) {
                System.out.println("Found " + userReservations.size() + " reservations to delete");
                reservationRepository.deleteAll(userReservations);
                System.out.println("Deleted all user reservations");
            }
            
            // 2. Handle timetable entries - clear them safely first
            if (user.getTimetableEntries() != null && !user.getTimetableEntries().isEmpty()) {
                System.out.println("Found " + user.getTimetableEntries().size() + " timetable entries to handle");
                
                // Get IDs of timetable entries to delete
                List<Long> timetableEntryIds = user.getTimetableEntries().stream()
                        .map(TimetableEntry::getId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
                
                // Clear the collection safely
                user.clearTimetableEntries();
                userRepository.save(user);
                entityManager.flush();
                
                if (!timetableEntryIds.isEmpty()) {
                    // Delete timetable entries by IDs
                    timetableEntryRepository.deleteAllById(timetableEntryIds);
                    System.out.println("Deleted " + timetableEntryIds.size() + " timetable entries");
                }
            }
            
            // 3. Remove user from any branches they might be in
            List<Branch> allBranches = branchRepository.findAll();
            for (Branch branch : allBranches) {
                if (branch.getStudents() != null && branch.getStudents().contains(user)) {
                    branch.getStudents().remove(user);
                    branchRepository.save(branch);
                    System.out.println("Removed user from branch: " + branch.getName());
                }
            }
            
            // 4. Remove user as professor from any class groups
            List<ClassGroup> classGroups = classGroupRepository.findByProfessor(user);
            for (ClassGroup classGroup : classGroups) {
                classGroup.setProfessor(null);
                classGroupRepository.save(classGroup);
                System.out.println("Removed user as professor from class group: " + classGroup.getName());
            }
            
            // 5. Remove user from any class groups where they are a student
            List<ClassGroup> allClassGroups = classGroupRepository.findAll();
            for (ClassGroup classGroup : allClassGroups) {
                if (classGroup.getStudents() != null && classGroup.getStudents().contains(user)) {
                    classGroup.getStudents().remove(user);
                    classGroupRepository.save(classGroup);
                    System.out.println("Removed user from class group: " + classGroup.getName());
                }
            }
            
            // 6. Delete any notifications for this user
            try {
                List<Notification> userNotifications = notificationRepository.findByUser(user);
                if (!userNotifications.isEmpty()) {
                    notificationRepository.deleteAll(userNotifications);
                    System.out.println("Deleted " + userNotifications.size() + " notifications for user");
                }
            } catch (Exception e) {
                System.err.println("Could not delete notifications for user: " + e.getMessage());
            }
            
            // 7. Flush and clear persistence context
            entityManager.flush();
            entityManager.clear();
            
            // 8. Delete the user
            userRepository.deleteById(id);
            System.out.println("User with ID " + id + " deleted successfully");
            
        } catch (Exception e) {
            System.err.println("Error deleting user " + id + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete user: " + e.getMessage(), e);
        }
    }

    /**
     * Reset user password
     */
    @Transactional
    public void resetPassword(Long id, String newPassword) {
        userRepository.findById(id)
                .ifPresent(user -> {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    userRepository.save(user);
                });
    }
    
    /**
     * Update user timetable - DEPRECATED: Use class group management instead
     */
    @Transactional
    @Deprecated
    public UserDTO updateTimetable(Long userId, List<TimetableEntryDTO> timetableEntries) {
        throw new RuntimeException("Timetable management has been moved to Class Groups. " +
                "Please use Class Group Management to update timetables for students and professors.");
    }
    
    /**
     * Convert User entity to UserDTO with timetable from class groups
     */
    private UserDTO convertToUserDTO(User user) {
        List<TimetableEntryDTO> timetableEntryDTOs = new ArrayList<>();
        
        // Get timetable entries from class groups for students and professors
        if (user.getRole() == User.Role.STUDENT) {
            timetableEntryDTOs = getStudentTimetableFromClassGroups(user.getId());
        } else if (user.getRole() == User.Role.PROFESSOR) {
            timetableEntryDTOs = getProfessorTimetableFromClassGroups(user.getId());
        }
        // Admin users don't have timetables
        
        System.out.println("User " + user.getId() + " (" + user.getRole() + ") has " + 
                          timetableEntryDTOs.size() + " timetable entries from class groups");
        
        return UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus())
                .timetableEntries(timetableEntryDTOs)
                .build();
    }
    
    /**
     * Convert TimetableEntry entity to TimetableEntryDTO
     */
    private TimetableEntryDTO convertToTimetableEntryDTO(TimetableEntry entry) {
        return TimetableEntryDTO.builder()
                .id(entry.getId())
                .day(entry.getDay())
                .name(entry.getName())
                .instructor(entry.getInstructor())
                .location(entry.getLocation())
                .startTime(entry.getStartTime())
                .endTime(entry.getEndTime())
                .color(entry.getColor())
                .type(entry.getType())
                .build();
    }
    
    /**
     * Convert TimetableEntryDTO to TimetableEntry entity
     */
    private TimetableEntry convertToTimetableEntry(TimetableEntryDTO dto) {
        TimetableEntry entry = new TimetableEntry();
        if (dto.getId() != null) {
            entry.setId(dto.getId());
        }
        entry.setDay(dto.getDay());
        entry.setName(dto.getName());
        entry.setInstructor(dto.getInstructor());
        entry.setLocation(dto.getLocation());
        entry.setStartTime(dto.getStartTime());
        entry.setEndTime(dto.getEndTime());
        entry.setColor(dto.getColor() != null ? dto.getColor() : "#6366f1"); // Default color
        entry.setType(dto.getType() != null ? dto.getType() : "Lecture"); // Default type
        return entry;
    }
}