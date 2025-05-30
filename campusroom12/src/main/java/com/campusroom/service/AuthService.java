package com.campusroom.service;

import com.campusroom.dto.*;
import com.campusroom.model.User;
import com.campusroom.repository.UserRepository;
import com.campusroom.security.JwtUtils;
import com.campusroom.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Random;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private SystemSettingsProvider settingsProvider;
    
    private SystemSettingsDTO currentSettings;
    
    @EventListener(SystemSettingsProvider.SettingsChangedEvent.class)
    public void handleSettingsChange(SystemSettingsProvider.SettingsChangedEvent event) {
        this.currentSettings = event.getSettings();
        logger.info("AuthService: Settings updated");
    }
    
    public AuthResponse authenticateUser(LoginRequest loginRequest) {
    try {
        // Add this block at the start of the method before authentication
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getStatus() != null && user.getStatus().equals("inactive")) {
                return AuthResponse.builder()
                        .success(false)
                        .message("Votre compte n'est pas activé. Veuillez contacter l'administrateur.")
                        .build();
            }
        }
        
        // Continue with the existing code...
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getEmail(), 
                loginRequest.getPassword()
            )
        );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            Object principal = authentication.getPrincipal();
            logger.info("Principal class: {}", principal.getClass().getName());
            
            if (principal instanceof UserDetailsImpl) {
                UserDetailsImpl userDetails = (UserDetailsImpl) principal;
                String jwt = jwtUtils.generateToken(userDetails);
                
                return AuthResponse.builder()
                        .token(jwt)
                        .id(userDetails.getId())
                        .firstName(userDetails.getFirstName())
                        .lastName(userDetails.getLastName())
                        .email(userDetails.getEmail())
                        .role(userDetails.getRole())
                        .success(true)
                        .build();
            } else {
                logger.warn("Principal type: {}", principal.getClass().getName());
                return AuthResponse.builder()
                        .success(false)
                        .message("Authentication error: Unknown user type")
                        .build();
            }
        } catch (BadCredentialsException e) {
            logger.error("Bad credentials: {}", e.getMessage());
            return AuthResponse.builder()
                    .success(false)
                    .message("Email ou mot de passe incorrect")
                    .build();
        } catch (Exception e) {
            logger.error("Authentication error", e);
            return AuthResponse.builder()
                    .success(false)
                    .message("Erreur d'authentification: " + e.getMessage())
                    .build();
        }
    }

   // Replace the forgotPassword method with this:
@Transactional
public AuthResponse forgotPassword(ForgotPasswordRequest request) {
    return userRepository.findByEmail(request.getEmail())
            .map(user -> {
                // Generate a 5-digit verification code
                String verificationCode = generateVerificationCode();
                
                // Save the code and expiration time (15 minutes)
                user.setVerificationCode(verificationCode);
                user.setVerificationCodeExpiry(new Date(System.currentTimeMillis() + 900000)); // 15 minutes
                userRepository.save(user);
                
                // Try to send email
                boolean emailSent = false;
                try {
                    emailSent = emailService.sendVerificationCodeEmail(user.getEmail(), verificationCode);
                } catch (Exception e) {
                    logger.error("Failed to send verification code email: {}", e.getMessage(), e);
                }
                
                if (emailSent) {
                    return AuthResponse.builder()
                            .success(true)
                            .message("Un code de vérification a été envoyé à votre adresse email")
                            .build();
                } else {
                    // Fallback: return the code directly (for testing)
                    return AuthResponse.builder()
                            .success(true)
                            .message("Code de vérification (test): " + verificationCode)
                            .build();
                }
            })
            .orElse(AuthResponse.builder()
                    .success(false)
                    .message("Aucun compte trouvé avec cet email")
                    .build());
}

    @Transactional
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Les mots de passe ne correspondent pas")
                    .build();
        }
        
        return userRepository.findByResetToken(request.getToken())
                .map(user -> {
                    // Vérifier si le token a expiré
                    if (user.getResetTokenExpiry() != null && user.getResetTokenExpiry().before(new Date())) {
                        return AuthResponse.builder()
                                .success(false)
                                .message("Le token a expiré")
                                .build();
                    }
                    
                    // Mettre à jour le mot de passe et supprimer le token
                    user.setPassword(passwordEncoder.encode(request.getPassword()));
                    user.setResetToken(null);
                    user.setResetTokenExpiry(null);
                    userRepository.save(user);
                    
                    return AuthResponse.builder()
                            .success(true)
                            .message("Mot de passe réinitialisé avec succès")
                            .build();
                })
                .orElse(AuthResponse.builder()
                        .success(false)
                        .message("Token invalide")
                        .build());
    }
    
    @Transactional
    public AuthResponse resetPasswordForAllUsers() {
        try {
            List<User> allUsers = userRepository.findAll();
            int count = 0;
            int emailSentCount = 0;
            
            for (User user : allUsers) {
                String token = UUID.randomUUID().toString();
                user.setResetToken(token);
                user.setResetTokenExpiry(new Date(System.currentTimeMillis() + 3600000)); // 1 heure
                userRepository.save(user);
                count++;
                
                // Essayer d'envoyer un email
                try {
                    boolean sent = emailService.sendPasswordResetEmail(user.getEmail(), token);
                    if (sent) {
                        emailSentCount++;
                    }
                } catch (Exception e) {
                    logger.error("Failed to send email to {}: {}", user.getEmail(), e.getMessage());
                }
            }
            
            return AuthResponse.builder()
                    .success(true)
                    .message("Des liens de réinitialisation ont été envoyés à " + emailSentCount + 
                             " utilisateurs sur " + count + ". " +
                             (count > emailSentCount ? "Certains emails n'ont pas pu être envoyés." : ""))
                    .build();
        } catch (Exception e) {
            logger.error("Failed to reset passwords for all users", e);
            return AuthResponse.builder()
                    .success(false)
                    .message("Échec de la réinitialisation des mots de passe : " + e.getMessage())
                    .build();
        }
    }
    
// Update the changeUserStatus method in AuthService.java:

@Transactional
public AuthResponse changeUserStatus(Long userId, String status) {
    try {
        Optional<User> userOptional = userRepository.findById(userId);
        
        if (!userOptional.isPresent()) {
            return AuthResponse.builder()
                    .success(false)
                    .message("User not found with ID: " + userId)
                    .build();
        }
        
        User user = userOptional.get();
        
        // Check if user is admin before changing status
        if (user.getRole() == User.Role.ADMIN) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Cannot change status of administrator users.")
                    .build();
        }
        
        // Validate status
        if (!"active".equals(status) && !"inactive".equals(status)) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid status. Use 'active' or 'inactive'.")
                    .build();
        }
        
        // Store old status for logging
        String oldStatus = user.getStatus();
        
        // Update user status
        user.setStatus(status);
        User updatedUser = userRepository.save(user);
        
        // Log the change
        logger.info("User status changed - ID: {}, Email: {}, From: {} To: {}", 
                   userId, user.getEmail(), oldStatus, status);
        
        String message = status.equals("active") 
            ? "User activated successfully" 
            : "User deactivated successfully";
        
        return AuthResponse.builder()
                .success(true)
                .message(message)
                .id(updatedUser.getId())
                .firstName(updatedUser.getFirstName())
                .lastName(updatedUser.getLastName())
                .email(updatedUser.getEmail())
                .role(updatedUser.getRole().name())
                .build();
        
    } catch (Exception e) {
        logger.error("Error changing user status for user ID {}: {}", userId, e.getMessage(), e);
        return AuthResponse.builder()
                .success(false)
                .message("Failed to change user status: " + e.getMessage())
                .build();
    }
}
    
        // Add this method to generate verification code
private String generateVerificationCode() {
    Random random = new Random();
    return String.format("%05d", random.nextInt(100000));
}

     // Add this new method to verify the code
@Transactional
public AuthResponse verifyCode(VerifyCodeRequest request) {
    return userRepository.findByEmail(request.getEmail())
            .map(user -> {
                // Check if verification code matches and hasn't expired
                if (user.getVerificationCode() == null) {
                    return AuthResponse.builder()
                            .success(false)
                            .message("Aucun code de vérification trouvé. Veuillez demander un nouveau code.")
                            .build();
                }
                
                if (!user.getVerificationCode().equals(request.getVerificationCode())) {
                    return AuthResponse.builder()
                            .success(false)
                            .message("Code de vérification incorrect")
                            .build();
                }
                
                if (user.getVerificationCodeExpiry() != null && 
                    user.getVerificationCodeExpiry().before(new Date())) {
                    return AuthResponse.builder()
                            .success(false)
                            .message("Le code de vérification a expiré")
                            .build();
                }
                
                return AuthResponse.builder()
                        .success(true)
                        .message("Code de vérification validé avec succès")
                        .build();
            })
            .orElse(AuthResponse.builder()
                    .success(false)
                    .message("Aucun compte trouvé avec cet email")
                    .build());
}

      // Add this new method to reset password with verification code
@Transactional
public AuthResponse resetPasswordWithCode(ResetPasswordWithCodeRequest request) {
    if (!request.getPassword().equals(request.getConfirmPassword())) {
        return AuthResponse.builder()
                .success(false)
                .message("Les mots de passe ne correspondent pas")
                .build();
    }
    
    return userRepository.findByEmail(request.getEmail())
            .map(user -> {
                // Verify the code again
                if (user.getVerificationCode() == null || 
                    !user.getVerificationCode().equals(request.getVerificationCode())) {
                    return AuthResponse.builder()
                            .success(false)
                            .message("Code de vérification invalide")
                            .build();
                }
                
                if (user.getVerificationCodeExpiry() != null && 
                    user.getVerificationCodeExpiry().before(new Date())) {
                    return AuthResponse.builder()
                            .success(false)
                            .message("Le code de vérification a expiré")
                            .build();
                }
                
                // Update password and clear verification code
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                user.setVerificationCode(null);
                user.setVerificationCodeExpiry(null);
                userRepository.save(user);
                
                return AuthResponse.builder()
                        .success(true)
                        .message("Mot de passe réinitialisé avec succès")
                        .build();
            })
            .orElse(AuthResponse.builder()
                    .success(false)
                    .message("Utilisateur non trouvé")
                    .build());
}     

}