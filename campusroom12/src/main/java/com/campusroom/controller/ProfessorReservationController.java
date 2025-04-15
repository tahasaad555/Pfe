package com.campusroom.controller;

import com.campusroom.dto.ClassroomDTO;
import com.campusroom.dto.ReservationDTO;
import com.campusroom.dto.ReservationRequestDTO;
import com.campusroom.service.ProfessorReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/professor/reservations")
@PreAuthorize("hasRole('PROFESSOR')")
public class ProfessorReservationController {
    
    @Autowired
    private ProfessorReservationService professorReservationService;
    
    // Get all reservations for the current professor
    @GetMapping("")
    public ResponseEntity<List<ReservationDTO>> getProfessorReservations() {
        System.out.println("GET /api/professor/reservations");
        return ResponseEntity.ok(professorReservationService.getProfessorReservations());
    }
    
    // Alternative endpoint that does the same as above (can be removed)
    @GetMapping("/my-reservations")
    public ResponseEntity<List<ReservationDTO>> getMyReservations() {
        System.out.println("GET /api/professor/reservations/my-reservations");
        return ResponseEntity.ok(professorReservationService.getProfessorReservations());
    }
    
    // Search with DTO parameter (recommended approach)
    @PostMapping("/search")
    public ResponseEntity<List<ClassroomDTO>> searchAvailableClassrooms(@RequestBody ReservationRequestDTO request) {
        System.out.println("POST /api/professor/reservations/search");
        System.out.println("Critères de recherche: " + request);
        
        List<ClassroomDTO> availableClassrooms = professorReservationService.findAvailableClassrooms(
            request.getDate(), 
            request.getStartTime(), 
            request.getEndTime(), 
            request.getClassType(), 
            request.getCapacity()
        );
        
        System.out.println("Salles disponibles trouvées: " + availableClassrooms.size());
        return ResponseEntity.ok(availableClassrooms);
    }
    
    // Make a reservation request
    @PostMapping("/request")
    public ResponseEntity<ReservationDTO> requestReservation(@RequestBody ReservationRequestDTO request) {
        System.out.println("POST /api/professor/reservations/request");
        System.out.println("Demande de réservation: " + request);
        
        ReservationDTO reservation = professorReservationService.createReservationRequest(request);
        System.out.println("Demande de réservation créée: " + reservation);
        
        return ResponseEntity.ok(reservation);
    }
    
    // Cancel a reservation
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ReservationDTO> cancelReservation(@PathVariable String id) {
        System.out.println("PUT /api/professor/reservations/" + id + "/cancel");
        
        ReservationDTO canceledReservation = professorReservationService.cancelReservation(id);
        System.out.println("Réservation annulée: " + canceledReservation);
        
        return ResponseEntity.ok(canceledReservation);
    }
}