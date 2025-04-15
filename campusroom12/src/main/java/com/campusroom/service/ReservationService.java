package com.campusroom.service;

import com.campusroom.dto.DemandDTO;
import com.campusroom.dto.ReservationDTO;
import com.campusroom.model.Notification;
import com.campusroom.model.Reservation;
import com.campusroom.model.User;
import com.campusroom.repository.NotificationRepository;
import com.campusroom.repository.ReservationRepository;
import com.campusroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import com.campusroom.service.ReservationEmailService;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;
// Then add this field in the class
@Autowired
private ReservationEmailService reservationEmailService;

    /**
     * Get all reservations
     */
    public List<ReservationDTO> getAllReservations() {
        System.out.println("ReservationService: getAllReservations");
        List<Reservation> reservations = reservationRepository.findAll();

        return reservations.stream()
                .map(this::convertToReservationDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get reservations by status
     */
    public List<ReservationDTO> getReservationsByStatus(String status) {
        System.out.println("ReservationService: getReservationsByStatus(" + status + ")");
        List<Reservation> reservations = reservationRepository.findByStatus(status);

        return reservations.stream()
                .map(this::convertToReservationDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get recent reservations
     */
    public List<ReservationDTO> getRecentReservations() {
        System.out.println("ReservationService: getRecentReservations");
        List<Reservation> recentReservations = reservationRepository.findTop10ByOrderByCreatedAtDesc();

        return recentReservations.stream()
                .map(this::convertToReservationDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get pending demands
     */
    public List<DemandDTO> getPendingDemands() {
        System.out.println("ReservationService: getPendingDemands");
        List<Reservation> pendingReservations = reservationRepository.findByStatus("PENDING");

        return pendingReservations.stream()
                .map(this::convertToDemandDTO)
                .collect(Collectors.toList());
    }

    // Update the approveReservation method
@Transactional
public ReservationDTO approveReservation(String id) {
    System.out.println("ReservationService: approveReservation(" + id + ")");

    Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

    if (!"PENDING".equals(reservation.getStatus())) {
        throw new RuntimeException("Can only approve pending reservations");
    }

    reservation.setStatus("APPROVED");
    Reservation updatedReservation = reservationRepository.save(reservation);

    // Create notification for the user
    createApprovalNotification(updatedReservation);
    
    // Send email notification to the user - AJOUT
    reservationEmailService.sendReservationStatusEmail(updatedReservation, "APPROVED", null);

    return convertToReservationDTO(updatedReservation);
}

    // Update the rejectReservation method
@Transactional
public ReservationDTO rejectReservation(String id, String reason) {  // Added reason parameter
    System.out.println("ReservationService: rejectReservation(" + id + ")");

    Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

    if (!"PENDING".equals(reservation.getStatus())) {
        throw new RuntimeException("Can only reject pending reservations");
    }

    reservation.setStatus("REJECTED");
    // Save reason if provided
    if (reason != null && !reason.isEmpty()) {
        reservation.setNotes(reason);  // Use the notes field to store rejection reason
    }
    Reservation updatedReservation = reservationRepository.save(reservation);

    // Create notification for the user
    createRejectionNotification(updatedReservation);
    
    // Send email notification to the user - AJOUT
    reservationEmailService.sendReservationStatusEmail(updatedReservation, "REJECTED", reason);

    return convertToReservationDTO(updatedReservation);
}

    /**
     * Cancel a reservation
     */
    @Transactional
    public ReservationDTO cancelReservation(String id) {
        System.out.println("ReservationService: cancelReservation(" + id + ")");

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

        // Only pending or approved reservations can be canceled
        if (!("PENDING".equals(reservation.getStatus()) || "APPROVED".equals(reservation.getStatus()))) {
            throw new RuntimeException("Only pending or approved reservations can be canceled");
        }

        reservation.setStatus("CANCELED");
        Reservation updatedReservation = reservationRepository.save(reservation);

        // Create notification for admins
        createCancellationNotification(updatedReservation);

        return convertToReservationDTO(updatedReservation);
    }

    /**
     * Create a notification for the user when their reservation is approved
     */
    private void createApprovalNotification(Reservation reservation) {
        User user = reservation.getUser();

        Notification notification = new Notification();
        notification.setTitle("Réservation approuvée");
        notification.setMessage("Votre demande de réservation pour la salle "
                + (reservation.getClassroom() != null ? reservation.getClassroom().getRoomNumber() : "N/A")
                + " le " + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate())
                + " de " + reservation.getStartTime() + " à " + reservation.getEndTime()
                + " a été approuvée.");
        notification.setUser(user);
        notification.setRead(false);
        notification.setIconClass("fas fa-check-circle");
        notification.setIconColor("green");

        notificationRepository.save(notification);
    }

    /**
     * Create a notification for the user when their reservation is rejected
     */
    private void createRejectionNotification(Reservation reservation) {
        User user = reservation.getUser();

        Notification notification = new Notification();
        notification.setTitle("Réservation refusée");
        notification.setMessage("Votre demande de réservation pour la salle "
                + (reservation.getClassroom() != null ? reservation.getClassroom().getRoomNumber() : "N/A")
                + " le " + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate())
                + " de " + reservation.getStartTime() + " à " + reservation.getEndTime()
                + " a été refusée.");
        notification.setUser(user);
        notification.setRead(false);
        notification.setIconClass("fas fa-times-circle");
        notification.setIconColor("red");

        notificationRepository.save(notification);
    }

    /**
     * Create a notification for admins when a user cancels their reservation
     */
    private void createCancellationNotification(Reservation reservation) {
        // Find all admins
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Réservation annulée");
            notification.setMessage(reservation.getUser().getFirstName() + " " + reservation.getUser().getLastName()
                    + " a annulé sa réservation pour la salle "
                    + (reservation.getClassroom() != null ? reservation.getClassroom().getRoomNumber() : "N/A")
                    + " le " + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate())
                    + " de " + reservation.getStartTime() + " à " + reservation.getEndTime() + ".");
            notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-calendar-times");
            notification.setIconColor("orange");

            notificationRepository.save(notification);
        }
    }

    /**
     * Convert Reservation entity to ReservationDTO
     */
    private ReservationDTO convertToReservationDTO(Reservation reservation) {
        String roomName = reservation.getClassroom() != null
                ? reservation.getClassroom().getRoomNumber()
                : (reservation.getStudyRoom() != null ? reservation.getStudyRoom().getName() : "N/A");

        return ReservationDTO.builder()
                .id(reservation.getId())
                .classroom(roomName)
                .reservedBy(reservation.getUser().getFirstName() + " " + reservation.getUser().getLastName())
                .role(reservation.getUser().getRole().name())
                .date(new SimpleDateFormat("yyyy-MM-dd").format(reservation.getDate()))
                .time(reservation.getStartTime() + " - " + reservation.getEndTime())
                .status(reservation.getStatus())
                .purpose(reservation.getPurpose())
                .build();
    }

    /**
     * Convert Reservation entity to DemandDTO
     */
    private DemandDTO convertToDemandDTO(Reservation reservation) {
        String roomName = reservation.getClassroom() != null
                ? reservation.getClassroom().getRoomNumber()
                : (reservation.getStudyRoom() != null ? reservation.getStudyRoom().getName() : "N/A");

        return DemandDTO.builder()
                .id(reservation.getId())
                .classroom(roomName)
                .reservedBy(reservation.getUser().getFirstName() + " " + reservation.getUser().getLastName())
                .role(reservation.getUser().getRole().name())
                .date(new SimpleDateFormat("yyyy-MM-dd").format(reservation.getDate()))
                .time(reservation.getStartTime() + " - " + reservation.getEndTime())
                .purpose(reservation.getPurpose())
                .notes(reservation.getNotes())
                .createdAt(reservation.getCreatedAt())
                .build();
    }
}
