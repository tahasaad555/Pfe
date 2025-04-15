package com.campusroom.controller;

import com.campusroom.dto.UserDTO;
import com.campusroom.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    @Autowired
    private UserManagementService userService;
    
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<UserDTO>> getUsersByStatus(@PathVariable String status) {
        return ResponseEntity.ok(userService.getUsersByStatus(status));
    }
    
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody Map<String, Object> userMap) {
        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName((String) userMap.get("firstName"));
        userDTO.setLastName((String) userMap.get("lastName"));
        userDTO.setEmail((String) userMap.get("email"));
        userDTO.setRole((String) userMap.get("role"));
        userDTO.setStatus((String) userMap.get("status"));
        
        String password = (String) userMap.get("password");
        
        return ResponseEntity.ok(userService.createUser(userDTO, password));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(userService.updateUser(id, userDTO));
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<UserDTO> changeUserStatus(@PathVariable Long id, @RequestBody Map<String, String> statusMap) {
        String status = statusMap.get("status");
        return ResponseEntity.ok(userService.changeUserStatus(id, status));
    }
    
    @PutMapping("/{id}/password")
    public ResponseEntity<Map<String, Boolean>> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> passwordMap) {
        String password = passwordMap.get("password");
        userService.resetPassword(id, password);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}