package com.campusroom.controller;

import com.campusroom.dto.*;
import com.campusroom.service.AdminService;
import com.campusroom.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;
    
    @Autowired
    private ReservationService reservationService;
    
    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }
    
    @GetMapping("/dashboard/notifications")
    public ResponseEntity<List<NotificationDTO>> getNotifications() {
        return ResponseEntity.ok(adminService.getNotifications());
    }
    
    @GetMapping("/dashboard/recent-reservations")
    public ResponseEntity<List<ReservationDTO>> getRecentReservations() {
        return ResponseEntity.ok(reservationService.getRecentReservations());
    }
    
    @GetMapping("/dashboard/pending-demands")
    public ResponseEntity<List<DemandDTO>> getPendingDemands() {
        return ResponseEntity.ok(reservationService.getPendingDemands());
    }
    
    @GetMapping("/reports")
    public ResponseEntity<ReportDataDTO> getReportsData() {
        return ResponseEntity.ok(adminService.getReportsData());
    }
    
    @PutMapping("/approve-reservation/{id}")
    public ResponseEntity<ReservationDTO> approveReservation(@PathVariable String id) {
        System.out.println("PUT /api/admin/approve-reservation/" + id);
        return ResponseEntity.ok(reservationService.approveReservation(id));
    }

  @PutMapping("/reject-reservation/{id}")
public ResponseEntity<ReservationDTO> rejectReservation(
        @PathVariable String id,
        @RequestBody(required = false) Map<String, String> requestBody) {
    System.out.println("PUT /api/admin/reject-reservation/" + id);
    String reason = requestBody != null ? requestBody.get("reason") : null;
    return ResponseEntity.ok(reservationService.rejectReservation(id, reason));
}
    @GetMapping("/user-notifications/{userId}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long userId) {
        System.out.println("GET /api/admin/user-notifications/" + userId);
        return ResponseEntity.ok(adminService.getUserNotifications(userId));
    }
}