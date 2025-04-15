package com.campusroom.controller;

import com.campusroom.dto.AvailabilityDTO;
import com.campusroom.dto.ClassroomDTO;
import com.campusroom.dto.ResponseMessageDTO;
import com.campusroom.dto.StudyRoomDTO;
import com.campusroom.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur pour la gestion des salles (salles de classe et salles d'étude)
 * et la recherche de disponibilité
 */
@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @Autowired
    private RoomService roomService;
    
    /**
     * Endpoint public pour récupérer toutes les salles d'étude
     * Accessible sans authentification
     */
    @GetMapping("/public-studyrooms")
    public ResponseEntity<List<StudyRoomDTO>> getAllStudyRoomsPublic() {
        System.out.println("GET /public-studyrooms");
        List<StudyRoomDTO> studyRooms = roomService.getAllStudyRooms();
        System.out.println("Retourne " + studyRooms.size() + " salles d'étude (endpoint public)");
        return ResponseEntity.ok(studyRooms);
    }
    
    // ======== ENDPOINT POUR L'AFFICHAGE INITIAL DES SALLES ========
    
    /**
     * Endpoint pour récupérer toutes les salles sans filtrage
     * Pour l'affichage initial dans l'interface utilisateur
     */
    @GetMapping("/all-classrooms")
    public ResponseEntity<List<ClassroomDTO>> getAllClassroomsForDisplay() {
        System.out.println("GET /api/rooms/all-classrooms");
        List<ClassroomDTO> classrooms = roomService.getAllClassrooms();
        System.out.println("Retourne " + classrooms.size() + " salles pour affichage");
        return ResponseEntity.ok(classrooms);
    }
    
    // ======== ENDPOINTS POUR LES SALLES DE CLASSE ========
    
    @GetMapping("/classrooms")
    public ResponseEntity<List<ClassroomDTO>> getAllClassrooms() {
        System.out.println("GET /api/rooms/classrooms");
        List<ClassroomDTO> classrooms = roomService.getAllClassrooms();
        System.out.println("Retourne " + classrooms.size() + " salles de classe");
        return ResponseEntity.ok(classrooms);
    }
    
    @GetMapping("/classrooms/{id}")
    public ResponseEntity<ClassroomDTO> getClassroomById(@PathVariable String id) {
        System.out.println("GET /api/rooms/classrooms/" + id);
        ClassroomDTO classroom = roomService.getClassroomById(id);
        return ResponseEntity.ok(classroom);
    }
    
    @PostMapping("/classrooms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassroomDTO> createClassroom(@RequestBody ClassroomDTO classroomDTO) {
        System.out.println("POST /api/rooms/classrooms");
        System.out.println("Données reçues: " + classroomDTO);
        
        try {
            ClassroomDTO createdClassroom = roomService.createClassroom(classroomDTO);
            System.out.println("Salle créée avec succès: " + createdClassroom);
            return ResponseEntity.ok(createdClassroom);
        } catch (Exception e) {
            System.err.println("Erreur lors de la création de la salle: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @PutMapping("/classrooms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassroomDTO> updateClassroom(@PathVariable String id, @RequestBody ClassroomDTO classroomDTO) {
        System.out.println("PUT /api/rooms/classrooms/" + id);
        System.out.println("Données reçues pour mise à jour: " + classroomDTO);
        
        try {
            ClassroomDTO updatedClassroom = roomService.updateClassroom(id, classroomDTO);
            System.out.println("Salle mise à jour avec succès: " + updatedClassroom);
            return ResponseEntity.ok(updatedClassroom);
        } catch (Exception e) {
            System.err.println("Erreur lors de la mise à jour de la salle: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @DeleteMapping("/classrooms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> deleteClassroom(@PathVariable String id) {
        System.out.println("DELETE /api/rooms/classrooms/" + id);
        
        try {
            roomService.deleteClassroom(id);
            System.out.println("Salle supprimée avec succès: " + id);
            return ResponseEntity.ok(Map.of("deleted", true));
        } catch (Exception e) {
            System.err.println("Erreur lors de la suppression de la salle: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    // ======== ENDPOINTS POUR LES SALLES D'ÉTUDE ========
    
    @GetMapping("/study-rooms")
    public ResponseEntity<List<StudyRoomDTO>> getAllStudyRooms() {
        System.out.println("GET /api/rooms/study-rooms");
        List<StudyRoomDTO> studyRooms = roomService.getAllStudyRooms();
        System.out.println("Retourne " + studyRooms.size() + " salles d'étude");
        return ResponseEntity.ok(studyRooms);
    }
    
    @GetMapping("/study-rooms/{id}")
    public ResponseEntity<StudyRoomDTO> getStudyRoomById(@PathVariable String id) {
        System.out.println("GET /api/rooms/study-rooms/" + id);
        StudyRoomDTO studyRoom = roomService.getStudyRoomById(id);
        return ResponseEntity.ok(studyRoom);
    }
    
    @PostMapping("/study-rooms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudyRoomDTO> createStudyRoom(@RequestBody StudyRoomDTO studyRoomDTO) {
        System.out.println("POST /api/rooms/study-rooms");
        System.out.println("Données reçues: " + studyRoomDTO);
        
        try {
            StudyRoomDTO createdStudyRoom = roomService.createStudyRoom(studyRoomDTO);
            System.out.println("Salle d'étude créée avec succès: " + createdStudyRoom);
            return ResponseEntity.ok(createdStudyRoom);
        } catch (Exception e) {
            System.err.println("Erreur lors de la création de la salle d'étude: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @PutMapping("/study-rooms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudyRoomDTO> updateStudyRoom(@PathVariable String id, @RequestBody StudyRoomDTO studyRoomDTO) {
        System.out.println("PUT /api/rooms/study-rooms/" + id);
        System.out.println("Données reçues pour mise à jour: " + studyRoomDTO);
        
        try {
            StudyRoomDTO updatedStudyRoom = roomService.updateStudyRoom(id, studyRoomDTO);
            System.out.println("Salle d'étude mise à jour avec succès: " + updatedStudyRoom);
            return ResponseEntity.ok(updatedStudyRoom);
        } catch (Exception e) {
            System.err.println("Erreur lors de la mise à jour de la salle d'étude: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @DeleteMapping("/study-rooms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> deleteStudyRoom(@PathVariable String id) {
        System.out.println("DELETE /api/rooms/study-rooms/" + id);
        
        try {
            roomService.deleteStudyRoom(id);
            System.out.println("Salle d'étude supprimée avec succès: " + id);
            return ResponseEntity.ok(Map.of("deleted", true));
        } catch (Exception e) {
            System.err.println("Erreur lors de la suppression de la salle d'étude: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    // ======== ENDPOINTS POUR LA DISPONIBILITÉ DES SALLES ========
    
    /**
     * Endpoint pour vérifier la disponibilité d'une salle spécifique à une date donnée
     */
    @GetMapping("/classrooms/{id}/availability")
    public ResponseEntity<AvailabilityDTO> checkClassroomAvailability(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        
        System.out.println("GET /api/rooms/classrooms/" + id + "/availability");
        System.out.println("Date: " + date);
        
        AvailabilityDTO availability = roomService.checkClassroomAvailability(id, date);
        return ResponseEntity.ok(availability);
    }
    
    /**
     * Endpoint pour rechercher des salles disponibles en fonction des critères
     */
    @GetMapping("/search")
    public ResponseEntity<List<ClassroomDTO>> searchAvailableRooms(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date date,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "0") int minCapacity) {
        
        System.out.println("GET /api/rooms/search");
        System.out.println("Critères: date=" + date + ", horaire=" + startTime + "-" + endTime + 
                          ", type=" + type + ", capacité min=" + minCapacity);
        
        List<ClassroomDTO> availableRooms = roomService.findAvailableRooms(date, startTime, endTime, type, minCapacity);
        return ResponseEntity.ok(availableRooms);
    }
    
    /**
     * Endpoint pour obtenir les plages horaires disponibles pour une salle spécifique à une date donnée
     */
    @GetMapping("/classrooms/{id}/available-times")
    public ResponseEntity<List<String>> getAvailableTimeSlots(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        
        System.out.println("GET /api/rooms/classrooms/" + id + "/available-times");
        System.out.println("Date: " + date);
        
        List<String> availableTimeSlots = roomService.getAvailableTimeSlots(id, date);
        return ResponseEntity.ok(availableTimeSlots);
    }
    
    /**
     * Endpoint pour vérifier si une salle est disponible pour une plage horaire spécifique
     */
    @GetMapping("/classrooms/{id}/check")
    public ResponseEntity<ResponseMessageDTO> isClassroomAvailable(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        
        System.out.println("GET /api/rooms/classrooms/" + id + "/check");
        System.out.println("Date: " + date + ", horaire: " + startTime + "-" + endTime);
        
        boolean isAvailable = roomService.isRoomAvailable(id, date, startTime, endTime);
        
        ResponseMessageDTO response = new ResponseMessageDTO(
            isAvailable ? "La salle est disponible pour cette plage horaire" : "La salle n'est pas disponible pour cette plage horaire",
            isAvailable
        );
        
        return ResponseEntity.ok(response);
    }
}