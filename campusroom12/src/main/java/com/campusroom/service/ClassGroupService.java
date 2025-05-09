package com.campusroom.service;

import com.campusroom.dto.ClassGroupDTO;
import com.campusroom.dto.TimetableEntryDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.model.Branch;
import com.campusroom.model.ClassGroup;
import com.campusroom.model.TimetableEntry;
import com.campusroom.model.User;
import com.campusroom.repository.BranchRepository;
import com.campusroom.repository.ClassGroupRepository;
import com.campusroom.repository.TimetableEntryRepository;
import com.campusroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ClassGroupService {

    @Autowired
    private ClassGroupRepository classGroupRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TimetableEntryRepository timetableEntryRepository;
    
    @Autowired
    private BranchRepository branchRepository;
    
    /**
     * Get all class groups
     */
    public List<ClassGroupDTO> getAllClassGroups() {
        List<ClassGroup> classGroups = classGroupRepository.findAll();
        return classGroups.stream()
                .map(this::convertToClassGroupDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get class group by ID
     */
    public ClassGroupDTO getClassGroupById(Long id) {
        ClassGroup classGroup = classGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class group not found with id: " + id));
        return convertToClassGroupDTO(classGroup);
    }
    
    /**
     * Get class groups by professor
     */
    public List<ClassGroupDTO> getClassGroupsByProfessor(Long professorId) {
        User professor = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found with id: " + professorId));
        
        List<ClassGroup> classGroups = classGroupRepository.findByProfessor(professor);
        return classGroups.stream()
                .map(this::convertToClassGroupDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get class groups by student
     */
    public List<ClassGroupDTO> getClassGroupsByStudent(Long studentId) {
        List<ClassGroup> classGroups = classGroupRepository.findByStudentId(studentId);
        return classGroups.stream()
                .map(this::convertToClassGroupDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Create a new class group
     */
    @Transactional
    public ClassGroupDTO createClassGroup(ClassGroupDTO classGroupDTO) {
        ClassGroup classGroup = new ClassGroup();
        
        // Set basic info
        classGroup.setName(classGroupDTO.getName());
        classGroup.setCourseCode(classGroupDTO.getCourseCode());
        classGroup.setDescription(classGroupDTO.getDescription());
        classGroup.setAcademicYear(classGroupDTO.getAcademicYear());
        classGroup.setSemester(classGroupDTO.getSemester());
        
        // Set branch if provided
        if (classGroupDTO.getBranchId() != null) {
            Branch branch = branchRepository.findById(classGroupDTO.getBranchId())
                    .orElseThrow(() -> new RuntimeException("Branch not found with id: " + classGroupDTO.getBranchId()));
            classGroup.setBranch(branch);
        }
        
        // Set professor if provided
        if (classGroupDTO.getProfessorId() != null) {
            User professor = userRepository.findById(classGroupDTO.getProfessorId())
                    .orElseThrow(() -> new RuntimeException("Professor not found with id: " + classGroupDTO.getProfessorId()));
            
            if (professor.getRole() != User.Role.PROFESSOR) {
                throw new RuntimeException("User with id " + classGroupDTO.getProfessorId() + " is not a professor");
            }
            
            classGroup.setProfessor(professor);
        }
        
        // Save first to get ID
        ClassGroup savedClassGroup = classGroupRepository.save(classGroup);
        
        // Add timetable entries if provided
        if (classGroupDTO.getTimetableEntries() != null && !classGroupDTO.getTimetableEntries().isEmpty()) {
            for (TimetableEntryDTO entryDTO : classGroupDTO.getTimetableEntries()) {
                TimetableEntry entry = convertToTimetableEntry(entryDTO);
                savedClassGroup.addTimetableEntry(entry);
            }
            savedClassGroup = classGroupRepository.save(savedClassGroup);
            
            // Also update professor's timetable if a professor is assigned
            if (classGroup.getProfessor() != null) {
                syncProfessorTimetable(classGroup.getProfessor(), savedClassGroup);
            }
        }
        
        return convertToClassGroupDTO(savedClassGroup);
    }
    
    /**
     * Update an existing class group
     */
    @Transactional
    public ClassGroupDTO updateClassGroup(Long id, ClassGroupDTO classGroupDTO) {
        ClassGroup classGroup = classGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class group not found with id: " + id));
        
        // Store the previous professor to handle timetable sync if professor changed
        User previousProfessor = classGroup.getProfessor();
        
        // Update basic info
        classGroup.setName(classGroupDTO.getName());
        classGroup.setCourseCode(classGroupDTO.getCourseCode());
        classGroup.setDescription(classGroupDTO.getDescription());
        classGroup.setAcademicYear(classGroupDTO.getAcademicYear());
        classGroup.setSemester(classGroupDTO.getSemester());
        
        // Update branch if provided
        if (classGroupDTO.getBranchId() != null) {
            Branch branch = branchRepository.findById(classGroupDTO.getBranchId())
                    .orElseThrow(() -> new RuntimeException("Branch not found with id: " + classGroupDTO.getBranchId()));
            classGroup.setBranch(branch);
        } else {
            classGroup.setBranch(null);
        }
        
        // Update professor if provided
        if (classGroupDTO.getProfessorId() != null) {
            User professor = userRepository.findById(classGroupDTO.getProfessorId())
                    .orElseThrow(() -> new RuntimeException("Professor not found with id: " + classGroupDTO.getProfessorId()));
            
            if (professor.getRole() != User.Role.PROFESSOR) {
                throw new RuntimeException("User with id " + classGroupDTO.getProfessorId() + " is not a professor");
            }
            
            classGroup.setProfessor(professor);
        } else {
            classGroup.setProfessor(null);
        }
        
        // Save the updates
        ClassGroup updatedClassGroup = classGroupRepository.save(classGroup);
        
        // If professor has changed, update timetables for both old and new professor
        if (previousProfessor != null && 
            (classGroup.getProfessor() == null || !previousProfessor.getId().equals(classGroup.getProfessor().getId()))) {
            // Remove this class group's entries from previous professor's timetable
            removeClassGroupFromProfessorTimetable(previousProfessor, updatedClassGroup);
        }
        
        // Sync timetable with the new professor if exists
        if (classGroup.getProfessor() != null) {
            syncProfessorTimetable(classGroup.getProfessor(), updatedClassGroup);
        }
        
        return convertToClassGroupDTO(updatedClassGroup);
    }
    
    /**
     * Delete a class group
     */
    @Transactional
    public void deleteClassGroup(Long id) {
        ClassGroup classGroup = classGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class group not found with id: " + id));
        
        // Remove this class group's entries from professor's timetable if assigned
        if (classGroup.getProfessor() != null) {
            removeClassGroupFromProfessorTimetable(classGroup.getProfessor(), classGroup);
        }
        
        classGroupRepository.deleteById(id);
    }
    
    /**
     * Add a student to a class group
     */
    @Transactional
    public ClassGroupDTO addStudentToClassGroup(Long classGroupId, Long studentId) {
        ClassGroup classGroup = classGroupRepository.findById(classGroupId)
                .orElseThrow(() -> new RuntimeException("Class group not found with id: " + classGroupId));
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        
        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("User with id " + studentId + " is not a student");
        }
        
        classGroup.addStudent(student);
        ClassGroup updatedClassGroup = classGroupRepository.save(classGroup);
        
        return convertToClassGroupDTO(updatedClassGroup);
    }
    
    /**
     * Remove a student from a class group
     */
    @Transactional
    public ClassGroupDTO removeStudentFromClassGroup(Long classGroupId, Long studentId) {
        ClassGroup classGroup = classGroupRepository.findById(classGroupId)
                .orElseThrow(() -> new RuntimeException("Class group not found with id: " + classGroupId));
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        
        classGroup.getStudents().removeIf(s -> s.getId().equals(studentId));
        ClassGroup updatedClassGroup = classGroupRepository.save(classGroup);
        
        return convertToClassGroupDTO(updatedClassGroup);
    }
    
  /**
 * Update timetable entries for a class group with conflict checking
 */
@Transactional
public ClassGroupDTO updateClassGroupTimetable(Long classGroupId, List<TimetableEntryDTO> timetableEntries) {
    ClassGroup classGroup = classGroupRepository.findById(classGroupId)
            .orElseThrow(() -> new RuntimeException("Class group not found with id: " + classGroupId));
    
    // Check for timetable conflicts before updating
    Map<String, List<UserDTO>> conflicts = checkTimetableConflicts(classGroup, timetableEntries);
    if (!conflicts.isEmpty()) {
        throw new RuntimeException("Timetable conflicts detected: " + formatConflictMessage(conflicts));
    }
    
    // Clear existing entries
    classGroup.getTimetableEntries().clear();
    
    // Add new entries
    if (timetableEntries != null) {
        for (TimetableEntryDTO entryDTO : timetableEntries) {
            TimetableEntry entry = convertToTimetableEntry(entryDTO);
            classGroup.addTimetableEntry(entry);
        }
    }
    
    ClassGroup updatedClassGroup = classGroupRepository.save(classGroup);
    
    // Also update professor's timetable if a professor is assigned
    if (classGroup.getProfessor() != null) {
        syncProfessorTimetable(classGroup.getProfessor(), updatedClassGroup);
    }
    
    return convertToClassGroupDTO(updatedClassGroup);
}

/**
 * Check for timetable conflicts with students or professors
 * @return Map of conflicting entries with lists of affected users
 */
private Map<String, List<UserDTO>> checkTimetableConflicts(ClassGroup classGroup, List<TimetableEntryDTO> newTimetableEntries) {
    Map<String, List<UserDTO>> conflicts = new HashMap<>();
    
    if (newTimetableEntries == null || newTimetableEntries.isEmpty()) {
        return conflicts;
    }
    
    // Check professor conflicts if one is assigned
    if (classGroup.getProfessor() != null) {
        User professor = classGroup.getProfessor();
        checkProfessorConflicts(professor, newTimetableEntries, classGroup.getId(), conflicts);
    }
    
    // Check student conflicts
    if (classGroup.getStudents() != null && !classGroup.getStudents().isEmpty()) {
        for (User student : classGroup.getStudents()) {
            checkStudentConflicts(student, newTimetableEntries, classGroup.getId(), conflicts);
        }
    }
    
    return conflicts;
}
/**
 * Check for conflicts with a single timetable entry
 * This is used for real-time conflict checking in the UI
 */
public Map<String, List<UserDTO>> checkSingleEntryConflicts(Long classGroupId, TimetableEntryDTO entryToCheck) {
    ClassGroup classGroup = classGroupRepository.findById(classGroupId)
            .orElseThrow(() -> new RuntimeException("Class group not found with id: " + classGroupId));
    
    Map<String, List<UserDTO>> conflicts = new HashMap<>();
    
    // Create a list with just this entry for checking
    List<TimetableEntryDTO> entriesToCheck = new ArrayList<>();
    entriesToCheck.add(entryToCheck);
    
    // Check professor conflicts if one is assigned
    if (classGroup.getProfessor() != null) {
        User professor = classGroup.getProfessor();
        checkProfessorConflicts(professor, entriesToCheck, classGroupId, conflicts);
    }
    
    // Check student conflicts
    if (classGroup.getStudents() != null && !classGroup.getStudents().isEmpty()) {
        for (User student : classGroup.getStudents()) {
            checkStudentConflicts(student, entriesToCheck, classGroupId, conflicts);
        }
    }
    
    return conflicts;
}

/**
 * Check for conflicts with a professor's existing timetable
 */
private void checkProfessorConflicts(User professor, List<TimetableEntryDTO> newEntries, 
                                    Long currentClassGroupId, Map<String, List<UserDTO>> conflicts) {
    // Get all class groups taught by this professor
    List<ClassGroup> professorClassGroups = classGroupRepository.findByProfessor(professor);
    
    // Filter out the current class group
    professorClassGroups = professorClassGroups.stream()
            .filter(cg -> !cg.getId().equals(currentClassGroupId))
            .collect(Collectors.toList());
    
    // Get all timetable entries from these class groups
    List<TimetableEntry> existingEntries = new ArrayList<>();
    for (ClassGroup cg : professorClassGroups) {
        existingEntries.addAll(cg.getTimetableEntries());
    }
    
    // Also include any personal entries from the professor
    if (professor.getTimetableEntries() != null) {
        existingEntries.addAll(professor.getTimetableEntries().stream()
                .filter(entry -> !entry.getName().startsWith(classGroupRepository.findById(currentClassGroupId)
                        .map(ClassGroup::getCourseCode).orElse("") + ":"))
                .collect(Collectors.toList()));
    }
    
    // Check each new entry against existing entries
    for (TimetableEntryDTO newEntry : newEntries) {
        for (TimetableEntry existingEntry : existingEntries) {
            if (hasTimeConflict(newEntry.getDay(), newEntry.getStartTime(), newEntry.getEndTime(),
                    existingEntry.getDay(), existingEntry.getStartTime(), existingEntry.getEndTime())) {
                
                String conflictKey = String.format("%s (%s - %s)",
                        newEntry.getDay(), newEntry.getStartTime(), newEntry.getEndTime());
                
                UserDTO professorDTO = convertToUserDTO(professor);
                
                if (!conflicts.containsKey(conflictKey)) {
                    conflicts.put(conflictKey, new ArrayList<>());
                }
                
                // Only add the professor once per conflict time
                if (conflicts.get(conflictKey).stream().noneMatch(u -> u.getId().equals(professorDTO.getId()))) {
                    conflicts.get(conflictKey).add(professorDTO);
                }
            }
        }
    }
}

/**
 * Check for conflicts with a student's existing timetable
 */
private void checkStudentConflicts(User student, List<TimetableEntryDTO> newEntries, 
                                  Long currentClassGroupId, Map<String, List<UserDTO>> conflicts) {
    // Get all class groups this student is enrolled in
    List<ClassGroup> studentClassGroups = classGroupRepository.findByStudentId(student.getId());
    
    // Filter out the current class group
    studentClassGroups = studentClassGroups.stream()
            .filter(cg -> !cg.getId().equals(currentClassGroupId))
            .collect(Collectors.toList());
    
    // Get all timetable entries from these class groups
    List<TimetableEntry> existingEntries = new ArrayList<>();
    for (ClassGroup cg : studentClassGroups) {
        existingEntries.addAll(cg.getTimetableEntries());
    }
    
    // Check each new entry against existing entries
    for (TimetableEntryDTO newEntry : newEntries) {
        for (TimetableEntry existingEntry : existingEntries) {
            if (hasTimeConflict(newEntry.getDay(), newEntry.getStartTime(), newEntry.getEndTime(),
                    existingEntry.getDay(), existingEntry.getStartTime(), existingEntry.getEndTime())) {
                
                String conflictKey = String.format("%s (%s - %s)",
                        newEntry.getDay(), newEntry.getStartTime(), newEntry.getEndTime());
                
                UserDTO studentDTO = convertToUserDTO(student);
                
                if (!conflicts.containsKey(conflictKey)) {
                    conflicts.put(conflictKey, new ArrayList<>());
                }
                
                // Only add the student once per conflict time
                if (conflicts.get(conflictKey).stream().noneMatch(u -> u.getId().equals(studentDTO.getId()))) {
                    conflicts.get(conflictKey).add(studentDTO);
                }
            }
        }
    }
}

/**
 * Check if two time ranges conflict
 */
private boolean hasTimeConflict(String day1, String startTime1, String endTime1,
                              String day2, String startTime2, String endTime2) {
    // First check if the days are the same
    if (!day1.equals(day2)) {
        return false;
    }
    
    // Convert times to minutes for easier comparison
    int start1 = convertTimeToMinutes(startTime1);
    int end1 = convertTimeToMinutes(endTime1);
    int start2 = convertTimeToMinutes(startTime2);
    int end2 = convertTimeToMinutes(endTime2);
    
    // Check for overlap: 
    // If one time slot ends before or at the same time the other starts, they don't overlap
    // Otherwise, they do overlap
    return !(end1 <= start2 || end2 <= start1);
}

/**
 * Convert time in format "HH:MM" to minutes since midnight
 */
private int convertTimeToMinutes(String time) {
    String[] parts = time.split(":");
    int hours = Integer.parseInt(parts[0]);
    int minutes = Integer.parseInt(parts[1]);
    return hours * 60 + minutes;
}

/**
 * Format conflict message for user-friendly display
 */
private String formatConflictMessage(Map<String, List<UserDTO>> conflicts) {
    StringBuilder message = new StringBuilder("The following time slots have conflicts:\n");
    
    for (Map.Entry<String, List<UserDTO>> entry : conflicts.entrySet()) {
        message.append("- ").append(entry.getKey()).append(": ");
        
        List<UserDTO> users = entry.getValue();
        List<String> professorNames = new ArrayList<>();
        List<String> studentNames = new ArrayList<>();
        
        for (UserDTO user : users) {
            String name = user.getFirstName() + " " + user.getLastName();
            if ("PROFESSOR".equals(user.getRole())) {
                professorNames.add("Professor " + name);
            } else {
                studentNames.add(name);
            }
        }
        
        if (!professorNames.isEmpty()) {
            message.append("Professors: ").append(String.join(", ", professorNames)).append("; ");
        }
        
        if (!studentNames.isEmpty()) {
            message.append("Students: ");
            if (studentNames.size() <= 3) {
                message.append(String.join(", ", studentNames));
            } else {
                // If more than 3 students have conflicts, just show the count
                message.append(studentNames.size()).append(" students");
            }
        }
        
        message.append("\n");
    }
    
    return message.toString();
}
    /**
     * Get timetable entries for a student based on their class groups
     */
    public List<TimetableEntryDTO> getStudentTimetable(Long studentId) {
        List<ClassGroup> classGroups = classGroupRepository.findByStudentId(studentId);
        
        List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
        
        for (ClassGroup classGroup : classGroups) {
            for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                TimetableEntryDTO entryDTO = convertToTimetableEntryDTO(entry);
                // Add class info to entry name for display
                entryDTO.setName(classGroup.getCourseCode() + ": " + entryDTO.getName());
                timetableEntries.add(entryDTO);
            }
        }
        
        return timetableEntries;
    }
    
    /**
     * Get timetable entries for a professor based on their assigned class groups
     */
    public List<TimetableEntryDTO> getProfessorTimetable(Long professorId) {
        List<ClassGroup> classGroups = classGroupRepository.findByProfessorId(professorId);
        
        List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
        
        for (ClassGroup classGroup : classGroups) {
            for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                TimetableEntryDTO entryDTO = convertToTimetableEntryDTO(entry);
                // Add class info to entry name for display
                entryDTO.setName(classGroup.getCourseCode() + ": " + entryDTO.getName());
                timetableEntries.add(entryDTO);
            }
        }
        
        return timetableEntries;
    }
    
    /**
     * Synchronize a professor's timetable with their class groups
     */
    @Transactional
    private void syncProfessorTimetable(User professor, ClassGroup classGroup) {
        // Ensure the class group has a timetable
        if (classGroup.getTimetableEntries() == null || classGroup.getTimetableEntries().isEmpty()) {
            return;
        }
        
        // Create entries to add to the professor's timetable
        List<TimetableEntry> entriesToAdd = new ArrayList<>();
        for (TimetableEntry entry : classGroup.getTimetableEntries()) {
            TimetableEntry professorEntry = new TimetableEntry();
            professorEntry.setDay(entry.getDay());
            professorEntry.setName(classGroup.getCourseCode() + ": " + entry.getName());
            professorEntry.setInstructor(entry.getInstructor() != null ? entry.getInstructor() : "");
            professorEntry.setLocation(entry.getLocation());
            professorEntry.setStartTime(entry.getStartTime());
            professorEntry.setEndTime(entry.getEndTime());
            professorEntry.setColor(entry.getColor());
            professorEntry.setType(entry.getType());
            entriesToAdd.add(professorEntry);
        }
        
        // Update professor's timetable
        if (professor.getTimetableEntries() == null) {
            professor.setTimetableEntries(new ArrayList<>());
        }
        
        // First remove any entries that might be from this class group
        professor.getTimetableEntries().removeIf(entry -> 
            entry.getName() != null && entry.getName().startsWith(classGroup.getCourseCode() + ":"));
        
        // Then add the new entries
        for (TimetableEntry entry : entriesToAdd) {
            professor.addTimetableEntry(entry);
        }
        
        // Save the professor
        userRepository.save(professor);
    }
    
    /**
     * Remove entries from a professor's timetable that are associated with a specific class group
     */
    @Transactional
    private void removeClassGroupFromProfessorTimetable(User professor, ClassGroup classGroup) {
        if (professor.getTimetableEntries() == null) {
            return;
        }
        
        // Filter out entries that start with this class group's code
        professor.getTimetableEntries().removeIf(entry -> 
            entry.getName() != null && entry.getName().startsWith(classGroup.getCourseCode() + ":"));
        
        // Save the professor
        userRepository.save(professor);
    }
    
    // Helper method to convert ClassGroup entity to DTO
    private ClassGroupDTO convertToClassGroupDTO(ClassGroup classGroup) {
        ClassGroupDTO dto = new ClassGroupDTO();
        dto.setId(classGroup.getId());
        dto.setName(classGroup.getName());
        dto.setCourseCode(classGroup.getCourseCode());
        dto.setDescription(classGroup.getDescription());
        dto.setAcademicYear(classGroup.getAcademicYear());
        dto.setSemester(classGroup.getSemester());
        
        if (classGroup.getBranch() != null) {
            dto.setBranchId(classGroup.getBranch().getId());
            dto.setBranchName(classGroup.getBranch().getName());
        }
        
        if (classGroup.getProfessor() != null) {
            dto.setProfessorId(classGroup.getProfessor().getId());
            dto.setProfessorName(classGroup.getProfessor().getFirstName() + " " + classGroup.getProfessor().getLastName());
        }
        
        // Convert students
        if (classGroup.getStudents() != null) {
            List<UserDTO> studentDTOs = classGroup.getStudents().stream()
                    .map(this::convertToUserDTO)
                    .collect(Collectors.toList());
            dto.setStudents(studentDTOs);
            dto.setStudentCount(studentDTOs.size());
        }
        
        // Convert timetable entries
        if (classGroup.getTimetableEntries() != null) {
            List<TimetableEntryDTO> entryDTOs = classGroup.getTimetableEntries().stream()
                    .map(this::convertToTimetableEntryDTO)
                    .collect(Collectors.toList());
            dto.setTimetableEntries(entryDTOs);
        }
        
        // Format last updated date
        if (classGroup.getUpdatedAt() != null) {
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm");
            dto.setLastUpdated(dateFormat.format(classGroup.getUpdatedAt()));
        }
        
        return dto;
    }
    
    // Helper method to convert User entity to UserDTO
    private UserDTO convertToUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus())
                .build();
    }
    
    // Helper method to convert TimetableEntry entity to DTO
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
    
    // Helper method to convert TimetableEntryDTO to entity
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
        entry.setColor(dto.getColor() != null ? dto.getColor() : "#6366f1");
        entry.setType(dto.getType() != null ? dto.getType() : "Lecture");
        return entry;
    }
}