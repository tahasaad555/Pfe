package com.campusroom.service;

import com.campusroom.dto.ClassroomDTO;
import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.ReservationRequestDTO;
import com.campusroom.model.Classroom;
import com.campusroom.model.Notification;
import com.campusroom.model.Reservation;
import com.campusroom.model.User;
import com.campusroom.repository.ClassroomRepository;
import com.campusroom.repository.NotificationRepository;
import com.campusroom.repository.ReservationRepository;
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
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProfessorReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // Then add this field in the class
@Autowired
private ReservationEmailService reservationEmailService;

    /**
     * Récupère les réservations du professeur connecté
     */
    public List<ReservationDTO> getProfessorReservations() {
        User currentUser = getCurrentUser();
        System.out.println("Récupération des réservations pour le professeur: " + currentUser.getEmail());

        return reservationRepository.findByUser(currentUser).stream()
                .map(this::convertToReservationDTO)
                .collect(Collectors.toList());
    }

    /**
     * Recherche des salles disponibles selon les critères
     */
    public List<ClassroomDTO> findAvailableClassrooms(String dateStr, String startTime, String endTime,
            String classType, int capacity) {
        System.out.println("Recherche de salles disponibles avec les critères:");
        System.out.println("Date: " + dateStr + ", Heure: " + startTime + " - " + endTime);
        System.out.println("Type: " + classType + ", Capacité: " + capacity);

        try {
            // Convertir la date string en Date
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date date = dateFormat.parse(dateStr);

            // Trouver toutes les salles qui correspondent au type et à la capacité
            List<Classroom> matchingClassrooms = new ArrayList<>();

            if (classType != null && !classType.isEmpty()) {
                // Si un type spécifique est demandé
                matchingClassrooms = classroomRepository.findByTypeAndCapacityGreaterThanEqual(classType, capacity);
            } else {
                // Si aucun type spécifique n'est demandé
                matchingClassrooms = classroomRepository.findByCapacityGreaterThanEqual(capacity);
            }

            System.out.println("Salles correspondant aux critères de base: " + matchingClassrooms.size());

            // Filtrer les salles qui ont des réservations en conflit pour cette plage horaire
            List<Classroom> availableClassrooms = matchingClassrooms.stream()
                    .filter(classroom -> !hasConflictingReservation(classroom, date, startTime, endTime))
                    .collect(Collectors.toList());

            System.out.println("Salles disponibles après filtrage des conflits: " + availableClassrooms.size());

            // Convertir en DTOs et renvoyer
            return availableClassrooms.stream()
                    .map(this::convertToClassroomDTO)
                    .collect(Collectors.toList());

        } catch (ParseException e) {
            System.err.println("Erreur lors de la conversion de la date: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Format de date invalide: " + dateStr);
        }
    }

    // Then modify the createReservationRequest method to include email notification
@Transactional
public ReservationDTO createReservationRequest(ReservationRequestDTO requestDTO) {
    System.out.println("Création d'une demande de réservation: " + requestDTO);

    try {
        User currentUser = getCurrentUser();
        Classroom classroom = classroomRepository.findById(requestDTO.getClassroomId())
                .orElseThrow(() -> new RuntimeException("Classroom not found with id: " + requestDTO.getClassroomId()));

        // Convertir la date
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date date = dateFormat.parse(requestDTO.getDate());

        // Vérifier qu'il n'y a pas de conflit
        if (hasConflictingReservation(classroom, date, requestDTO.getStartTime(), requestDTO.getEndTime())) {
            throw new RuntimeException("Cette salle n'est plus disponible pour cette plage horaire");
        }

        // Créer la réservation avec un ID UUID
        Reservation reservation = new Reservation();
        reservation.setId(UUID.randomUUID().toString());
        reservation.setUser(currentUser);
        reservation.setClassroom(classroom);
        reservation.setDate(date);
        reservation.setStartTime(requestDTO.getStartTime());
        reservation.setEndTime(requestDTO.getEndTime());
        reservation.setPurpose(requestDTO.getPurpose());
        reservation.setStatus("PENDING"); // Statut initial: en attente d'approbation

        Reservation savedReservation = reservationRepository.save(reservation);
        System.out.println("Réservation créée avec succès: " + savedReservation.getId());

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
        System.out.println("Annulation de la réservation: " + id);

        User currentUser = getCurrentUser();
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));

        // Vérifier que la réservation appartient bien au professeur connecté
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
     * Vérifie s'il y a des réservations en conflit pour une salle donnée
     */
    private boolean hasConflictingReservation(Classroom classroom, Date date, String startTime, String endTime) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String dateStr = dateFormat.format(date);

        // Convertir en minutes pour faciliter la comparaison
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);

        // Trouver toutes les réservations approuvées ou en attente pour cette salle à cette date
        List<Reservation> existingReservations = reservationRepository.findByClassroomAndDateAndStatusIn(
                classroom, date, List.of("APPROVED", "PENDING"));

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
     * demande
     */
    private void createAdminNotification(Reservation reservation) {
        // Trouver tous les utilisateurs avec le rôle ADMIN
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Nouvelle demande de réservation");
            notification.setMessage("Le professeur " + reservation.getUser().getFirstName() + " "
                    + reservation.getUser().getLastName() + " a demandé à réserver la salle "
                    + reservation.getClassroom().getRoomNumber() + " le "
                    + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()) + ".");
            notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-calendar-plus");
            notification.setIconColor("blue");

            notificationRepository.save(notification);
        }
    }

    /**
     * Crée une notification pour les administrateurs concernant une annulation
     */
    private void createCancellationNotification(Reservation reservation) {
        // Trouver tous les utilisateurs avec le rôle ADMIN
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setTitle("Réservation annulée");
            notification.setMessage("Le professeur " + reservation.getUser().getFirstName() + " "
                    + reservation.getUser().getLastName() + " a annulé sa réservation pour la salle "
                    + reservation.getClassroom().getRoomNumber() + " le "
                    + new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()) + ".");
            notification.setUser(admin);
            notification.setRead(false);
            notification.setIconClass("fas fa-calendar-times");
            notification.setIconColor("red");

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
     * Convertit une entité Classroom en DTO
     */
    private ClassroomDTO convertToClassroomDTO(Classroom classroom) {
        return ClassroomDTO.builder()
                .id(classroom.getId())
                .roomNumber(classroom.getRoomNumber())
                .type(classroom.getType())
                .capacity(classroom.getCapacity())
                .features(classroom.getFeatures())
                .build();
    }
}
