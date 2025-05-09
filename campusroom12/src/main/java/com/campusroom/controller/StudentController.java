package com.campusroom.controller;

import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.ReservationRequestDTO;
import com.campusroom.dto.StudyRoomDTO;
import com.campusroom.service.RoomService;
import com.campusroom.service.StudentReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.campusroom.dto.ClassroomDTO;
import org.springframework.http.HttpStatus;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.List;

/**
 * Contrôleur spécifique pour les fonctionnalités étudiantes
 */
@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    @Autowired
    private RoomService roomService;
    
    @Autowired
    private StudentReservationService studentReservationService;
    
/**
 * Endpoint for accessing classrooms available for students
 */
@GetMapping("/classrooms")
public ResponseEntity<List<ClassroomDTO>> getStudentClassrooms() {
    System.out.println("GET /api/student/classrooms - StudentController");
    try {
        List<ClassroomDTO> classrooms = roomService.getAllClassrooms();
        System.out.println("Returning " + classrooms.size() + " classrooms for students");
        return ResponseEntity.ok(classrooms);
    } catch (Exception e) {
        System.err.println("Error retrieving classrooms: " + e.getMessage());
        e.printStackTrace();
        throw e;
    }
}
    
  /**
 * Endpoint to reserve a classroom for a student
 */
@PostMapping("/classroom-reservations")
public ResponseEntity<ReservationDTO> requestClassroomReservation(
        @RequestBody ReservationRequestDTO requestDTO) {
    System.out.println("POST /api/student/classroom-reservations - StudentController");
    System.out.println("Received reservation data: " + requestDTO);
    
    try {
        ReservationDTO reservation = studentReservationService.createClassroomReservation(requestDTO);
        System.out.println("Reservation created successfully: " + reservation);
        return ResponseEntity.ok(reservation);
    } catch (Exception e) {
        System.err.println("Error creating reservation: " + e.getMessage());
        e.printStackTrace();
        throw e;
    }
}
    /**
     * Endpoint pour récupérer l'historique des réservations de l'étudiant
     */
    @GetMapping("/my-reservations")
    public ResponseEntity<List<ReservationDTO>> getMyReservations() {
        System.out.println("GET /api/student/my-reservations - StudentController");
        try {
            List<ReservationDTO> reservations = studentReservationService.getStudentReservations();
            System.out.println("Retourne " + reservations.size() + " réservations pour l'étudiant");
            return ResponseEntity.ok(reservations);
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des réservations: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Endpoint pour annuler une réservation
     */
    @PutMapping("/reservations/{id}/cancel")
    public ResponseEntity<ReservationDTO> cancelReservation(@PathVariable String id) {
        System.out.println("PUT /api/student/reservations/" + id + "/cancel - StudentController");
        try {
            ReservationDTO canceledReservation = studentReservationService.cancelReservation(id);
            System.out.println("Réservation annulée avec succès: " + canceledReservation);
            return ResponseEntity.ok(canceledReservation);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'annulation de la réservation: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    /**
 * Endpoint for searching available classrooms
 */
@PostMapping("/classrooms/search")
public ResponseEntity<List<ClassroomDTO>> searchAvailableClassrooms(@RequestBody ReservationRequestDTO requestDTO) throws Exception {
    System.out.println("POST /api/student/classrooms/search - StudentController");
    try {
        // Validate request parameters
        if (requestDTO.getDate() == null || requestDTO.getStartTime() == null || 
            requestDTO.getEndTime() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.emptyList());
        }
        
        // Convert capacity to int (handle the case where it might be a string in the request)
        int capacity = requestDTO.getCapacity();
        
        List<ClassroomDTO> availableClassrooms = roomService.findAvailableRooms(
            new SimpleDateFormat("yyyy-MM-dd").parse(requestDTO.getDate()), 
            requestDTO.getStartTime(), 
            requestDTO.getEndTime(), 
            requestDTO.getClassType(), 
            capacity
        );
        
        System.out.println("Found " + availableClassrooms.size() + " available classrooms");
        return ResponseEntity.ok(availableClassrooms);
    } catch (Exception e) {
        System.err.println("Error searching for classrooms: " + e.getMessage());
        e.printStackTrace();
        throw e;
    }
}
    
}