package com.campusroom.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.campusroom.dto.PasswordChangeDTO;
import com.campusroom.dto.ProfileDTO;
import com.campusroom.model.User;
import com.campusroom.repository.UserRepository;

/**
 * Service for handling user profile operations
 */
@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Get user profile by user ID
     * @param userId User ID
     * @return ProfileDTO containing user profile information
     * @throws RuntimeException if user not found
     */
    public ProfileDTO getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        return convertToProfileDTO(user);
    }
    
    /**
     * Update user profile
     * @param profileDTO Updated profile information
     * @return Updated ProfileDTO
     * @throws RuntimeException if user not found
     */
    @Transactional
    public ProfileDTO updateProfile(ProfileDTO profileDTO) {
        User user = userRepository.findById(profileDTO.getId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + profileDTO.getId()));
        
        // Update user information
        user.setFirstName(profileDTO.getFirstName());
        user.setLastName(profileDTO.getLastName());
        
        // Only update optional fields if they are not null
        if (profileDTO.getDepartment() != null) {
            user.setDepartment(profileDTO.getDepartment());
        }
        
        if (profileDTO.getPhone() != null) {
            user.setPhone(profileDTO.getPhone());
        }
        
        // Update profile image URL if provided
        if (profileDTO.getProfileImageUrl() != null) {
            user.setProfileImageUrl(profileDTO.getProfileImageUrl());
        }
        
        // Save updated user
        User updatedUser = userRepository.save(user);
        
        return convertToProfileDTO(updatedUser);
    }
    
    /**
     * Change user password
     * @param userId User ID
     * @param passwordChangeDTO Password change data
     * @return True if password was changed successfully
     * @throws RuntimeException if user not found or current password is incorrect
     */
    @Transactional
    public boolean changePassword(Long userId, PasswordChangeDTO passwordChangeDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        // Verify current password
        if (!passwordEncoder.matches(passwordChangeDTO.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        // Verify that new passwords match
        if (!passwordChangeDTO.getNewPassword().equals(passwordChangeDTO.getConfirmPassword())) {
            throw new RuntimeException("New passwords do not match");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(passwordChangeDTO.getNewPassword()));
        userRepository.save(user);
        
        return true;
    }
    
    /**
     * Update profile image URL
     * @param userId User ID
     * @param imageUrl Profile image URL
     */
    @Transactional
    public void updateProfileImage(Long userId, String imageUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        user.setProfileImageUrl(imageUrl);
        userRepository.save(user);
    }
    
    /**
     * Convert User entity to ProfileDTO
     * @param user User entity
     * @return ProfileDTO
     */
   private ProfileDTO convertToProfileDTO(User user) {
    ProfileDTO profileDTO = new ProfileDTO();
    profileDTO.setId(user.getId());
    profileDTO.setFirstName(user.getFirstName());
    profileDTO.setLastName(user.getLastName());
    profileDTO.setEmail(user.getEmail());
    profileDTO.setRole(user.getRole().name());
    profileDTO.setDepartment(user.getDepartment());
    profileDTO.setPhone(user.getPhone());
    profileDTO.setProfileImageUrl(user.getProfileImageUrl()); // Include profile image URL
    // profileDTO.setLastLogin(user.getLastLogin()); SUPPRIMER CETTE LIGNE
    
    return profileDTO;
}
}