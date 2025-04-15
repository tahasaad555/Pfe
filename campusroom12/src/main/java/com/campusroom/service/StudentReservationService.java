package com.campusroom.service;

import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.ReservationRequestDTO;
import com.campusroom.model.Notification;
import com.campusroom.model.Reservation;
import com.campusroom.model.StudyRoom;
import com.campusroom.model.User;
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
    
    // Then modify the createStudyRoomReservation method to include email notification
@Transactional
public ReservationDTO createStudyRoomReservation(ReservationRequestDTO requestDTO) {
    System.out.println("Création d'une demande de réservation de salle d'étude: " + requestDTO);

    try {
        User currentUser = getCurrentUser();
        StudyRoom studyRoom = studyRoomRepository.findById(requestDTO.getRoomId())
                .orElseThrow(() -> new RuntimeException("Study room not found with id: " + requestDTO.getRoomId()));

        // Convertir la date
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date date = dateFormat.parse(requestDTO.getDate());

        // Vérifier qu'il n'y a pas de conflit
        if (hasConflictingReservation(studyRoom, date, requestDTO.getStartTime(), requestDTO.getEndTime())) {
            throw new RuntimeException("Cette salle d'étude n'est plus disponible pour cette plage horaire");
        }

        // Créer la réservation avec un ID UUID
        Reservation reservation = new Reservation();
        reservation.setId(UUID.randomUUID().toString());
        reservation.setUser(currentUser);
        reservation.setStudyRoom(studyRoom);
        reservation.setDate(date);
        reservation.setStartTime(requestDTO.getStartTime());
        reservation.setEndTime(requestDTO.getEndTime());
        reservation.setPurpose(requestDTO.getPurpose());
        reservation.setNotes(requestDTO.getNotes());
        reservation.setStatus("PENDING"); // Statut initial: en attente d'approbation

        Reservation savedReservation = reservationRepository.save(reservation);
        System.out.println("Réservation de salle d'étude créée avec succès: " + savedReservation.getId());

        // Créer une notification pour les administrateurs
        createAdminNotification(savedReservation);
        
        // Envoyer un email aux administrateurs - AJOUT
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        reservationEmailService.notifyAdminsAboutNewReservation(savedReservation, admins);

        return convertToReservationDTO(savedReservation);

    } catch (ParseException e) {
        System.err.println("Erreur lors de la conversion de la date: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Format de date invalide: " + requestDTO.getDate());
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
     * Vérifie s'il y a des réservations en conflit pour une salle d'étude donnée
     */
    private boolean hasConflictingReservation(StudyRoom studyRoom, Date date, String startTime, String endTime) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String dateStr = dateFormat.format(date);

        // Convertir en minutes pour faciliter la comparaison
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);

        // Trouver toutes les réservations approuvées ou en attente pour cette salle à cette date
        List<Reservation> existingReservations = reservationRepository.findByStudyRoomAndDateAndStatusIn(
                studyRoom, date, List.of("APPROVED", "PENDING"));

        // Vérifier s'il y a des conflits
        for (Reservation res : existingReservations) {
            int resStartMinutes = convertTimeToMinutes(res.getStartTime());
            int resEndMinutes = convertTimeToMinutes(res.getEndTime());

            // Vérifier si les plages horaires se chevauchent
            if (!(requestEndMinutes <= resStartMinutes || requestStartMinutes >= resEndMinutes)) {
                System.out.println("Conflit trouvé avec la réservation: " + res.getId());
                return true;
            }
        }

        return false;
    }

    /**
     * Convertit une heure au format "HH:mm" en minutes depuis minuit
     */
    private int convertTimeToMinutes(String time) {
        String[] parts = time.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }

    /**
     * Crée une notification pour les administrateurs concernant une nouvelle
     * demande de réservation d'étudiant
     */
    private void createAdminNotification(Reservation reservation) {
        // Trouver tous les utilisateurs avec le rôle ADMIN
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Nouvelle demande de salle d'étude");
            notification.setMessage("L'étudiant " + reservation.getUser().getFirstName() + " "
                    + reservation.getUser().getLastName() + " a demandé à réserver la salle d'étude "
                    + reservation.getStudyRoom().getName() + " le "
                    + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()) + ".");
            notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-book");
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