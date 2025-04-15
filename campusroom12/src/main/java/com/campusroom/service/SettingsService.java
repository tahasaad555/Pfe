package com.campusroom.service;

import com.campusroom.dto.SystemSettingsDTO;
import com.campusroom.model.SystemSettings;
import com.campusroom.repository.SystemSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {

    @Autowired
    private SystemSettingsRepository settingsRepository;
    
    public SystemSettingsDTO getSystemSettings() {
        SystemSettings settings = settingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    // Créer des paramètres par défaut si aucun n'existe
                    SystemSettings defaultSettings = new SystemSettings();
                    defaultSettings.setSystemName("Campus Room");
                    defaultSettings.setTagline("Smart Classroom Management System");
                    defaultSettings.setContactEmail("admin@campusroom.edu");
                    defaultSettings.setSupportPhone("(555) 123-4567");
                    defaultSettings.setAutoApproveAdmin(true);
                    defaultSettings.setAutoApproveProfessor(false);
                    defaultSettings.setAutoApproveStudent(false);
                    defaultSettings.setEmailNotifications(true);
                    defaultSettings.setNotificationReservationCreated(true);
                    defaultSettings.setNotificationReservationApproved(true);
                    defaultSettings.setNotificationReservationRejected(true);
                    defaultSettings.setNotificationNewUser(true);
                    defaultSettings.setNotificationSystemUpdates(true);
                    defaultSettings.setNotificationDailyDigest(false);
                    defaultSettings.setMaxDaysInAdvance(30);
                    defaultSettings.setMinTimeBeforeReservation(1);
                    defaultSettings.setMaxHoursPerReservation(4);
                    defaultSettings.setMaxReservationsPerWeek(5);
                    defaultSettings.setStudentRequireApproval(true);
                    defaultSettings.setProfessorRequireApproval(false);
                    defaultSettings.setShowAvailabilityCalendar(true);
                    return settingsRepository.save(defaultSettings);
                });
        
        return convertToDTO(settings);
    }
    
    @Transactional
    public SystemSettingsDTO updateSystemSettings(SystemSettingsDTO settingsDTO) {
        SystemSettings settings = settingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(SystemSettings::new);
        
        // Mettre à jour les paramètres généraux
        settings.setSystemName(settingsDTO.getSystemName());
        settings.setTagline(settingsDTO.getTagline());
        settings.setContactEmail(settingsDTO.getContactEmail());
        settings.setSupportPhone(settingsDTO.getSupportPhone());
        settings.setAutoApproveAdmin(settingsDTO.isAutoApproveAdmin());
        settings.setAutoApproveProfessor(settingsDTO.isAutoApproveProfessor());
        settings.setAutoApproveStudent(settingsDTO.isAutoApproveStudent());
        
        // Mettre à jour les paramètres de notification
        settings.setEmailNotifications(settingsDTO.isEmailNotifications());
        settings.setNotificationReservationCreated(settingsDTO.isReservationCreated());
        settings.setNotificationReservationApproved(settingsDTO.isReservationApproved());
        settings.setNotificationReservationRejected(settingsDTO.isReservationRejected());
        settings.setNotificationNewUser(settingsDTO.isNewUserRegistered());
        settings.setNotificationSystemUpdates(settingsDTO.isSystemUpdates());
        settings.setNotificationDailyDigest(settingsDTO.isDailyDigest());
        
        // Mettre à jour les paramètres de réservation
        settings.setMaxDaysInAdvance(settingsDTO.getMaxDaysInAdvance());
        settings.setMinTimeBeforeReservation(settingsDTO.getMinTimeBeforeReservation());
        settings.setMaxHoursPerReservation(settingsDTO.getMaxHoursPerReservation());
        settings.setMaxReservationsPerWeek(settingsDTO.getMaxReservationsPerWeek());
        settings.setStudentRequireApproval(settingsDTO.isStudentRequireApproval());
        settings.setProfessorRequireApproval(settingsDTO.isProfessorRequireApproval());
        settings.setShowAvailabilityCalendar(settingsDTO.isShowAvailabilityCalendar());
        
        SystemSettings savedSettings = settingsRepository.save(settings);
        return convertToDTO(savedSettings);
    }
    
    private SystemSettingsDTO convertToDTO(SystemSettings settings) {
        return SystemSettingsDTO.builder()
                .systemName(settings.getSystemName())
                .tagline(settings.getTagline())
                .contactEmail(settings.getContactEmail())
                .supportPhone(settings.getSupportPhone())
                .autoApproveAdmin(settings.isAutoApproveAdmin())
                .autoApproveProfessor(settings.isAutoApproveProfessor())
                .autoApproveStudent(settings.isAutoApproveStudent())
                .emailNotifications(settings.isEmailNotifications())
                .reservationCreated(settings.isNotificationReservationCreated())
                .reservationApproved(settings.isNotificationReservationApproved())
                .reservationRejected(settings.isNotificationReservationRejected())
                .newUserRegistered(settings.isNotificationNewUser())
                .systemUpdates(settings.isNotificationSystemUpdates())
                .dailyDigest(settings.isNotificationDailyDigest())
                .maxDaysInAdvance(settings.getMaxDaysInAdvance())
                .minTimeBeforeReservation(settings.getMinTimeBeforeReservation())
                .maxHoursPerReservation(settings.getMaxHoursPerReservation())
                .maxReservationsPerWeek(settings.getMaxReservationsPerWeek())
                .studentRequireApproval(settings.isStudentRequireApproval())
                .professorRequireApproval(settings.isProfessorRequireApproval())
                .showAvailabilityCalendar(settings.isShowAvailabilityCalendar())
                .build();
    }
}