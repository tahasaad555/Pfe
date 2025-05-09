package com.campusroom.service;

import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.ReservationRequestDTO;
import com.campusroom.model.Classroom;
import com.campusroom.model.Notification;
import com.campusroom.model.Reservation;
import com.campusroom.model.StudyRoom;
import com.campusroom.model.User;
import com.campusroom.repository.ClassroomRepository;
import com.campusroom.repository.NotificationRepository;
import com.campusroom.repository.ReservationRepository;
import com.campusroom.repository.StudyRoomRepository;
import com.campusroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
// Add this import at the top
import org.springframework.beans.factory.annotation.Autowired;
import com.campusroom.service.ReservationEmailService;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StudentReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private StudyRoomRepository studyRoomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
private ClassroomRepository classroomRepository;
    
    @Autowired
private ReservationEmailService reservationEmailService;

    /**
     * Récupère les réservations de l'étudiant connecté
     */
    public List<ReservationDTO> getStudentReservations() {
        User currentUser = getCurrentUser();
        System.out.println("Récupération des réservations pour l'étudiant: " + currentUser.getEmail());

        return reservationRepository.findByUser(currentUser).stream()
                .map(this::convertToReservationDTO)
                .collect(Collectors.toList());
    }
    
/**
 * Creates a classroom reservation request for a student
 */
@Transactional
public ReservationDTO createClassroomReservation(ReservationRequestDTO requestDTO) {
    System.out.println("Creating classroom reservation request: " + requestDTO);

    try {
        User currentUser = getCurrentUser();
        Classroom classroom = classroomRepository.findById(requestDTO.getClassroomId())
                .orElseThrow(() -> new RuntimeException("Classroom not found with id: " + requestDTO.getClassroomId()));

        // Convert the date
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date date = dateFormat.parse(requestDTO.getDate());

        // Check for conflicts
        if (hasConflictingClassroomReservation(classroom, date, requestDTO.getStartTime(), requestDTO.getEndTime())) {
            throw new RuntimeException("This classroom is no longer available for this time slot");
        }

        // Create the reservation with UUID
        Reservation reservation = new Reservation();
        reservation.setId(UUID.randomUUID().toString());
        reservation.setUser(currentUser);
        reservation.setClassroom(classroom);
        reservation.setDate(date);
        reservation.setStartTime(requestDTO.getStartTime());
        reservation.setEndTime(requestDTO.getEndTime());
        reservation.setPurpose(requestDTO.getPurpose());
        reservation.setNotes(requestDTO.getNotes());
        reservation.setStatus("PENDING"); // Initial status: pending approval

        Reservation savedReservation = reservationRepository.save(reservation);
        System.out.println("Classroom reservation created successfully: " + savedReservation.getId());

        // Create admin notification
        createAdminClassroomNotification(savedReservation);
        
        // Send email to admins if notifications are enabled
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        reservationEmailService.notifyAdminsAboutNewReservation(savedReservation, admins);

        return convertToReservationDTO(savedReservation);

    } catch (ParseException e) {
        System.err.println("Date conversion error: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Invalid date format: " + requestDTO.getDate());
    }
}
    /**
     * Annule une réservation
     */
    @Transactional
    public ReservationDTO cancelReservation(String id) {
        System.out.println("Annulation de la réservation de salle d'étude: " + id);

        User currentUser = getCurrentUser();
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

        // Vérifier que la réservation appartient bien à l'étudiant connecté
        if (!reservation.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à annuler cette réservation");
        }

        // Vérifier que la réservation peut être annulée (pas déjà terminée)
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        String today = sdf.format(new Date());
        try {
            if (reservation.getDate().before(sdf.parse(today))) {
                throw new RuntimeException("Impossible d'annuler une réservation passée");
            }
        } catch (ParseException e) {
            e.printStackTrace();
        }

        // Mettre à jour le statut
        reservation.setStatus("CANCELED");
        Reservation updatedReservation = reservationRepository.save(reservation);
        System.out.println("Réservation annulée avec succès: " + updatedReservation.getId());

        // Créer une notification pour les administrateurs
        createCancellationNotification(updatedReservation);

        return convertToReservationDTO(updatedReservation);
    }


/**
 * Checks if there are conflicting reservations for a classroom
 */
private boolean hasConflictingClassroomReservation(Classroom classroom, Date date, String startTime, String endTime) {
    // Basic validation first
    int requestStartMinutes = convertTimeToMinutes(startTime);
    int requestEndMinutes = convertTimeToMinutes(endTime);
    
    // Check for invalid time range
    if (requestEndMinutes <= requestStartMinutes) {
        throw new RuntimeException("Invalid time range: end time must be after start time");
    }
    
    // Find all approved or pending reservations for this classroom on this date
    List<Reservation> existingReservations = reservationRepository.findByClassroomAndDateAndStatusIn(
            classroom, date, List.of("APPROVED", "PENDING"));
    
    // Check each existing reservation for overlap
    for (Reservation res : existingReservations) {
        int resStartMinutes = convertTimeToMinutes(res.getStartTime());
        int resEndMinutes = convertTimeToMinutes(res.getEndTime());
        
        if (requestEndMinutes > resStartMinutes && requestStartMinutes < resEndMinutes) {
            System.out.println("Conflict found with reservation: " + res.getId());
            System.out.println("Requested time: " + startTime + " - " + endTime);
            System.out.println("Conflicting time: " + res.getStartTime() + " - " + res.getEndTime());
            return true;
        }
    }
    
    return false;
}
   /**
 * Convertit une heure au format "HH:mm" en minutes depuis minuit
 * Handles edge cases and validation better
 */
private int convertTimeToMinutes(String time) {
    if (time == null || !time.matches("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")) {
        throw new RuntimeException("Invalid time format: " + time + ". Expected format is HH:MM");
    }
    
    String[] parts = time.split(":");
    int hours = Integer.parseInt(parts[0]);
    int minutes = Integer.parseInt(parts[1]);
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new RuntimeException("Invalid time values: hours must be 0-23, minutes must be 0-59");
    }
    
    return hours * 60 + minutes;
}

/**
 * Create a notification for admins about new classroom reservation by student
 */
private void createAdminClassroomNotification(Reservation reservation) {
    // Find all admin users
    List<User> admins = userRepository.findByRole(User.Role.ADMIN);

    for (User admin : admins) {
        Notification notification = new Notification();
        notification.setTitle("New Classroom Reservation Request");
        notification.setMessage("Student " + reservation.getUser().getFirstName() + " " 
                + reservation.getUser().getLastName() + " has requested to reserve classroom "
                + reservation.getClassroom().getRoomNumber() + " on "
                + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()) + ".");
        notification.setUser(admin);
        notification.setRead(false);
        notification.setIconClass("fas fa-school");
        notification.setIconColor("blue");

        notificationRepository.save(notification);
    }
}

    /**
     * Crée une notification pour les administrateurs concernant une annulation
     * de réservation d'étudiant
     */
    private void createCancellationNotification(Reservation reservation) {
        // Trouver tous les utilisateurs avec le rôle ADMIN
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Réservation salle d'étude annulée");
            notification.setMessage("L'étudiant " + reservation.getUser().getFirstName() + " "
                    + reservation.getUser().getLastName() + " a annulé sa réservation pour la salle d'étude "
                    + reservation.getStudyRoom().getName() + " le "
                    + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()) + ".");
            notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-calendar-times");
            notification.setIconColor("orange");

            notificationRepository.save(notification);
        }
    }

    /**
     * Récupère l'utilisateur courant
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    /**
     * Convertit une entité Reservation en DTO
     */
    private ReservationDTO convertToReservationDTO(Reservation reservation) {
        String roomName = reservation.getStudyRoom() != null
                ? reservation.getStudyRoom().getName()
                : (reservation.getClassroom() != null ? reservation.getClassroom().getRoomNumber() : "N/A");

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
    
}