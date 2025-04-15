package com.campusroom.service;

import com.campusroom.model.Reservation;
import com.campusroom.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.List;

@Service
public class ReservationEmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(ReservationEmailService.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    /**
     * Send an email to a user about their reservation status update
     */
    public boolean sendReservationStatusEmail(Reservation reservation, String status, String reason) {
        try {
            User user = reservation.getUser();
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            
            String subject = "";
            String content = "";
            String roomName = reservation.getClassroom() != null ? 
                    reservation.getClassroom().getRoomNumber() : 
                    (reservation.getStudyRoom() != null ? reservation.getStudyRoom().getName() : "N/A");
            String dateStr = new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate());
            
            if ("APPROVED".equals(status)) {
                subject = "Votre réservation a été approuvée";
                content = "Bonjour " + user.getFirstName() + ",\n\n" +
                          "Votre demande de réservation pour la salle " + roomName + 
                          " le " + dateStr + " de " + reservation.getStartTime() + 
                          " à " + reservation.getEndTime() + " a été approuvée.\n\n" +
                          "Cordialement,\nL'équipe CampusRoom";
            } else if ("REJECTED".equals(status)) {
                subject = "Votre réservation a été refusée";
                content = "Bonjour " + user.getFirstName() + ",\n\n" +
                          "Votre demande de réservation pour la salle " + roomName + 
                          " le " + dateStr + " de " + reservation.getStartTime() + 
                          " à " + reservation.getEndTime() + " a été refusée.\n\n";
                
                if (reason != null && !reason.isEmpty()) {
                    content += "Raison du refus: " + reason + "\n\n";
                }
                
                content += "Cordialement,\nL'équipe CampusRoom";
            }
            
            message.setSubject(subject);
            message.setText(content);
            
            logger.info("Sending reservation status email to: {}", user.getEmail());
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", user.getEmail());
            return true;
        } catch (Exception e) {
            logger.error("Error sending reservation status email: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Send an email to administrators about a new reservation request
     */
    public int notifyAdminsAboutNewReservation(Reservation reservation, List<User> admins) {
        int successCount = 0;
        
        try {
            User requestingUser = reservation.getUser();
            String roomName = reservation.getClassroom() != null ? 
                    reservation.getClassroom().getRoomNumber() : 
                    (reservation.getStudyRoom() != null ? reservation.getStudyRoom().getName() : "N/A");
            String dateStr = new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate());
            String userRole = requestingUser.getRole().name();
            
            for (User admin : admins) {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setTo(admin.getEmail());
                    
                    String subject = "Nouvelle demande de réservation";
                    String content = "Bonjour " + admin.getFirstName() + ",\n\n" +
                                     "Une nouvelle demande de réservation a été soumise:\n\n" +
                                     "Demandeur: " + requestingUser.getFirstName() + " " + requestingUser.getLastName() + " (" + userRole + ")\n" +
                                     "Salle: " + roomName + "\n" +
                                     "Date: " + dateStr + "\n" +
                                     "Horaire: " + reservation.getStartTime() + " - " + reservation.getEndTime() + "\n" +
                                     "Motif: " + reservation.getPurpose() + "\n\n" +
                                     "Veuillez vous connecter au système CampusRoom pour approuver ou refuser cette demande.\n\n" +
                                     "Cordialement,\nL'équipe CampusRoom";
                    
                    message.setSubject(subject);
                    message.setText(content);
                    
                    logger.info("Sending new reservation notification to admin: {}", admin.getEmail());
                    mailSender.send(message);
                    logger.info("Email sent successfully to admin: {}", admin.getEmail());
                    successCount++;
                } catch (Exception e) {
                    logger.error("Error sending email to admin {}: {}", admin.getEmail(), e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.error("Error in admin notification process: {}", e.getMessage(), e);
        }
        
        return successCount;
    }
}